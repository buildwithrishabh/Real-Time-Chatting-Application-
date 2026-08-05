import { getSocket } from '../socket/client';
import { SOCKET_EVENTS } from '../socket/events';
import { useCallStore } from '../store/call.store';
import { TURN_PASSWORD, TURN_URL, TURN_USERNAME } from './constants';
import type {
  CallType,
  CallPeer,
  IncomingCallPayload,
  CallAcceptedPayload,
  CallRejectedPayload,
  CallEndedPayload,
  CallRingingPayload,
  IceCandidatePayload,
  ToggleMediaPayload,
} from '../types/call';

function buildRTCConfig(): RTCConfiguration {
  const iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  if (TURN_URL) {
    const turnServer: RTCIceServer = { urls: TURN_URL };
    if (TURN_USERNAME) {
      turnServer.username = TURN_USERNAME;
      turnServer.credential = TURN_PASSWORD;
    }
    iceServers.push(turnServer);
  }

  return { iceServers, iceCandidatePoolSize: 8 };
}

const RTC_CONFIG = buildRTCConfig();

class RingtonePlayer {
  private ctx: AudioContext | null = null;
  private intervalId: number | null = null;

  startRinging() {
    this.stop();
    try {
      this.ctx =
        new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      // Resume in case the context was created outside a user gesture (e.g. the
      // callee's ringtone triggered by a socket event) and is thus suspended.
      void this.ctx.resume();
      const playBeep = () => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 1.2);
      };

      playBeep();
      this.intervalId = window.setInterval(playBeep, 2500);
    } catch {
      // AudioContext play error fallback
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

/**
 * Singleton WebRTC manager.
 *
 * Owns the single RTCPeerConnection, the ICE candidate queues, ringtone and
 * call duration timer for the whole application. All socket `call:*` events
 * are routed through the {@link useCallSocketListener} hook into the public
 * `handle*` methods below, so no component ever attaches its own listeners.
 */
class WebRTCManager {
  private pcRef: RTCPeerConnection | null = null;

  /** Incoming candidates received from the peer before a remote description is set. */
  private receivedIceQueue: RTCIceCandidateInit[] = [];

  /** Locally generated candidates waiting for the server-issued callId. */
  private outgoingIceQueue: RTCIceCandidateInit[] = [];

  /** Pre-acquired local media for an incoming call, started while ringing. */
  private pendingMedia: Promise<MediaStream | null> | null = null;

  /** Guards acceptCall against double-invocation while media is connecting. */
  private isAccepting = false;

  private timerRef: number | null = null;
  private ringtone = new RingtonePlayer();
  private invalidateCallHistory: (() => void) | null = null;

  constructor() {
    useCallStore.subscribe((state) => {
      if (state.callStatus === 'connected') {
        if (this.timerRef === null) {
          this.timerRef = window.setInterval(() => {
            useCallStore.getState().incrementDuration();
          }, 1000);
        }
      } else if (this.timerRef !== null) {
        clearInterval(this.timerRef);
        this.timerRef = null;
      }
    });
  }

  setCallHistoryInvalidator(invalidate: () => void) {
    this.invalidateCallHistory = invalidate;
  }

  // ==========================================
  // Internal helpers
  // ==========================================

  private closePeerConnection() {
    if (this.pcRef) {
      this.pcRef.onicecandidate = null;
      this.pcRef.ontrack = null;
      this.pcRef.close();
      this.pcRef = null;
    }
  }

  private fullCleanup() {
    this.ringtone.stop();
    this.closePeerConnection();
    this.receivedIceQueue = [];
    this.outgoingIceQueue = [];

    const pending = this.pendingMedia;
    this.pendingMedia = null;
    this.isAccepting = false;
    if (pending) {
      void pending.then((stream) => {
        if (stream && useCallStore.getState().callStatus === 'idle') {
          stream.getTracks().forEach((track) => track.stop());
          useCallStore.getState().setLocalStream(null);
        }
      });
    }

    useCallStore.getState().resetCallState();
    this.invalidateCallHistory?.();
  }

  private createPeerConnection(targetUserId: string): RTCPeerConnection {
    this.closePeerConnection();

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.pcRef = pc;

    const remoteMediaStream = new MediaStream();
    useCallStore.getState().setRemoteStream(remoteMediaStream);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.emitIceCandidate(targetUserId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          remoteMediaStream.addTrack(track);
        });
      } else {
        remoteMediaStream.addTrack(event.track);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        // Only flip to "connected" once media is actually established so the
        // UI, ringtone stop and duration timer reflect real audio/video flow.
        const callId = useCallStore.getState().callId;
        if (callId) {
          useCallStore.getState().setCallConnected(callId);
        }
      } else if (pc.connectionState === 'failed') {
        useCallStore.getState().setErrorMessage('Unable to establish media connection.');
      }
    };

    return pc;
  }

  private emitIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit) {
    const socket = getSocket();
    const callId = useCallStore.getState().callId;

    if (!socket || !callId) {
      // Hold candidates until the server-issued callId is known.
      this.outgoingIceQueue.push(candidate);
      return;
    }

    socket.emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE, {
      targetUserId,
      candidate,
      callId,
    });
  }

  private flushOutgoingIceCandidates(targetUserId: string) {
    while (this.outgoingIceQueue.length > 0) {
      const candidate = this.outgoingIceQueue.shift();
      if (candidate) this.emitIceCandidate(targetUserId, candidate);
    }
  }

  // ==========================================
  // Public actions (consumed by UI components)
  // ==========================================

  initiateCall = async (targetPeer: CallPeer, type: CallType) => {
    const socket = getSocket();
    if (!socket) {
      useCallStore.getState().setErrorMessage('Socket not connected.');
      return;
    }

    this.pendingMedia = null;

    try {
      useCallStore.getState().startOutgoingCall(targetPeer, type);
      this.ringtone.startRinging();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      useCallStore.getState().setLocalStream(stream);

      const pc = this.createPeerConnection(targetPeer.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer({ trickle: true } as RTCOfferOptions);
      await pc.setLocalDescription(offer);

      socket.emit(SOCKET_EVENTS.CALL_INITIATE, {
        targetUserId: targetPeer.id,
        callType: type,
        offer,
      });
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Failed to initiate call:', error);
      useCallStore.getState().setErrorMessage(error.message || 'Failed to access camera/microphone.');
      this.fullCleanup();
    }
  }

  acceptCall = async () => {
    if (this.isAccepting) return;
    this.isAccepting = true;
    this.ringtone.stop();
    const socket = getSocket();
    const { peer, incomingOffer, callId, callType } = useCallStore.getState();

    if (!socket || !peer || !incomingOffer || !callId) {
      this.fullCleanup();
      return;
    }

    try {
      let stream = await (this.pendingMedia ?? null);
      this.pendingMedia = null;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video',
        });
      }
      useCallStore.getState().setLocalStream(stream);

      const pc = this.createPeerConnection(peer.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));

      // Drain queued ICE candidates received before accept.
      while (this.receivedIceQueue.length > 0) {
        const candidate = this.receivedIceQueue.shift();
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        }
      }

      const answer = await pc.createAnswer({ trickle: true } as RTCAnswerOptions);
      await pc.setLocalDescription(answer);

      socket.emit(SOCKET_EVENTS.CALL_ACCEPT, {
        callId,
        targetUserId: peer.id,
        answer,
      });
      // "Connected" UI is gated on pc.onconnectionstatechange === 'connected'.
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Failed to accept call:', error);
      useCallStore.getState().setErrorMessage(error.message || 'Failed to access camera/microphone.');
      this.fullCleanup();
    }
  }

  rejectCall = (reason = 'Call declined') => {
    const socket = getSocket();
    const { callId, peer } = useCallStore.getState();

    if (socket && callId && peer) {
      socket.emit(SOCKET_EVENTS.CALL_REJECT, {
        callId,
        targetUserId: peer.id,
        reason,
      });
    }
    this.fullCleanup();
  }

  endCall = () => {
    const socket = getSocket();
    const { callId, peer } = useCallStore.getState();

    if (socket && peer) {
      socket.emit(SOCKET_EVENTS.CALL_END, {
        callId,
        targetUserId: peer.id,
      });
    }
    this.fullCleanup();
  }

  toggleMute = () => {
    const { localStream, peer, isMuted } = useCallStore.getState();

    if (!localStream) return;

    localStream.getAudioTracks().forEach((track) => {
      track.enabled = isMuted;
    });
    const nextMuteState = !isMuted;
    useCallStore.getState().setIsMuted(nextMuteState);

    const socket = getSocket();
    if (socket && peer) {
      socket.emit(SOCKET_EVENTS.CALL_TOGGLE_MEDIA, {
        targetUserId: peer.id,
        mediaType: 'audio',
        enabled: !nextMuteState,
      });
    }
  }

  toggleVideo = () => {
    const { localStream, peer, isVideoOff } = useCallStore.getState();

    if (!localStream) return;

    localStream.getVideoTracks().forEach((track) => {
      track.enabled = isVideoOff;
    });
    const nextVideoState = !isVideoOff;
    useCallStore.getState().setIsVideoOff(nextVideoState);

    const socket = getSocket();
    if (socket && peer) {
      socket.emit(SOCKET_EVENTS.CALL_TOGGLE_MEDIA, {
        targetUserId: peer.id,
        mediaType: 'video',
        enabled: !nextVideoState,
      });
    }
  }

  // ==========================================
  // Socket event handlers (server -> client)
  // ==========================================

  handleCallRinging = (payload: CallRingingPayload) => {
    useCallStore.getState().setCallId(payload.callId);
    const peer = useCallStore.getState().peer;
    if (peer) {
      this.flushOutgoingIceCandidates(peer.id);
    }
  }

  handleIncomingCall = (payload: IncomingCallPayload) => {
    const socket = getSocket();
    const { callStatus } = useCallStore.getState();

    if (callStatus !== 'idle') {
      // Automatically send busy response if already in a call.
      socket?.emit(SOCKET_EVENTS.CALL_REJECT, {
        callId: payload.callId,
        targetUserId: payload.caller.id,
        reason: 'User is busy in another call',
      });
      return;
    }

    this.ringtone.startRinging();
    useCallStore.getState().setIncomingCall(
      payload.callId,
      payload.caller,
      payload.callType,
      payload.offer
    );

    // Start media acquisition in parallel with ringing so accepting the call
    // doesn't block the answer on camera/mic warm-up.
    this.pendingMedia = navigator.mediaDevices
      .getUserMedia({ audio: true, video: payload.callType === 'video' })
      .then((stream) => {
        useCallStore.getState().setLocalStream(stream);
        return stream;
      })
      .catch((err: unknown) => {
        const error = err as Error;
        console.error('Failed to pre-acquire media for incoming call:', error);
        return null;
      });
  }

  handleCallAccepted = async (payload: CallAcceptedPayload) => {
    this.ringtone.stop();

    if (this.pcRef) {
      try {
        await this.pcRef.setRemoteDescription(new RTCSessionDescription(payload.answer));
        while (this.receivedIceQueue.length > 0) {
          const candidate = this.receivedIceQueue.shift();
          if (candidate) {
            await this.pcRef.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          }
        }
      } catch (err) {
        console.error('Error setting remote description on call:accepted:', err);
      }
    }
  }

  handleCallRejected = (payload: CallRejectedPayload) => {
    this.ringtone.stop();
    useCallStore.getState().setErrorMessage(payload.reason || 'Call rejected');
    setTimeout(() => {
      this.fullCleanup();
    }, 2000);
  }

  handleIceCandidate = (payload: IceCandidatePayload) => {
    if (this.pcRef && this.pcRef.remoteDescription) {
      this.pcRef
        .addIceCandidate(new RTCIceCandidate(payload.candidate))
        .catch((err) => {
          console.error('Error adding ICE candidate:', err);
        });
    } else {
      this.receivedIceQueue.push(payload.candidate);
    }
  }

  handleToggleMedia = (payload: ToggleMediaPayload) => {
    useCallStore.getState().setRemoteMediaState(payload.mediaType, payload.enabled);
  }

  handleCallEnded = (payload: CallEndedPayload) => {
    this.ringtone.stop();
    if (payload.reason) {
      useCallStore.getState().setErrorMessage(payload.reason);
      setTimeout(() => {
        this.fullCleanup();
      }, 1500);
    } else {
      this.fullCleanup();
    }
  }

  handleCallBusy = (payload: { reason?: string }) => {
    this.ringtone.stop();
    useCallStore.getState().setErrorMessage(payload.reason || 'User is currently busy');
    setTimeout(() => {
      this.fullCleanup();
    }, 2000);
  }

  handleCallError = (payload: { message?: string }) => {
    this.ringtone.stop();
    useCallStore.getState().setErrorMessage(payload.message || 'Call failed');
    setTimeout(() => {
      this.fullCleanup();
    }, 2000);
  }

  handleSocketDisconnect = () => {
    // Backend cleans up active calls on its side; mirror cleanup locally.
    this.ringtone.stop();
    const { callStatus } = useCallStore.getState();
    if (callStatus !== 'idle') {
      this.fullCleanup();
    }
  }
}

export const webrtcManager = new WebRTCManager();

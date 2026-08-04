import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../socket/client';
import { SOCKET_EVENTS } from '../socket/events';
import { useCallStore } from '../store/call.store';
import type {
  CallType,
  CallPeer,
  IncomingCallPayload,
  CallAcceptedPayload,
  CallRejectedPayload,
  CallEndedPayload,
  IceCandidatePayload,
  ToggleMediaPayload,
} from '../types/call';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// Web Audio API Ringtone Generator (no external assets needed)
class RingtonePlayer {
  private ctx: AudioContext | null = null;
  private intervalId: number | null = null;

  startRinging() {
    this.stop();
    try {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const playBeep = () => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4 tone
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

const ringtone = new RingtonePlayer();

export function useWebRTC() {
  const queryClient = useQueryClient();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const timerRef = useRef<number | null>(null);

  const {
    callStatus,
    startOutgoingCall,
    setIncomingCall,
    setCallConnected,
    setLocalStream,
    setRemoteStream,
    setIsMuted,
    setIsVideoOff,
    setRemoteMediaState,
    setErrorMessage,
    incrementDuration,
    resetCallState,
  } = useCallStore();

  // Helper to cleanup WebRTC connection
  const closePeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    iceCandidatesQueue.current = [];
  }, []);

  const fullCleanup = useCallback(() => {
    ringtone.stop();
    closePeerConnection();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    resetCallState();
    queryClient.invalidateQueries({ queryKey: ['call-history'] });
  }, [closePeerConnection, resetCallState, queryClient]);

  // Create Peer Connection instance
  const createPeerConnection = useCallback(
    (targetUserId: string) => {
      closePeerConnection();

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      const remoteMediaStream = new MediaStream();
      setRemoteStream(remoteMediaStream);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = getSocket();
          socket?.emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE, {
            targetUserId,
            candidate: event.candidate,
            callId: useCallStore.getState().callId,
          });
        }
      };

      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => {
          remoteMediaStream.addTrack(track);
        });
      };

      return pc;
    },
    [closePeerConnection, setRemoteStream]
  );

  // 1. INITIATE OUTGOING CALL
  const initiateCall = useCallback(
    async (targetPeer: CallPeer, type: CallType) => {
      const socket = getSocket();
      if (!socket) {
        setErrorMessage('Socket not connected.');
        return;
      }

      try {
        startOutgoingCall(targetPeer, type);
        ringtone.startRinging();

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video',
        });
        setLocalStream(stream);

        const pc = createPeerConnection(targetPeer.id);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit(SOCKET_EVENTS.CALL_INITIATE, {
          targetUserId: targetPeer.id,
          callType: type,
          offer,
        });
      } catch (err: unknown) {
        const error = err as Error;
        console.error('Failed to initiate call:', error);
        setErrorMessage(error.message || 'Failed to access camera/microphone.');
        fullCleanup();
      }
    },
    [startOutgoingCall, setLocalStream, createPeerConnection, setErrorMessage, fullCleanup]
  );

  // 2. ACCEPT INCOMING CALL
  const acceptCall = useCallback(async () => {
    ringtone.stop();
    const socket = getSocket();
    const currentPeer = useCallStore.getState().peer;
    const currentOffer = useCallStore.getState().incomingOffer;
    const currentCallId = useCallStore.getState().callId;
    const currentCallType = useCallStore.getState().callType;

    if (!socket || !currentPeer || !currentOffer || !currentCallId) {
      fullCleanup();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: currentCallType === 'video',
      });
      setLocalStream(stream);

      const pc = createPeerConnection(currentPeer.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(currentOffer));

      // Drain queued ICE candidates
      while (iceCandidatesQueue.current.length > 0) {
        const cand = iceCandidatesQueue.current.shift();
        if (cand) {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit(SOCKET_EVENTS.CALL_ACCEPT, {
        callId: currentCallId,
        targetUserId: currentPeer.id,
        answer,
      });

      setCallConnected(currentCallId);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Failed to accept call:', error);
      setErrorMessage(error.message || 'Failed to access camera/microphone.');
      fullCleanup();
    }
  }, [setLocalStream, createPeerConnection, setCallConnected, setErrorMessage, fullCleanup]);

  // 3. REJECT CALL
  const rejectCall = useCallback(
    (reason = 'Call declined') => {
      const socket = getSocket();
      const currentCallId = useCallStore.getState().callId;
      const currentPeer = useCallStore.getState().peer;

      if (socket && currentCallId && currentPeer) {
        socket.emit(SOCKET_EVENTS.CALL_REJECT, {
          callId: currentCallId,
          targetUserId: currentPeer.id,
          reason,
        });
      }
      fullCleanup();
    },
    [fullCleanup]
  );

  // 4. END CALL
  const endCall = useCallback(() => {
    const socket = getSocket();
    const currentCallId = useCallStore.getState().callId;
    const currentPeer = useCallStore.getState().peer;

    if (socket && currentPeer) {
      socket.emit(SOCKET_EVENTS.CALL_END, {
        callId: currentCallId,
        targetUserId: currentPeer.id,
      });
    }
    fullCleanup();
  }, [fullCleanup]);

  // 5. TOGGLE MICROPHONE
  const toggleMute = useCallback(() => {
    const localStream = useCallStore.getState().localStream;
    const currentPeer = useCallStore.getState().peer;
    const currentMute = useCallStore.getState().isMuted;

    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = currentMute;
      });
      const nextMuteState = !currentMute;
      setIsMuted(nextMuteState);

      const socket = getSocket();
      if (socket && currentPeer) {
        socket.emit(SOCKET_EVENTS.CALL_TOGGLE_MEDIA, {
          targetUserId: currentPeer.id,
          mediaType: 'audio',
          enabled: !nextMuteState,
        });
      }
    }
  }, [setIsMuted]);

  // 6. TOGGLE CAMERA VIDEO
  const toggleVideo = useCallback(() => {
    const localStream = useCallStore.getState().localStream;
    const currentPeer = useCallStore.getState().peer;
    const currentVideoOff = useCallStore.getState().isVideoOff;

    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = currentVideoOff;
      });
      const nextVideoState = !currentVideoOff;
      setIsVideoOff(nextVideoState);

      const socket = getSocket();
      if (socket && currentPeer) {
        socket.emit(SOCKET_EVENTS.CALL_TOGGLE_MEDIA, {
          targetUserId: currentPeer.id,
          mediaType: 'video',
          enabled: !nextVideoState,
        });
      }
    }
  }, [setIsVideoOff]);

  // Handle Socket Events Lifecycle
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Server -> Client Handlers
    const handleIncomingCall = (payload: IncomingCallPayload) => {
      if (useCallStore.getState().callStatus !== 'idle') {
        // Automatically send busy response if already in a call
        socket.emit(SOCKET_EVENTS.CALL_REJECT, {
          callId: payload.callId,
          targetUserId: payload.caller.id,
          reason: 'User is busy in another call',
        });
        return;
      }

      ringtone.startRinging();
      setIncomingCall(payload.callId, payload.caller, payload.callType, payload.offer);
    };

    const handleCallAccepted = async (payload: CallAcceptedPayload) => {
      ringtone.stop();
      setCallConnected(payload.callId);

      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
          while (iceCandidatesQueue.current.length > 0) {
            const cand = iceCandidatesQueue.current.shift();
            if (cand) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
            }
          }
        } catch (err) {
          console.error('Error setting remote description on call:accepted:', err);
        }
      }
    };

    const handleCallRejected = (payload: CallRejectedPayload) => {
      ringtone.stop();
      setErrorMessage(payload.reason || 'Call rejected');
      setTimeout(() => {
        fullCleanup();
      }, 2000);
    };

    const handleIceCandidate = async (payload: IceCandidatePayload) => {
      if (pcRef.current && pcRef.current.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      } else {
        iceCandidatesQueue.current.push(payload.candidate);
      }
    };

    const handleToggleMedia = (payload: ToggleMediaPayload) => {
      setRemoteMediaState(payload.mediaType, payload.enabled);
    };

    const handleCallEnded = (payload: CallEndedPayload) => {
      ringtone.stop();
      if (payload.reason) {
        setErrorMessage(payload.reason);
        setTimeout(fullCleanup, 1500);
      } else {
        fullCleanup();
      }
    };

    const handleCallBusy = (payload: { reason?: string }) => {
      ringtone.stop();
      setErrorMessage(payload.reason || 'User is currently busy');
      setTimeout(fullCleanup, 2000);
    };

    const handleCallError = (payload: { message?: string }) => {
      ringtone.stop();
      setErrorMessage(payload.message || 'Call failed');
      setTimeout(fullCleanup, 2000);
    };

    socket.on(SOCKET_EVENTS.CALL_INCOMING, handleIncomingCall);
    socket.on(SOCKET_EVENTS.CALL_ACCEPTED, handleCallAccepted);
    socket.on(SOCKET_EVENTS.CALL_REJECTED, handleCallRejected);
    socket.on(SOCKET_EVENTS.CALL_ICE_CANDIDATE, handleIceCandidate);
    socket.on(SOCKET_EVENTS.CALL_TOGGLE_MEDIA, handleToggleMedia);
    socket.on(SOCKET_EVENTS.CALL_ENDED, handleCallEnded);
    socket.on(SOCKET_EVENTS.CALL_BUSY, handleCallBusy);
    socket.on(SOCKET_EVENTS.CALL_ERROR, handleCallError);

    return () => {
      socket.off(SOCKET_EVENTS.CALL_INCOMING, handleIncomingCall);
      socket.off(SOCKET_EVENTS.CALL_ACCEPTED, handleCallAccepted);
      socket.off(SOCKET_EVENTS.CALL_REJECTED, handleCallRejected);
      socket.off(SOCKET_EVENTS.CALL_ICE_CANDIDATE, handleIceCandidate);
      socket.off(SOCKET_EVENTS.CALL_TOGGLE_MEDIA, handleToggleMedia);
      socket.off(SOCKET_EVENTS.CALL_ENDED, handleCallEnded);
      socket.off(SOCKET_EVENTS.CALL_BUSY, handleCallBusy);
      socket.off(SOCKET_EVENTS.CALL_ERROR, handleCallError);
    };
  }, [setIncomingCall, setCallConnected, setRemoteMediaState, setErrorMessage, fullCleanup]);

  // Duration Timer Interval
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = window.setInterval(() => {
        incrementDuration();
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callStatus, incrementDuration]);

  return {
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}

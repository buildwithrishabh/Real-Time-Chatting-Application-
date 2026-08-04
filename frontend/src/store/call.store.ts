import { create } from 'zustand';
import type { CallStatus, CallType, CallPeer } from '../types/call';

interface CallStoreState {
  callStatus: CallStatus;
  callId: string | null;
  callType: CallType;
  peer: CallPeer | null;
  incomingOffer: RTCSessionDescriptionInit | null;

  isMuted: boolean;
  isVideoOff: boolean;
  remoteIsMuted: boolean;
  remoteIsVideoOff: boolean;

  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDuration: number;
  errorMessage: string | null;

  // Actions
  setCallStatus: (status: CallStatus) => void;
  setCallId: (callId: string | null) => void;
  startOutgoingCall: (peer: CallPeer, callType: CallType) => void;
  setIncomingCall: (callId: string, caller: CallPeer, callType: CallType, offer: RTCSessionDescriptionInit) => void;
  setCallConnected: (callId: string) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setIsMuted: (isMuted: boolean) => void;
  setIsVideoOff: (isVideoOff: boolean) => void;
  setRemoteMediaState: (mediaType: 'audio' | 'video', enabled: boolean) => void;
  setErrorMessage: (msg: string | null) => void;
  incrementDuration: () => void;
  resetCallState: () => void;
}

export const useCallStore = create<CallStoreState>((set) => ({
  callStatus: 'idle',
  callId: null,
  callType: 'audio',
  peer: null,
  incomingOffer: null,

  isMuted: false,
  isVideoOff: false,
  remoteIsMuted: false,
  remoteIsVideoOff: false,

  localStream: null,
  remoteStream: null,
  callDuration: 0,
  errorMessage: null,

  setCallStatus: (status) => set({ callStatus: status }),

  setCallId: (callId) => set({ callId }),

  startOutgoingCall: (peer, callType) =>
    set({
      callStatus: 'outgoing',
      peer,
      callType,
      errorMessage: null,
      callDuration: 0,
      isMuted: false,
      isVideoOff: callType === 'audio',
      remoteIsMuted: false,
      remoteIsVideoOff: callType === 'audio',
    }),

  setIncomingCall: (callId, caller, callType, offer) =>
    set({
      callStatus: 'incoming',
      callId,
      peer: caller,
      callType,
      incomingOffer: offer,
      errorMessage: null,
      callDuration: 0,
      isMuted: false,
      isVideoOff: callType === 'audio',
      remoteIsMuted: false,
      remoteIsVideoOff: callType === 'audio',
    }),

  setCallConnected: (callId) => set({ callStatus: 'connected', callId, errorMessage: null }),

  setLocalStream: (stream) => set({ localStream: stream }),

  setRemoteStream: (stream) => set({ remoteStream: stream }),

  setIsMuted: (isMuted) => set({ isMuted }),

  setIsVideoOff: (isVideoOff) => set({ isVideoOff }),

  setRemoteMediaState: (mediaType, enabled) =>
    set((state) => ({
      remoteIsMuted: mediaType === 'audio' ? !enabled : state.remoteIsMuted,
      remoteIsVideoOff: mediaType === 'video' ? !enabled : state.remoteIsVideoOff,
    })),

  setErrorMessage: (errorMessage) => set({ errorMessage }),

  incrementDuration: () => set((state) => ({ callDuration: state.callDuration + 1 })),

  resetCallState: () =>
    set((state) => {
      // Clean up MediaStreams tracks if present
      if (state.localStream) {
        state.localStream.getTracks().forEach((track) => track.stop());
      }
      if (state.remoteStream) {
        state.remoteStream.getTracks().forEach((track) => track.stop());
      }

      return {
        callStatus: 'idle',
        callId: null,
        callType: 'audio',
        peer: null,
        incomingOffer: null,
        isMuted: false,
        isVideoOff: false,
        remoteIsMuted: false,
        remoteIsVideoOff: false,
        localStream: null,
        remoteStream: null,
        callDuration: 0,
        errorMessage: null,
      };
    }),
}));

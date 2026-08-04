import { webrtcManager } from '../lib/webrtc.manager';

/**
 * Thin action hook exposing the shared WebRTC call actions.
 *
 * All socket event listeners, the RTCPeerConnection, ICE queues, ringtone and
 * call duration timer live in the singleton {@link webrtcManager} and are
 * wired once via {@link useCallSocketListener} in <App />. Components using
 * this hook therefore never attach duplicate socket listeners.
 */
export function useWebRTC() {
  return {
    initiateCall: webrtcManager.initiateCall,
    acceptCall: webrtcManager.acceptCall,
    rejectCall: webrtcManager.rejectCall,
    endCall: webrtcManager.endCall,
    toggleMute: webrtcManager.toggleMute,
    toggleVideo: webrtcManager.toggleVideo,
  };
}

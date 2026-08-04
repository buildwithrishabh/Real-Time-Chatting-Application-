import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../socket/client';
import { SOCKET_EVENTS } from '../socket/events';
import { useSocketStore } from '../store/socket.store';
import { webrtcManager } from '../lib/webrtc.manager';

/**
 * Single, global subscription point for all socket `call:*` events.
 *
 * Mounted exactly once in <App />. Re-subscribes automatically whenever the
 * socket connects (or reconnects), so no other component ever attaches its own
 * listeners — eliminating the duplicate-listener auto-reject race.
 */
export function useCallSocketListener() {
  const isConnected = useSocketStore((s) => s.isConnected);
  const queryClient = useQueryClient();

  useEffect(() => {
    webrtcManager.setCallHistoryInvalidator(() => {
      void queryClient.invalidateQueries({ queryKey: ['call-history'] });
    });
  }, [queryClient]);

  useEffect(() => {
    if (!isConnected) return;

    const socket = getSocket();
    if (!socket) return;

    type CallEventHandler = (...args: any[]) => void;

    const subscriptions: Array<[string, CallEventHandler]> = [
      [SOCKET_EVENTS.CALL_RINGING, webrtcManager.handleCallRinging as CallEventHandler],
      [SOCKET_EVENTS.CALL_INCOMING, webrtcManager.handleIncomingCall as CallEventHandler],
      [SOCKET_EVENTS.CALL_ACCEPTED, webrtcManager.handleCallAccepted as CallEventHandler],
      [SOCKET_EVENTS.CALL_REJECTED, webrtcManager.handleCallRejected as CallEventHandler],
      [SOCKET_EVENTS.CALL_ENDED, webrtcManager.handleCallEnded as CallEventHandler],
      [SOCKET_EVENTS.CALL_ICE_CANDIDATE, webrtcManager.handleIceCandidate as CallEventHandler],
      [SOCKET_EVENTS.CALL_TOGGLE_MEDIA, webrtcManager.handleToggleMedia as CallEventHandler],
      [SOCKET_EVENTS.CALL_BUSY, webrtcManager.handleCallBusy as CallEventHandler],
      [SOCKET_EVENTS.CALL_ERROR, webrtcManager.handleCallError as CallEventHandler],
    ];

    subscriptions.forEach(([event, handler]) => socket.on(event, handler));

    const handleDisconnect = () => webrtcManager.handleSocketDisconnect();
    socket.on('disconnect', handleDisconnect);

    return () => {
      subscriptions.forEach(([event, handler]) => socket.off(event, handler));
      socket.off('disconnect', handleDisconnect);
    };
  }, [isConnected]);
}

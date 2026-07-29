import { useEffect, useState } from 'react';
import { getSocket } from '../socket/client';

export function usePresence(userId?: string) {
  const [status, setStatus] = useState<'online' | 'offline'>('offline');
  const [lastSeenAt, setLastSeenAt] = useState<string | undefined>();

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleStatusChange = (data: { userId: string; status: 'online' | 'offline'; lastSeenAt?: string }) => {
      if (data.userId === userId) {
        setStatus(data.status);
        if (data.lastSeenAt) setLastSeenAt(data.lastSeenAt);
      }
    };

    socket.on('user:status_change', handleStatusChange);

    return () => {
      socket.off('user:status_change', handleStatusChange);
    };
  }, [userId]);

  return { status, lastSeenAt };
}

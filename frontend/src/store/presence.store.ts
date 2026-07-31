import { create } from 'zustand';
import { getSocket } from '../socket/client';

interface PresenceState {
  onlineUsers: Record<string, 'online' | 'offline'>;
  lastSeen: Record<string, string | undefined>;
  setOnline: (userId: string) => void;
  setOffline: (userId: string, lastSeenAt?: string) => void;
  syncPresence: (userIds: string[]) => void;
  initListener: () => () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: {},
  lastSeen: {},

  setOnline: (userId) =>
    set((state) => {
      const nextLastSeen = { ...state.lastSeen };
      delete nextLastSeen[userId];
      return {
        onlineUsers: { ...state.onlineUsers, [userId]: 'online' },
        lastSeen: nextLastSeen,
      };
    }),

  setOffline: (userId, lastSeenAt) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: 'offline' },
      lastSeen: lastSeenAt ? { ...state.lastSeen, [userId]: lastSeenAt } : state.lastSeen,
    })),

  syncPresence: (userIds) => {
    const socket = getSocket();
    if (!socket?.connected || !userIds.length) return;
    const uniqueIds = [...new Set(userIds.map((id) => id.toString()))];
    socket.emit(
      'presence:query',
      { userIds: uniqueIds },
      (response: {
        success: boolean;
        data?: Record<string, { status: 'online' | 'offline'; lastSeenAt?: string }>;
      }) => {
        if (!response?.success || !response.data) return;
        const { setOnline, setOffline } = get();
        for (const [userId, info] of Object.entries(response.data)) {
          if (info.status === 'online') setOnline(userId);
          else setOffline(userId, info.lastSeenAt);
        }
      }
    );
  },

  initListener: () => {
    const socket = getSocket();
    if (!socket) return () => {};

    const handler = (data: { userId: string; status: 'online' | 'offline'; lastSeenAt?: string }) => {
      if (data.status === 'online') {
        get().setOnline(data.userId);
      } else {
        get().setOffline(data.userId, data.lastSeenAt);
      }
    };

    socket.on('user:status_change', handler);
    return () => {
      socket.off('user:status_change', handler);
    };
  },
}));

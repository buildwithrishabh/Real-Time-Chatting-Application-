import { create } from 'zustand';
import { getSocket } from '../socket/client';

interface PresenceState {
  onlineUsers: Record<string, 'online' | 'offline'>;
  lastSeen: Record<string, string | undefined>;
  setOnline: (userId: string) => void;
  setOffline: (userId: string, lastSeenAt?: string) => void;
  initListener: () => () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: {},
  lastSeen: {},

  setOnline: (userId) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: 'online' },
    })),

  setOffline: (userId, lastSeenAt) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: 'offline' },
      lastSeen: lastSeenAt ? { ...state.lastSeen, [userId]: lastSeenAt } : state.lastSeen,
    })),

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

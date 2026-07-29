import { create } from 'zustand';

interface SocketState {
  isConnected: boolean;
  socketId: string | null;
  setConnected: (connected: boolean) => void;
  setSocketId: (id: string | null) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  socketId: null,
  setConnected: (isConnected) => set({ isConnected }),
  setSocketId: (socketId) => set({ socketId }),
}));

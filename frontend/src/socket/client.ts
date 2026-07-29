import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { useSocketStore } from '../store/socket.store';
import { WS_URL } from '../lib/constants';

let socket: Socket | null = null;

export function connectSocket(): Socket | null {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    auth: { token: `Bearer ${token}` },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    useSocketStore.getState().setConnected(true);
    useSocketStore.getState().setSocketId(socket?.id || null);
  });

  socket.on('disconnect', (reason) => {
    useSocketStore.getState().setConnected(false);
    useSocketStore.getState().setSocketId(null);
    if (reason === 'io server disconnect') {
      reconnectWithNewToken();
    }
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
}

function reconnectWithNewToken() {
  socket?.removeAllListeners();
  socket?.close();
  socket = null;
  connectSocket();
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.close();
    socket = null;
  }
  useSocketStore.getState().setConnected(false);
  useSocketStore.getState().setSocketId(null);
}

export function getSocket(): Socket | null {
  return socket;
}

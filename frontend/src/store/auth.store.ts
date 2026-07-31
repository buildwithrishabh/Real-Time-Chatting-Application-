import { create } from 'zustand';
import type { User } from '../types/user';

function normalizeUser(user: User): User {
  const backendId = user._id || user.id;
  return {
    ...user,
    _id: backendId || '',
  };
}

function getOrCreateDeviceId(): string {
  const STORAGE_KEY = 'chat_device_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);
  if (deviceId) {
    return deviceId;
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    navigator.hardwareConcurrency || 4,
  ].join('|');

  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  deviceId = `${Math.abs(hash).toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  localStorage.setItem(STORAGE_KEY, deviceId);
  return deviceId;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  deviceId: string;
  isAuthenticated: boolean;
  isProfileComplete: boolean;

  setAuth: (accessToken: string, user: User, isProfileComplete?: boolean) => void;
  setProfileComplete: (complete: boolean) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  deviceId: getOrCreateDeviceId(),
  isAuthenticated: false,
  isProfileComplete: false,

  setAuth: (accessToken, user, isProfileComplete) =>
    set({
      accessToken,
      user: normalizeUser(user),
      isAuthenticated: true,
      isProfileComplete: isProfileComplete ?? user.isProfileComplete ?? true,
    }),

  setProfileComplete: (isProfileComplete) => set({ isProfileComplete }),

  setUser: (user) => set({ user: normalizeUser(user) }),

  clearAuth: () =>
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isProfileComplete: false,
    }),
}));

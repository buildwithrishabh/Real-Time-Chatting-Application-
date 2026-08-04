export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';

// Optional TURN server for reliable WebRTC media on restrictive NATs.
// Leave empty to fall back to STUN-only ICE gathering.
export const TURN_URL = import.meta.env.VITE_TURN_URL || '';
export const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || '';
export const TURN_PASSWORD = import.meta.env.VITE_TURN_PASSWORD || '';

export const PAGINATION = {
  CONVERSATIONS_LIMIT: 15,
  MESSAGES_LIMIT: 50,
  NOTIFICATIONS_LIMIT: 20,
} as const;

export const RATE_LIMITS = {
  SEND_MESSAGE: { limit: 60, windowMs: 60000 },
  CREATE_CHAT: { limit: 30, windowMs: 60000 },
  REACT: { limit: 30, windowMs: 60000 },
  FILE_SIGN: { limit: 30, windowMs: 60000 },
} as const;

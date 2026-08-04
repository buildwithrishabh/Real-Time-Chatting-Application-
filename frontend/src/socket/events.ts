export const SOCKET_EVENTS = {
  // Client -> Server
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  MESSAGE_SEND: 'message:send',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  MESSAGE_READ: 'message:read',

  // Server -> Client
  MESSAGE_NEW: 'message:new',
  TYPING_STATUS: 'typing:status',
  RECEIPT_UPDATED: 'receipt:updated',
  USER_STATUS_CHANGE: 'user:status_change',
  NOTIFICATION_RECEIVED: 'notification:received',
  FILE_SCAN_STATUS: 'file:scan_status',
  // WebRTC Call Events
  CALL_INITIATE: 'call:initiate',
  CALL_INCOMING: 'call:incoming',
  CALL_ACCEPT: 'call:accept',
  CALL_ACCEPTED: 'call:accepted',
  CALL_REJECT: 'call:reject',
  CALL_REJECTED: 'call:rejected',
  CALL_ICE_CANDIDATE: 'call:ice-candidate',
  CALL_TOGGLE_MEDIA: 'call:toggle-media',
  CALL_END: 'call:end',
  CALL_ENDED: 'call:ended',
  CALL_BUSY: 'call:busy',
  CALL_ERROR: 'call:error',
} as const;

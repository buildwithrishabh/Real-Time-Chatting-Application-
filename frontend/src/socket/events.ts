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
} as const;

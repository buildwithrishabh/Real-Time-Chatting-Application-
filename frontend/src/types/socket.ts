import type { Message } from './message';
import type { Notification } from './notification';

export interface SocketEvents {
  // Client -> Server
  'room:join': (data: { conversationId: string }) => void;
  'room:leave': (data: { conversationId: string }) => void;
  'message:send': (
    data: {
      conversationId: string;
      content?: string;
      fileId?: string;
      tempId: string;
    },
    ack: (response: { success: boolean; data?: Message; error?: string }) => void
  ) => void;
  'typing:start': (data: { conversationId: string }) => void;
  'typing:stop': (data: { conversationId: string }) => void;
  'message:read': (data: { conversationId: string; messageId: string }) => void;

  // Server -> Client
  'message:new': (message: Message) => void;
  'typing:status': (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
  'receipt:updated': (data: {
    conversationId: string;
    userId: string;
    messageId: string;
    status: 'read';
    timestamp: string;
  }) => void;
  'user:status_change': (data: {
    userId: string;
    status: 'online' | 'offline';
    lastSeenAt?: string;
  }) => void;
  'notification:received': (notification: Notification) => void;
  'file:scan_status': (data: {
    fileId: string;
    publicId: string;
    virusScanStatus: 'passed' | 'failed';
  }) => void;
}

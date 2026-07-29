export type NotificationType =
  | 'NEW_MESSAGE'
  | 'MENTION'
  | 'GROUP_INVITE'
  | 'GROUP_ROLE_UPDATE'
  | 'SYSTEM_ALERT';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: string;
  type: NotificationType;
  title: string;
  body: string;
  chatId?: string;
  messageId?: string;
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

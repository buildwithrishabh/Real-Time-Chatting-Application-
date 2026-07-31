export type NotificationType =
  | 'NEW_MESSAGE'
  | 'MENTION'
  | 'GROUP_INVITE'
  | 'GROUP_ROLE_UPDATE'
  | 'SYSTEM_ALERT';

export interface NotificationSender {
  _id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface AppNotification {
  _id: string;
  recipient: string;
  sender?: NotificationSender | null;
  type: NotificationType;
  title: string;
  body: string;
  chatId?: string | null;
  messageId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  metadata?: Record<string, unknown>;
  activeInRoom?: boolean;
  createdAt: string;
  updatedAt: string;
}

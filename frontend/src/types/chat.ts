import type { User } from './user.ts';
import type { Message } from './message.ts';

export type ConversationType = 'private' | 'group';
export type ParticipantRole = 'member' | 'admin';

export interface Participant {
  _id: string;
  userId: User | string;
  conversationId: string;
  role: ParticipantRole;
  muted: boolean;
  archived: boolean;
  unreadCount: number;
  lastReadMessageId?: string;
  joinedAt: string;
}

export interface Conversation {
  _id: string;
  type: ConversationType;
  name?: string;
  avatarUrl?: string;
  participants: Participant[];
  lastMessageId?: Message | string | null;
  lastMessage?: Message;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

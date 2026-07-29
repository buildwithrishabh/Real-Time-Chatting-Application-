export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'zip'
  | 'document'
  | 'sticker'
  | 'gif'
  | 'location'
  | 'contact';

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  fileId?: string;
  fileUrl?: string;
  replyToMessageId?: string;
  threadId?: string;
  isPinned: boolean;
  isEdited: boolean;
  editedAt?: string;
  isDeletedForEveryone: boolean;
  deletedByUsers: string[];
  mentions: string[];
  starredBy: string[];
  reactions: Record<string, string[]>; // emoji -> userIds[]
  createdAt: string;
  updatedAt: string;
}

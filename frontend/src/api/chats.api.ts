import client from './client';
import type { ApiSuccess, CursorPage } from '../types/api';
import type { Conversation } from '../types/chat';

export const chatsApi = {
  list: async (params?: { cursor?: string; limit?: number }) => {
    const res = await client.get<ApiSuccess<CursorPage<Conversation>>>('/chats', { params });
    return res.data.data;
  },
  create: async (payload: { type: 'private' | 'group'; name?: string; participantUserIds: string[] }) => {
    const res = await client.post<ApiSuccess<Conversation>>('/chats', payload);
    return res.data.data;
  },

  addParticipant: async (conversationId: string, userId: string) => {
    const res = await client.post<ApiSuccess<Conversation>>(`/chats/${conversationId}/participants`, { userId });
    return res.data.data;
  },

  removeParticipant: async (conversationId: string, userId: string) => {
    const res = await client.delete<ApiSuccess<Conversation>>(`/chats/${conversationId}/participants/${userId}`);
    return res.data.data;
  },
};

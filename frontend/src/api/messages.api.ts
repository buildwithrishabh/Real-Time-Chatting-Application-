import client from './client';
import type { ApiSuccess, CursorPage } from '../types/api';
import type { Message } from '../types/message';

export const messagesApi = {
  list: async (conversationId: string, params?: { cursor?: string; limit?: number }) => {
    const res = await client.get<ApiSuccess<CursorPage<Message>>>(`/messages/${conversationId}`, { params });
    return res.data.data;
  },

  send: async (conversationId: string, payload: { content?: string; fileId?: string; replyToMessageId?: string }) => {
    const res = await client.post<ApiSuccess<Message>>(`/messages/${conversationId}`, payload);
    return res.data.data;
  },

  edit: async (messageId: string, content: string) => {
    const res = await client.patch<ApiSuccess<Message>>(`/messages/${messageId}`, { content });
    return res.data.data;
  },

  delete: async (messageId: string, mode: 'for_me' | 'for_everyone' = 'for_everyone') => {
    const res = await client.delete<ApiSuccess<Message>>(`/messages/${messageId}`, { data: { mode } });
    return res.data.data;
  },

  react: async (messageId: string, emoji: string) => {
    const res = await client.post<ApiSuccess<Message>>(`/messages/${messageId}/react`, { emoji });
    return res.data.data;
  },
};

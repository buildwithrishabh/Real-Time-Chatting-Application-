import client from './client';
import type { ApiSuccess, OffsetPage } from '../types/api';
import type { Notification } from '../types/notification';

export const notificationsApi = {
  list: async (page = 1, limit = 20) => {
    const res = await client.get<ApiSuccess<OffsetPage<Notification>>>('/notifications', {
      params: { page, limit },
    });
    return res.data.data;
  },

  getUnreadCount: async () => {
    const res = await client.get<ApiSuccess<{ count: number }>>('/notifications/unread-count');
    return res.data.data.count;
  },

  markRead: async (id: string) => {
    const res = await client.patch<ApiSuccess<Notification>>(`/notifications/${id}/read`);
    return res.data.data;
  },
};

import client from './client';
import type { AppNotification } from '../types/notification';

export interface GetNotificationsResponse {
  notifications: AppNotification[];
  total: number;
  page: number;
  limit: number;
}

export const notificationsApi = {
  getNotifications: async (page = 1, limit = 20): Promise<GetNotificationsResponse> => {
    const res = await client.get<GetNotificationsResponse>('/notifications', {
      params: { page, limit },
    });
    return res.data;
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const res = await client.get<{ unreadCount: number }>('/notifications/unread-count');
    return res.data;
  },

  markAsRead: async (id: string): Promise<AppNotification> => {
    const res = await client.patch<AppNotification>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const res = await client.patch<{ message: string }>('/notifications/read-all');
    return res.data;
  },

  deleteNotification: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete<{ message: string }>(`/notifications/${id}`);
    return res.data;
  },
};

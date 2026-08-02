import client from './client';
import type { ApiSuccess } from '../types/api';
import type { AppNotification } from '../types/notification';

export interface GetNotificationsResponse {
  notifications: AppNotification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const notificationsApi = {
  getNotifications: async (page = 1, limit = 20): Promise<GetNotificationsResponse> => {
    const res = await client.get<ApiSuccess<GetNotificationsResponse>>('/notifications', {
      params: { page, limit },
    });
    return res.data.data;
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const res = await client.get<ApiSuccess<{ unreadCount: number }>>('/notifications/unread-count');
    return res.data.data;
  },

  markAsRead: async (id: string): Promise<AppNotification> => {
    const res = await client.patch<ApiSuccess<AppNotification>>(`/notifications/${id}/read`);
    return res.data.data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const res = await client.patch<ApiSuccess<{ message: string }>>('/notifications/read-all');
    return res.data.data;
  },

  deleteNotification: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete<ApiSuccess<{ message: string }>>(`/notifications/${id}`);
    return res.data.data;
  },

  deleteAllNotifications: async (): Promise<{ message: string }> => {
    const res = await client.delete<ApiSuccess<{ message: string }>>('/notifications/clear-all');
    return res.data.data;
  },
};

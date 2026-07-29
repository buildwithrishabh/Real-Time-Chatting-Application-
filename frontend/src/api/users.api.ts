import client from './client';
import type { ApiSuccess } from '../types/api';
import type { User } from '../types/user';

export const usersApi = {
  getMe: async () => {
    const res = await client.get<ApiSuccess<{ user: User } | User>>('/users/me');
    const data = res.data.data;
    return 'user' in data ? (data as { user: User }).user : (data as User);
  },

  updateProfile: async (payload: { displayName?: string; bio?: string; avatarUrl?: string }) => {
    const res = await client.patch<ApiSuccess<User>>('/users/profile', payload);
    return res.data.data;
  },

  search: async (q: string) => {
    const res = await client.get<ApiSuccess<User[]>>('/users/search', { params: { q } });
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await client.get<ApiSuccess<User>>(`/users/${id}`);
    return res.data.data;
  },
};

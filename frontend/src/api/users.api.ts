import client from './client';
import type { ApiSuccess } from '../types/api';
import type { User } from '../types/user';

export const usersApi = {
  getMe: async () => {
    const res = await client.get<ApiSuccess<User>>('/users/me');
    return res.data.data;
  },

  updateProfile: async (payload: { displayName?: string; bio?: string; avatarUrl?: string }) => {
    const res = await client.patch<ApiSuccess<User>>('/users/me', payload);
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

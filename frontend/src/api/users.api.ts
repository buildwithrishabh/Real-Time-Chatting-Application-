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
    const res = await client.patch<ApiSuccess<{ user: User } | User>>('/users/profile', payload);
    const data = res.data.data;
    return 'user' in data ? (data as { user: User }).user : (data as User);
  },

  search: async (q: string) => {
    const res = await client.get<ApiSuccess<{ users: User[] } | User[]>>('/users/search', { params: { q } });
    const data = res.data.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'users' in data && Array.isArray((data as { users: User[] }).users)) {
      return (data as { users: User[] }).users;
    }
    return [];
  },

  getById: async (id: string) => {
    const res = await client.get<ApiSuccess<{ user: User } | User>>(`/users/${id}`);
    const data = res.data.data;
    return 'user' in data ? (data as { user: User }).user : (data as User);
  },

  blockUser: async (userId: string) => {
    const res = await client.post<ApiSuccess<unknown>>(`/users/${userId}/block`);
    return res.data;
  },

  unblockUser: async (userId: string) => {
    const res = await client.delete<ApiSuccess<unknown>>(`/users/${userId}/block`);
    return res.data;
  },

  listBlocked: async () => {
    const res = await client.get<ApiSuccess<User[]>>('/users/blocked');
    return res.data.data;
  },
};

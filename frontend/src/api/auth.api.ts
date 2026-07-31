import client from './client';
import type { ApiSuccess } from '../types/api';
import type { User } from '../types/user';

export interface AuthResponse {
  accessToken: string;
  user: User;
  isProfileComplete: boolean;
}

export interface RegisterResponse {
  user: Pick<User, 'username' | 'email'> & {
    id: string;
    verificationToken?: string;
  };
}

export const authApi = {
  login: async (payload: { email: string; password: string; deviceId?: string }) => {
    const res = await client.post<ApiSuccess<AuthResponse>>('/auth/login', payload);
    return res.data.data;
  },

  register: async (payload: {
    username: string;
    email: string;
    password: string;
  }) => {
    const res = await client.post<ApiSuccess<RegisterResponse>>('/auth/register', payload);
    return res.data.data;
  },

  logout: async () => {
    const res = await client.post<ApiSuccess<null>>('/auth/logout');
    return res.data;
  },

  refresh: async () => {
    const res = await client.post<ApiSuccess<AuthResponse>>('/auth/refresh');
    return res.data.data;
  },

  verifyEmail: async (token: string) => {
    const res = await client.get<ApiSuccess<null>>(`/auth/verify-email/${token}`);
    return res.data;
  },

  resendVerification: async (email: string) => {
    const res = await client.post<ApiSuccess<null>>('/auth/resend-verification', { email });
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await client.post<ApiSuccess<null>>('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const res = await client.post<ApiSuccess<null>>(`/auth/reset-password/${token}`, {
      newPassword,
    });
    return res.data;
  },
};

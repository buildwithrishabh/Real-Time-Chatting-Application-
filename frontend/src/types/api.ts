import type { User } from './user';

export interface ApiSuccess<T> {
  success: true;
  status: 'success';
  data: T;
  message?: string;
  results?: number;
}

export interface ApiError {
  success: false;
  status: 'fail' | 'error';
  message: string;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface OffsetPage<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  isProfileComplete: boolean;
}

export interface SignUploadResponse {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
  category: string;
}

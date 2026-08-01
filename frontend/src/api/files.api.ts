import client from './client';
import type { ApiSuccess, SignUploadResponse } from '../types/api';
import type { FileMeta } from '../types/file';

export const filesApi = {
  sign: async (category: string, mimeType: string) => {
    const res = await client.get<ApiSuccess<SignUploadResponse>>('/files/sign', {
      params: { type: category, mimeType },
    });
    return res.data.data;
  },

  verify: async (payload: {
    publicId: string;
    conversationId: string;
    size: number;
    mimeType: string;
    url: string;
    category: string;
    width?: number;
    height?: number;
  }) => {
    const res = await client.post<ApiSuccess<FileMeta>>('/files/verify', payload);
    return res.data.data;
  },

  getDownloadUrl: async (fileId: string) => {
    const res = await client.get<ApiSuccess<{ downloadUrl: string; filename: string; virusScanStatus?: string }>>(
      `/files/${fileId}/download`
    );
    return res.data.data;
  },
};

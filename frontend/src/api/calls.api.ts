import client from './client';
import type { ApiSuccess } from '../types/api';
import type { CallHistoryItem } from '../types/call';

export interface GetCallHistoryResponse {
  items: CallHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const callsApi = {
  getHistory: async (page = 1, limit = 20): Promise<GetCallHistoryResponse> => {
    const res = await client.get<ApiSuccess<GetCallHistoryResponse>>('/calls/history', {
      params: { page, limit },
    });
    return res.data.data;
  },
};

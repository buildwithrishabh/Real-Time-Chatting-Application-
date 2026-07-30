import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { chatsApi } from '../api/chats.api';
import { getSocket } from '../socket/client';
import { PAGINATION } from '../lib/constants';

export function useConversations() {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam }) =>
      chatsApi.list({ cursor: pageParam, limit: PAGINATION.CONVERSATIONS_LIMIT }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) =>
      (lastPage?.hasMore || lastPage?.hasNext) ? lastPage.nextCursor ?? undefined : undefined,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [queryClient]);

  return query;
}

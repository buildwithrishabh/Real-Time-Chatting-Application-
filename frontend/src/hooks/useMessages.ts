import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { useEffect } from 'react';
import { messagesApi } from '../api/messages.api';
import { getSocket } from '../socket/client';
import type { Message } from '../types/message';
import type { CursorPage } from '../types/api';
import { PAGINATION } from '../lib/constants';

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =>
      conversationId
        ? messagesApi.list(conversationId, { cursor: pageParam, limit: PAGINATION.MESSAGES_LIMIT })
        : Promise.resolve({ items: [], nextCursor: null, hasNext: false }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor ?? undefined : undefined),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('room:join', { conversationId });

    const handleNewMessage = (message: Message) => {
      if (message.conversationId !== conversationId) return;

      queryClient.setQueryData<InfiniteData<CursorPage<Message>>>(
        ['messages', conversationId],
        (old) => {
          if (!old) return old;
          const [firstPage, ...rest] = old.pages;

          if (firstPage.items.some((item) => item._id === message._id)) {
            return old;
          }

          return {
            ...old,
            pages: [
              { ...firstPage, items: [...firstPage.items, message] },
              ...rest,
            ],
          };
        }
      );
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.emit('room:leave', { conversationId });
      socket.off('message:new', handleNewMessage);
    };
  }, [conversationId, queryClient]);

  return query;
}

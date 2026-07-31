import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { chatsApi } from '../api/chats.api';
import { getSocket } from '../socket/client';
import { PAGINATION } from '../lib/constants';
import { useSocketStore } from '../store/socket.store';

export function useConversations() {
  const queryClient = useQueryClient();
  const isConnected = useSocketStore((s) => s.isConnected);

  const query = useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam }) =>
      chatsApi.list({ cursor: pageParam, limit: PAGINATION.CONVERSATIONS_LIMIT }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      if (message?.conversationId) {
        queryClient.setQueryData<any>(['conversations'], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => {
              const updatedItems = page.items.map((conv: any) => {
                if (conv._id === message.conversationId) {
                  return {
                    ...conv,
                    lastMessageId: message,
                    lastMessage: message,
                    updatedAt: message.createdAt || new Date().toISOString(),
                  };
                }
                return conv;
              });

              // Re-sort page items so the updated conversation moves to top
              updatedItems.sort(
                (a: any, b: any) =>
                  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              );

              return {
                ...page,
                items: updatedItems,
              };
            }),
          };
        });
      }

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [isConnected, queryClient]);

  return query;
}

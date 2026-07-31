import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { useEffect } from 'react';
import { messagesApi } from '../api/messages.api';
import { getSocket } from '../socket/client';
import { useSocketStore } from '../store/socket.store';
import type { Message } from '../types/message';
import type { CursorPage } from '../types/api';
import { PAGINATION } from '../lib/constants';

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();
  const isConnected = useSocketStore((s) => s.isConnected);

  const query = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =>
      conversationId
        ? messagesApi.list(conversationId, { cursor: pageParam, limit: PAGINATION.MESSAGES_LIMIT })
        : Promise.resolve({ items: [], nextCursor: null, hasMore: false }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined),
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

          if (!firstPage || firstPage.items.some((item) => item._id === message._id)) {
            return old;
          }

          return {
            ...old,
            pages: [
              { ...firstPage, items: [message, ...firstPage.items] },
              ...rest,
            ],
          };
        }
      );
    };

    const handleReactionUpdate = (data: { conversationId: string; messageId: string; reactions: Record<string, string[]> }) => {
      if (data.conversationId !== conversationId) return;

      queryClient.setQueryData<InfiniteData<CursorPage<Message>>>(
        ['messages', conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item._id === data.messageId ? { ...item, reactions: data.reactions } : item
              ),
            })),
          };
        }
      );
    };

    const handleMessageEdit = (data: { conversationId: string; messageId: string; content: string; isEdited: boolean }) => {
      if (data.conversationId !== conversationId) return;

      queryClient.setQueryData<InfiniteData<CursorPage<Message>>>(
        ['messages', conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item._id === data.messageId ? { ...item, content: data.content, isEdited: true } : item
              ),
            })),
          };
        }
      );
    };

    const handleMessageDelete = (data: { conversationId: string; messageId: string; type: string }) => {
      if (data.conversationId !== conversationId) return;

      queryClient.setQueryData<InfiniteData<CursorPage<Message>>>(
        ['messages', conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item._id === data.messageId
                  ? data.type === 'everyone'
                    ? { ...item, isDeletedForEveryone: true, content: '' }
                    : item
                  : item
              ),
            })),
          };
        }
      );
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:reaction_update', handleReactionUpdate);
    socket.on('message:edit', handleMessageEdit);
    socket.on('message:delete', handleMessageDelete);

    return () => {
      socket.emit('room:leave', { conversationId });
      socket.off('message:new', handleNewMessage);
      socket.off('message:reaction_update', handleReactionUpdate);
      socket.off('message:edit', handleMessageEdit);
      socket.off('message:delete', handleMessageDelete);
    };
  }, [conversationId, isConnected, queryClient]);

  return query;
}

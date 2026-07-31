import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { chatsApi } from '../api/chats.api';
import { getSocket } from '../socket/client';
import { PAGINATION } from '../lib/constants';
import { useSocketStore } from '../store/socket.store';
import { useChatStore } from '../store/chat.store';
import { useAuthStore } from '../store/auth.store';

export function useConversations() {
  const queryClient = useQueryClient();
  const isConnected = useSocketStore((s) => s.isConnected);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const currentUserId = useAuthStore(
    (s) => s.user?._id || (s.user as any)?.id
  )?.toString();

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
      if (!message?.conversationId) return;

      queryClient.setQueryData<any>(['conversations'], (oldData: any) => {
        if (!oldData) return oldData;

        const updatedAt = message.createdAt || new Date().toISOString();

        // Find the updated conversation (removed from wherever it lives) and
        // optimistically bump / clear the current user's unread count.
        let updatedConv: any = null;
        const pages = oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.filter((conv: any) => {
            if (conv._id !== message.conversationId) return true;

            updatedConv = {
              ...conv,
              lastMessageId: message._id,
              lastMessage: message,
              updatedAt,
              participants: (conv.participants || []).map((p: any) => {
                if (!currentUserId) return p;
                const pId = typeof p?.userId === 'string'
                  ? p.userId
                  : p?.userId?._id || p?.userId?.id;
                if (pId !== currentUserId) return p;
                const isActive = activeConversationId === message.conversationId;
                return message.senderId !== currentUserId && !isActive
                  ? { ...p, unreadCount: (p.unreadCount || 0) + 1 }
                  : { ...p, unreadCount: 0 };
              }),
            };
            return false;
          }),
        }));

        // Move the updated conversation to the top of the first page so the
        // preview ordering always matches the backend (sorted by updatedAt desc).
        if (updatedConv && pages.length > 0) {
          pages[0] = { ...pages[0], items: [updatedConv, ...pages[0].items] };
        }

        return { ...oldData, pages };
      });

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [isConnected, queryClient, activeConversationId, currentUserId]);

  return query;
}

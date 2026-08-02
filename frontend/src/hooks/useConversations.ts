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

    const handleConversationUpdated = (data: any) => {
      if (!data) return;

      const targetConvId = (
        typeof data.conversationId === 'object' && data.conversationId?._id
          ? data.conversationId._id
          : data.conversationId || data.chatId
      )?.toString();

      if (!targetConvId) return;

      const lastMsg = data.lastMessage || (data.content ? data : null);
      const senderIdStr = (
        typeof lastMsg?.senderId === 'object' && lastMsg?.senderId?._id
          ? lastMsg.senderId._id
          : lastMsg?.senderId || lastMsg?.sender?._id || lastMsg?.sender?.id
      )?.toString();

      queryClient.setQueryData<any>(['conversations'], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;

        const updatedAt = data.updatedAt || lastMsg?.createdAt || new Date().toISOString();

        let updatedConv: any = null;

        // Remove conversation from whichever page it currently is in
        const pages = oldData.pages.map((page: any) => ({
          ...page,
          items: (page.items || []).filter((conv: any) => {
            const convIdStr = (conv._id || conv.id)?.toString();
            if (convIdStr !== targetConvId) return true;

            const isSenderMe = senderIdStr === currentUserId;
            const isActive = activeConversationId === targetConvId;

            updatedConv = {
              ...conv,
              lastMessageId: lastMsg?._id || lastMsg?.id || conv.lastMessageId,
              lastMessage: lastMsg || conv.lastMessage,
              updatedAt,
              participants: (conv.participants || []).map((p: any) => {
                if (!currentUserId) return p;
                const pId = (
                  typeof p?.userId === 'string'
                    ? p.userId
                    : p?.userId?._id || p?.userId?.id
                )?.toString();
                if (pId !== currentUserId) return p;

                return !isSenderMe && !isActive
                  ? { ...p, unreadCount: (p.unreadCount || 0) + 1 }
                  : { ...p, unreadCount: 0 };
              }),
            };
            return false;
          }),
        }));

        // Move the updated conversation to top (index 0 of first page)
        if (updatedConv && pages.length > 0) {
          pages[0] = { ...pages[0], items: [updatedConv, ...pages[0].items] };
          return { ...oldData, pages };
        } else if (!updatedConv) {
          // If conversation is not found in cache (e.g. brand new chat), invalidate query to fetch from API
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }

        return { ...oldData, pages };
      });
    };

    socket.on('conversation:updated', handleConversationUpdated);
    socket.on('message:new', handleConversationUpdated);
    return () => {
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('message:new', handleConversationUpdated);
    };
  }, [isConnected, queryClient, activeConversationId, currentUserId]);

  return query;
}

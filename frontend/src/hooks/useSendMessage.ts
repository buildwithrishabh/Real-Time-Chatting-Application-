import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { getSocket } from '../socket/client';
import { useAuthStore } from '../store/auth.store';
import type { Message } from '../types/message';
import type { CursorPage } from '../types/api';
import { messagesApi } from '../api/messages.api';
import { toast } from 'sonner';

interface SendMessagePayload {
  content?: string;
  fileId?: string;
  replyToMessageId?: string;
  tempId?: string;
}

export function useSendMessage(conversationId: string | null) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      if (!conversationId) throw new Error('No active conversation');

      const socket = getSocket();
      if (socket?.connected) {
        return new Promise<Message>((resolve, reject) => {
          const tempId = payload.tempId || `temp-${crypto.randomUUID()}`;
          socket.emit(
            'message:send',
            { conversationId, tempId, ...payload },
            (response: { success: boolean; data?: Message; error?: string }) => {
              if (response.success && response.data) {
                resolve(response.data);
              } else {
                reject(new Error(response.error || 'Failed to send message via socket'));
              }
            }
          );
        });
      }

      return messagesApi.send(conversationId, payload);
    },

    onMutate: async (payload) => {
      if (!conversationId || !user) return;
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });

      const previous = queryClient.getQueryData<InfiniteData<CursorPage<Message>>>([
        'messages',
        conversationId,
      ]);

      const tempId = payload.tempId || `temp-${crypto.randomUUID()}`;
      payload.tempId = tempId;

      const tempMessage: Message = {
        _id: tempId,
        tempId,
        conversationId,
        senderId: user._id,
        content: payload.content || '',
        type: payload.fileId ? 'image' : 'text',
        fileId: payload.fileId,
        replyToMessageId: payload.replyToMessageId,
        isPinned: false,
        isEdited: false,
        isDeletedForEveryone: false,
        deletedByUsers: [],
        mentions: [],
        starredBy: [],
        reactions: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<InfiniteData<CursorPage<Message>>>(
        ['messages', conversationId],
        (old) => {
          if (!old?.pages?.length) {
            return {
              pages: [{ items: [tempMessage], nextCursor: null, hasMore: false }],
              pageParams: [undefined],
            };
          }
          const [firstPage, ...rest] = old.pages;
          return {
            ...old,
            pages: [
              { ...firstPage, items: [tempMessage, ...firstPage.items] },
              ...rest,
            ],
          };
        }
      );

      return { previous, tempId };
    },

    onError: (err, _payload, context) => {
      if (conversationId && context?.previous) {
        queryClient.setQueryData(['messages', conversationId], context.previous);
      }
      toast.error(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    },

    onSuccess: (savedMessage, _payload, context) => {
      if (!conversationId || !context?.tempId) return;
      queryClient.setQueryData<InfiniteData<CursorPage<Message>>>(
        ['messages', conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item._id === context.tempId || item.tempId === context.tempId ? savedMessage : item
              ),
            })),
          };
        }
      );
    },

    onSettled: () => {
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
  });
}

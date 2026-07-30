import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { getSocket } from '../socket/client';
import { useAuthStore } from '../store/auth.store';
import type { Message } from '../types/message';
import type { CursorPage } from '../types/api';
import { messagesApi } from '../api/messages.api';
import { toast } from 'sonner';

export function useSendMessage(conversationId: string | null) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (payload: { content?: string; fileId?: string; replyToMessageId?: string }) => {
      if (!conversationId) throw new Error('No active conversation');

      const socket = getSocket();
      if (socket?.connected) {
        return new Promise<Message>((resolve, reject) => {
          const tempId = `temp-${crypto.randomUUID()}`;
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

      const tempMessage: Message = {
        _id: `temp-${crypto.randomUUID()}`,
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
          if (!old) return old;
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

      return { previous };
    },

    onError: (err, _payload, context) => {
      if (conversationId && context?.previous) {
        queryClient.setQueryData(['messages', conversationId], context.previous);
      }
      toast.error(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    },

    onSettled: () => {
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
  });
}

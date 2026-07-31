import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Phone, Video, MoreVertical, ArrowLeft, Info } from 'lucide-react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { UserProfileDrawer } from './UserProfileDrawer';
import type { Conversation } from '../../types/chat';
import { messagesApi } from '../../api/messages.api';
import { useSendMessage } from '../../hooks/useSendMessage';
import { useMessages } from '../../hooks/useMessages';
import { useTyping } from '../../hooks/useTyping';
import { useChatStore } from '../../store/chat.store';
import { useUIStore } from '../../store/ui.store';
import { usePresenceStore } from '../../store/presence.store';
import { useAuthStore } from '../../store/auth.store';
import { formatConversationDate } from '../../lib/format';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { getSocket } from '../../socket/client';

interface ChatWindowProps {
  activeConversation: Conversation | null;
}

export function ChatWindow({ activeConversation }: ChatWindowProps) {
  const queryClient = useQueryClient();
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const setUserProfileDrawerOpen = useUIStore((s) => s.setUserProfileDrawerOpen);
  const conversationId = activeConversation?._id;
  const { data: messagesData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: isMessagesLoading } = useMessages(conversationId ?? null);
  const sendMessageMutation = useSendMessage(conversationId ?? null);
  const { startTyping, stopTyping, typingUsers } = useTyping(conversationId ?? null);
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  const currentUserId = useAuthStore((s) => s.user?._id || (s.user as any)?.id)?.toString();

  const [searchActive, setSearchActive] = useState(false);

  const realMessages = useMemo(
    () =>
      (messagesData?.pages || [])
        .slice()
        .reverse()
        .flatMap((page) => page.items.slice().reverse()),
    [messagesData?.pages]
  );

  const otherParticipant = activeConversation?.participants?.find((p) => {
    if (!p?.userId) return false;
    const pId = (typeof p.userId === 'string' ? p.userId : (p.userId._id || (p.userId as any)?.id))?.toString();
    return pId && currentUserId ? pId !== currentUserId : true;
  }) || activeConversation?.participants?.[0];

  const otherUserObj = (otherParticipant?.userId && typeof otherParticipant.userId === 'object') ? otherParticipant.userId : null;
  const otherUserId = (typeof otherParticipant?.userId === 'string' ? otherParticipant.userId : otherUserObj?._id || (otherUserObj as any)?.id)?.toString();

  const headerTitle = activeConversation?.type === 'group'
    ? activeConversation.name || 'Group Chat'
    : otherUserObj?.displayName || otherUserObj?.username || activeConversation?.name || 'Chat';

  const headerAvatar = activeConversation?.type === 'group'
    ? activeConversation.avatarUrl
    : otherUserObj?.avatarUrl || activeConversation?.avatarUrl;

  const isOnline = otherUserId ? onlineUsers[otherUserId] === 'online' : false;

  const typingOtherUserId = typingUsers.find((id) => id !== currentUserId);
  const typingUserName = typingOtherUserId && otherUserObj
    ? otherUserObj.displayName || otherUserObj.username
    : null;

  const handleSendMessage = (content: string, fileId?: string) => {
    if (!conversationId) return;
    sendMessageMutation.mutate({ content, fileId });
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      await messagesApi.react(messageId, emoji);
      await queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    } catch {
      toast.error('Could not update reaction');
    }
  };

  const handleUnreact = async (messageId: string, emoji: string) => {
    try {
      await messagesApi.unreact(messageId, emoji);
      await queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    } catch {
      toast.error('Could not remove reaction');
    }
  };

  const handleEdit = async (messageId: string, content: string) => {
    try {
      await messagesApi.edit(messageId, content);
      await queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      toast.success('Message updated');
    } catch {
      toast.error('Could not edit message');
    }
  };

  const handleDelete = async (messageId: string, mode: 'me' | 'everyone' = 'everyone') => {
    try {
      await messagesApi.delete(messageId, mode);
      await queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      toast.success(mode === 'me' ? 'Message removed for you' : 'Message deleted for everyone');
    } catch {
      toast.error('Could not delete message');
    }
  };

  useEffect(() => {
    const lastMessage = realMessages[realMessages.length - 1];
    const socket = getSocket();
    if (conversationId && lastMessage?._id && socket?.connected && !lastMessage._id.startsWith('temp-')) {
      socket.emit('message:read', { conversationId, messageId: lastMessage._id });
    }
  }, [conversationId, realMessages]);

  if (!activeConversation || !conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-slate-50/50 dark:bg-[#0B0F19]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-violet-600/20 via-indigo-600/20 to-cyan-500/20 flex items-center justify-center">
            <Info className="w-10 h-10 text-violet-600/40" />
          </div>
          <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500">
            Select a conversation
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Choose from your existing chats or start a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-50/50 dark:bg-[#0B0F19] transition-colors relative">
      {/* Header */}
      <div className="h-16 px-3 sm:px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md flex items-center justify-between shadow-2xs select-none flex-shrink-0">
        
        {/* Clickable Contact Profile Header */}
        <div
          onClick={() => setUserProfileDrawerOpen(true)}
          className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
          title="Click to view Contact Profile & Shared Media"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveConversation(null);
            }}
            className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            aria-label="Back to conversations list"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="relative flex-shrink-0">
            {headerAvatar ? (
              <img
                src={headerAvatar}
                alt={headerTitle}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-violet-500/30"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-md">
                {headerTitle.slice(0, 2).toUpperCase()}
              </div>
            )}
            {activeConversation.type !== 'group' && (
              <span
                className={cn(
                  'absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-white dark:border-slate-900 rounded-full transition-colors duration-300',
                  isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                )}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
              {headerTitle}
            </h3>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 block truncate">
              {activeConversation.type === 'group'
                ? `${activeConversation.participants?.length || 0} members`
                : isOnline
                  ? 'Online'
                  : otherUserObj?.lastSeenAt
                    ? `Last seen ${formatConversationDate(otherUserObj.lastSeenAt)}`
                    : 'Offline'}
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 text-slate-500 dark:text-slate-400 flex-shrink-0">
          <button
            onClick={() => setSearchActive((prev) => !prev)}
            className={cn(
              'p-2 sm:p-2.5 rounded-2xl transition-colors',
              searchActive ? 'text-violet-600 bg-violet-50 dark:bg-violet-950/60' : 'hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
            aria-label="Search conversation messages"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => toast.info('Voice calling coming soon!')}
            className="hidden sm:inline-flex p-2 sm:p-2.5 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
            aria-label="Start voice call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={() => toast.info('Video calling coming soon!')}
            className="hidden sm:inline-flex p-2 sm:p-2.5 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
            aria-label="Start video call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={() => setUserProfileDrawerOpen(true)}
            className="p-2 sm:p-2.5 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
            aria-label="Contact info & shared media"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={realMessages}
        isTyping={typingUsers.length > 0}
        typingUserName={typingUserName}
        onReact={handleReact}
        onUnreact={handleUnreact}
        onEdit={handleEdit}
        onDelete={handleDelete}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isMessagesLoading}
      />

      {/* Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTypingStart={startTyping}
        onTypingStop={stopTyping}
        conversationId={conversationId}
      />

      {/* User Profile & Shared Media Drawer */}
      <UserProfileDrawer
        activeConversation={activeConversation}
        messages={realMessages}
      />
    </div>
  );
}

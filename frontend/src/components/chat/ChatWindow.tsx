import { Search, Phone, Video, MoreVertical, ArrowLeft, Info } from 'lucide-react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { Conversation } from '../../types/chat';
import { messagesApi } from '../../api/messages.api';
import { useSendMessage } from '../../hooks/useSendMessage';
import { useMessages } from '../../hooks/useMessages';
import { useTyping } from '../../hooks/useTyping';
import { useChatStore } from '../../store/chat.store';
import { usePresenceStore } from '../../store/presence.store';
import { useAuthStore } from '../../store/auth.store';
import { cn } from '../../lib/utils';

interface ChatWindowProps {
  activeConversation: Conversation | null;
}

export function ChatWindow({ activeConversation }: ChatWindowProps) {
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const conversationId = activeConversation?._id;
  const { data: messagesData, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversationId ?? null);
  const sendMessageMutation = useSendMessage(conversationId ?? null);
  const { startTyping, stopTyping, typingUsers } = useTyping(conversationId ?? null);
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  const currentUserId = useAuthStore((s) => s.user?._id);

  const realMessages = messagesData?.pages.flatMap((page) => page.items) || [];

  const otherParticipant = activeConversation?.participants?.find((p) => {
    const pId = typeof p.userId === 'string' ? p.userId : p.userId._id;
    return pId !== currentUserId;
  });
  const otherUserId = (typeof otherParticipant?.userId === 'object' ? otherParticipant.userId._id : otherParticipant?.userId) as string | undefined;
  const otherUserObj = typeof otherParticipant?.userId === 'object' ? otherParticipant.userId : null;

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
    } catch {
      // silently fail
    }
  };

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
    <div className="flex-1 flex flex-col h-screen bg-slate-50/50 dark:bg-[#0B0F19] transition-colors">
      {/* Header */}
      <div className="h-16 px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md flex items-center justify-between shadow-2xs select-none flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setActiveConversation(null)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative flex-shrink-0">
            {headerAvatar ? (
              <img
                src={headerAvatar}
                alt={headerTitle}
                className="w-10 h-10 rounded-full object-cover border-2 border-violet-500/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                {headerTitle.slice(0, 2).toUpperCase()}
              </div>
            )}
            {activeConversation.type !== 'group' && (
              <span
                className={cn(
                  'absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full transition-colors duration-300',
                  isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                )}
              />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
              {headerTitle}
            </h3>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {activeConversation.type === 'group'
                ? `${activeConversation.participants?.length || 0} members`
                : isOnline
                  ? 'Online'
                  : 'Offline'}
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 flex-shrink-0">
          <button className="p-2 sm:p-2.5 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 sm:p-2.5 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 sm:p-2.5 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 sm:p-2.5 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
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
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />

      {/* Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTypingStart={startTyping}
        onTypingStop={stopTyping}
        conversationId={conversationId}
      />
    </div>
  );
}

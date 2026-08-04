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

import { useWebRTC } from '../../hooks/useWebRTC';

interface ChatWindowProps {
  activeConversation: Conversation | null;
}

export function ChatWindow({ activeConversation }: ChatWindowProps) {
  const { initiateCall } = useWebRTC();
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
  const lastSeenAt = usePresenceStore((s) => (otherUserId ? s.lastSeen[otherUserId] : undefined));
  const otherUserLastSeenAt = lastSeenAt || otherUserObj?.lastSeenAt;

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

  // Optimistically clear the unread badge for the conversation being opened
  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    queryClient.setQueryData<any>(['conversations'], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.map((conv: any) =>
            conv._id === conversationId
              ? {
                  ...conv,
                  participants: (conv.participants || []).map((p: any) => {
                    const pId = typeof p?.userId === 'string'
                      ? p.userId
                      : p?.userId?._id || p?.userId?.id;
                    return pId === currentUserId ? { ...p, unreadCount: 0 } : p;
                  }),
                }
              : conv
          ),
        })),
      };
    });
  }, [conversationId, currentUserId, queryClient]);

  if (!activeConversation || !conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-[#050505] chat-workspace-bg relative overflow-hidden">
        {/* Ambient Radial Background Glows matching Landing Page */}
        <div className="absolute w-[450px] h-[450px] bg-violet-600/12 rounded-full blur-3xl top-1/4 left-1/3 pointer-events-none animate-pulse-slow" />
        <div className="absolute w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl bottom-10 right-20 pointer-events-none animate-pulse-slow" />
        
        <div className="text-center z-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-[#111114] border border-white/10 flex items-center justify-center shadow-2xl">
            <Info className="w-10 h-10 text-[#5D5FEF]" />
          </div>
          <h3 className="text-lg font-bold text-white">
            Select a conversation
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Choose from your existing chats or start a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#050505] chat-workspace-bg transition-colors relative overflow-hidden">
      {/* Ambient Radial Background Glows matching Landing Page */}
      <div className="absolute w-[450px] h-[450px] bg-violet-600/12 rounded-full blur-3xl top-10 left-1/3 pointer-events-none animate-pulse-slow" />
      <div className="absolute w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl bottom-10 right-20 pointer-events-none animate-pulse-slow" />

      {/* Header */}
      <div className="h-16 px-4 sm:px-6 border-b border-white/10 bg-[#09090B]/90 backdrop-blur-xl flex items-center justify-between shadow-2xs select-none flex-shrink-0 z-10">
        
        {/* Clickable Contact Profile Header */}
        <div
          onClick={() => setUserProfileDrawerOpen(true)}
          className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-95 transition-opacity"
          title="Click to view Contact Profile & Shared Media"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveConversation(null);
            }}
            className="md:hidden p-2 -ml-1 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Back to conversations list"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="relative flex-shrink-0">
            {headerAvatar ? (
              <img
                src={headerAvatar}
                alt={headerTitle}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white/10 shadow-md"
              />
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white font-extrabold flex items-center justify-center text-xs sm:text-sm shadow-md">
                {headerTitle.slice(0, 2).toUpperCase()}
              </div>
            )}
            {activeConversation.type !== 'group' && (
              <span
                className={cn(
                  'absolute bottom-0 right-0 w-3 h-3 border-2 border-[#09090B] rounded-full transition-colors duration-300',
                  isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/60' : 'bg-zinc-600'
                )}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight truncate">
              {headerTitle}
            </h3>
            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-zinc-400 truncate mt-0.5">
              {activeConversation.type === 'group' ? (
                `${activeConversation.participants?.length || 0} members`
              ) : isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 font-bold">Active now</span>
                </>
              ) : otherUserLastSeenAt ? (
                `Last seen ${formatConversationDate(otherUserLastSeenAt)}`
              ) : (
                'Offline'
              )}
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1 text-zinc-400 flex-shrink-0">
          <button
            onClick={() => setSearchActive((prev) => !prev)}
            className={cn(
              'p-2.5 rounded-xl transition-all cursor-pointer',
              searchActive ? 'text-[#5D5FEF] bg-[#18181C] border border-white/10' : 'hover:text-white hover:bg-white/5'
            )}
            aria-label="Search conversation messages"
          >
            <Search className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => {
              if (!otherUserId) {
                toast.error('Cannot call this user');
                return;
              }
              initiateCall(
                {
                  id: otherUserId,
                  username: otherUserObj?.username || headerTitle,
                  displayName: otherUserObj?.displayName || headerTitle,
                  avatarUrl: headerAvatar,
                },
                'audio'
              );
            }}
            className="inline-flex p-2.5 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer text-zinc-400 hover:text-emerald-400"
            aria-label="Start voice call"
            title="Start Audio Call"
          >
            <Phone className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => {
              if (!otherUserId) {
                toast.error('Cannot call this user');
                return;
              }
              initiateCall(
                {
                  id: otherUserId,
                  username: otherUserObj?.username || headerTitle,
                  displayName: otherUserObj?.displayName || headerTitle,
                  avatarUrl: headerAvatar,
                },
                'video'
              );
            }}
            className="inline-flex p-2.5 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer text-zinc-400 hover:text-cyan-400"
            aria-label="Start video call"
            title="Start Video Call"
          >
            <Video className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => setUserProfileDrawerOpen(true)}
            className="p-2.5 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
            aria-label="Contact info & shared media"
          >
            <MoreVertical className="w-4.5 h-4.5" />
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

import { useState } from 'react';
import { usePresenceStore } from '../../store/presence.store';
import type { Conversation } from '../../types/chat';
import { useAuthStore } from '../../store/auth.store';
import { formatConversationDate } from '../../lib/format';
import { cn } from '../../lib/utils';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const currentUserId = useAuthStore((s) => s.user?._id || (s.user as any)?.id)?.toString();
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  const [imgError, setImgError] = useState(false);

  const otherParticipant = conversation.participants?.find((p) => {
    if (!p?.userId) return false;
    const pId = (typeof p.userId === 'string' ? p.userId : (p.userId._id || (p.userId as any)?.id))?.toString();
    return pId && currentUserId ? pId !== currentUserId : true;
  }) || conversation.participants?.[0];

  const otherUserObj = (otherParticipant?.userId && typeof otherParticipant.userId === 'object') ? otherParticipant.userId : null;
  const otherUserId = (typeof otherParticipant?.userId === 'string' ? otherParticipant.userId : otherUserObj?._id || (otherUserObj as any)?.id)?.toString();

  const title =
    conversation.type === 'group'
      ? conversation.name || 'Group Chat'
      : otherUserObj?.displayName || otherUserObj?.username || conversation.name || 'User';

  const avatarUrl =
    conversation.type === 'group' ? conversation.avatarUrl : otherUserObj?.avatarUrl || conversation.avatarUrl;

  const isOnline = otherUserId ? onlineUsers[otherUserId] === 'online' : false;

  const myParticipant = conversation.participants?.find((p) => {
    if (!p?.userId) return false;
    const pId = typeof p.userId === 'string' ? p.userId : p.userId._id || (p.userId as any)?.id;
    return pId === currentUserId;
  });

  const unreadCount = myParticipant?.unreadCount || 0;
  const lastMessage =
    conversation.lastMessage ||
    (conversation.lastMessageId && typeof conversation.lastMessageId === 'object' ? conversation.lastMessageId : null);

  const lastMessageText = lastMessage
    ? lastMessage.isDeletedForEveryone
      ? 'This message was deleted'
      : lastMessage.content
        ? lastMessage.content
        : lastMessage.fileId
          ? lastMessage.type === 'image'
            ? 'Photo'
            : lastMessage.type === 'video'
              ? 'Video'
              : lastMessage.type === 'audio'
                ? 'Voice message'
                : 'Attachment'
          : ''
    : 'No messages yet';

  const timeDisplay = conversation.updatedAt ? formatConversationDate(conversation.updatedAt) : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all duration-250 select-none border',
        isActive
          ? 'bg-[#18181C] border-[#5D5FEF]/40 shadow-xl shadow-[#5D5FEF]/10 translate-x-0.5'
          : 'bg-[#111114]/80 border-white/5 hover:bg-[#18181C]/90 hover:border-white/10 hover:-translate-y-0.5'
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-[#5D5FEF] to-[#3B82F6] rounded-r-full shadow-md shadow-[#5D5FEF]/50" />
      )}

      <div className="relative flex-shrink-0">
        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={title}
            onError={() => setImgError(true)}
            className="w-12 h-12 rounded-full object-cover border-2 border-white/10 shadow-md group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white font-extrabold flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform">
            {title.slice(0, 2).toUpperCase()}
          </div>
        )}
        {conversation.type !== 'group' && (
          <span
            className={cn(
              'absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-[#09090B] rounded-full transition-colors duration-300',
              isOnline
                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/60'
                : 'bg-zinc-600'
            )}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <h4 className={cn('text-sm font-bold truncate transition-colors', isActive ? 'text-white' : 'text-zinc-200 group-hover:text-white')}>
            {title}
          </h4>
          {timeDisplay && (
            <span className="text-[11px] font-medium text-zinc-500 flex-shrink-0">
              {timeDisplay}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-xs truncate leading-relaxed font-normal', unreadCount > 0 ? 'text-zinc-200 font-semibold' : 'text-zinc-400')}>
            {lastMessageText}
          </p>
          {unreadCount > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white text-[10px] font-extrabold flex items-center justify-center shadow-md shadow-[#5D5FEF]/30 animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

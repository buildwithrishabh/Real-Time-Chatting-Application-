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
    const pId = (typeof p.userId === 'string' ? p.userId : (p.userId?._id || (p.userId as any)?.id))?.toString();
    return pId && currentUserId ? pId !== currentUserId : true;
  }) || conversation.participants?.[0];

  const otherUserObj = typeof otherParticipant?.userId === 'object' ? otherParticipant.userId : null;
  const otherUserId = (typeof otherParticipant?.userId === 'string' ? otherParticipant.userId : otherUserObj?._id || (otherUserObj as any)?.id)?.toString();

  const title =
    conversation.type === 'group'
      ? conversation.name || 'Group Chat'
      : otherUserObj?.displayName || otherUserObj?.username || conversation.name || 'User';

  const avatarUrl =
    conversation.type === 'group' ? conversation.avatarUrl : otherUserObj?.avatarUrl || conversation.avatarUrl;

  const isOnline = otherUserId ? onlineUsers[otherUserId] === 'online' : false;

  const myParticipant = conversation.participants?.find((p) => {
    const pId = typeof p.userId === 'string' ? p.userId : p.userId._id;
    return pId === currentUserId;
  });

  const unreadCount = myParticipant?.unreadCount || 0;

  const lastMessageText = conversation.lastMessage
    ? conversation.lastMessage.isDeletedForEveryone
      ? 'This message was deleted'
      : conversation.lastMessage.content
        ? conversation.lastMessage.content
        : conversation.lastMessage.fileId
          ? conversation.lastMessage.type === 'image'
            ? 'Photo'
            : conversation.lastMessage.type === 'video'
              ? 'Video'
              : conversation.lastMessage.type === 'audio'
                ? 'Voice message'
                : 'Attachment'
          : ''
    : 'No messages yet';

  const timeDisplay = conversation.updatedAt ? formatConversationDate(conversation.updatedAt) : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border select-none',
        isActive
          ? 'active-accent-card shadow-md'
          : 'border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
      )}
    >
      <div className="relative flex-shrink-0">
        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={title}
            onError={() => setImgError(true)}
            className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
          />
        ) : (
          <div className="w-12 h-12 rounded-full gradient-btn text-white font-bold flex items-center justify-center text-base shadow-md">
            {title.slice(0, 2).toUpperCase()}
          </div>
        )}
        {conversation.type !== 'group' && (
          <span
            className={cn(
              'absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-slate-900 rounded-full transition-colors duration-300',
              isOnline
                ? 'bg-emerald-500'
                : 'bg-slate-400 dark:bg-slate-600'
            )}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {title}
          </h4>
          {timeDisplay && (
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex-shrink-0">
              {timeDisplay}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-relaxed">
            {lastMessageText}
          </p>
          {unreadCount > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full gradient-btn text-white text-[11px] font-bold flex items-center justify-center shadow-md">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

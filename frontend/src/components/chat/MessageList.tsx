import { useEffect, useRef, useCallback } from 'react';
import type { Message } from '../../types/message';
import { DateDivider } from './DateDivider';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useAuthStore } from '../../store/auth.store';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  typingUserName?: string | null;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
}

function getDateLabel(dateStr?: string | null): string {
  if (!dateStr) return 'Today';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Today';
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' });
  return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

export function MessageList({
  messages,
  isTyping,
  typingUserName,
  onReact,
  onEdit,
  onDelete,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
}: MessageListProps) {
  const currentUserId = useAuthStore((s) => s.user?._id || (s.user as any)?.id)?.toString();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(true);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isNearBottom.current = scrollHeight - scrollTop - clientHeight < 150;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!bottomRef.current) return;
    if (isNearBottom.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (!observerRef.current || !fetchNextPage || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`flex flex-col gap-2 ${n % 2 === 0 ? 'items-end' : 'items-start'} animate-pulse`}
          >
            <div
              className={`h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 ${
                n % 2 === 0 ? 'w-48 sm:w-64 rounded-br-xs' : 'w-56 sm:w-72 rounded-bl-xs'
              }`}
            />
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const showDateDividers = messages && messages.length > 0;
  let lastDateLabel = '';

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1">
      {hasNextPage && (
        <div ref={observerRef} className="flex justify-center py-4">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              Loading older messages...
            </div>
          ) : (
            <button
              onClick={fetchNextPage}
              className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline"
              aria-label="Load older messages"
            >
              Load older messages
            </button>
          )}
        </div>
      )}

      {showDateDividers ? (
        messages.map((message) => {
          if (!message) return null;
          const createdAt = message.createdAt || (message as any).created_at;
          const dateLabel = getDateLabel(createdAt);
          const showDate = dateLabel !== lastDateLabel;
          lastDateLabel = dateLabel;

          const senderIdVal = message.senderId && typeof message.senderId === 'object'
            ? (message.senderId as any)?._id || (message.senderId as any)?.id
            : message.senderId;

          const isOwn = Boolean(senderIdVal && currentUserId && senderIdVal.toString() === currentUserId);

          return (
            <div key={message._id || message.tempId || Math.random()}>
              {showDate && <DateDivider date={dateLabel} />}
              <MessageBubble
                message={message}
                isOwn={isOwn}
                onReact={onReact}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          );
        })
      ) : (
        <div className="flex items-center justify-center h-full text-sm text-slate-400">
          No messages yet. Start the conversation!
        </div>
      )}

      {isTyping && typingUserName ? (
        <TypingIndicator userName={typingUserName} />
      ) : isTyping ? (
        <TypingIndicator />
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}

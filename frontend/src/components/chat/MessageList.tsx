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
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' });
  return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

export function MessageList({ messages, isTyping, typingUserName, onReact, fetchNextPage, hasNextPage, isFetchingNextPage }: MessageListProps) {
  const currentUserId = useAuthStore((s) => s.user?._id);
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

  const showDateDividers = messages.length > 0;
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
            >
              Load older messages
            </button>
          )}
        </div>
      )}

      {showDateDividers ? (
        messages.map((message) => {
          const dateLabel = getDateLabel(message.createdAt);
          const showDate = dateLabel !== lastDateLabel;
          lastDateLabel = dateLabel;

          const isOwn = message.senderId === currentUserId;

          return (
            <div key={message._id}>
              {showDate && <DateDivider date={dateLabel} />}
              <MessageBubble
                message={message}
                isOwn={isOwn}
                onReact={onReact}
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

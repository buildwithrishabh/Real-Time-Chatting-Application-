import { useEffect, useRef } from 'react';
import type { Message } from '../../types/message';
import { DateDivider } from './DateDivider';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useAuthStore } from '../../store/auth.store';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
}

export function MessageList({ messages, isTyping, onReact }: MessageListProps) {
  const currentUserId = useAuthStore((s) => s.user?._id);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
      <DateDivider date="Today" />

      {messages.map((message) => {
        const isOwn = message.senderId === currentUserId || message.senderId === 'u-me';
        return (
          <MessageBubble
            key={message._id}
            message={message}
            isOwn={isOwn}
            senderAvatarUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
            onReact={onReact}
          />
        );
      })}

      {isTyping && <TypingIndicator />}
    </div>
  );
}

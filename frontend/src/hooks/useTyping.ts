import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from '../socket/client';
import { useSocketStore } from '../store/socket.store';

export function useTyping(conversationId: string | null) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const isConnected = useSocketStore((s) => s.isConnected);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTyping = useCallback(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('typing:start', { conversationId });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [conversationId, isConnected]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    socket.emit('typing:stop', { conversationId });
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleTypingStatus = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId !== conversationId) return;

      setTypingUsers((prev) => {
        if (data.isTyping) {
          return prev.includes(data.userId) ? prev : [...prev, data.userId];
        } else {
          return prev.filter((id) => id !== data.userId);
        }
      });
    };

    socket.on('typing:status', handleTypingStatus);

    return () => {
      socket.off('typing:status', handleTypingStatus);
    };
  }, [conversationId]);

  return {
    startTyping,
    stopTyping,
    isOtherUserTyping: typingUsers.length > 0,
    typingUsers,
  };
}

import { usePresenceStore } from '../store/presence.store';

export function usePresence(userId?: string) {
  const status = usePresenceStore((s) => (userId ? s.onlineUsers[userId] : undefined));
  const lastSeenAt = usePresenceStore((s) => (userId ? s.lastSeen[userId] : undefined));

  return { status: status ?? 'offline', lastSeenAt };
}

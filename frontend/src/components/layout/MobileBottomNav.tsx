import { useEffect, useState } from 'react';
import { MessageSquare, Users, UserPlus, Bell, Settings } from 'lucide-react';
import { useUIStore } from '../../store/ui.store';
import { useChatStore } from '../../store/chat.store';
import type { NavTab } from '../../store/ui.store';
import { notificationsApi } from '../../api/notifications.api';
import { getSocket } from '../../socket/client';
import { cn } from '../../lib/utils';
import { useSocketStore } from '../../store/socket.store';

export function MobileBottomNav() {
  const {
    activeTab,
    setActiveTab,
    setProfileModalOpen,
    setNotificationOpen,
  } = useUIStore();
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const isConnected = useSocketStore((s) => s.isConnected);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationsApi
      .getUnreadCount()
      .then((res) => setUnreadCount(res.unreadCount || 0))
      .catch(() => {});
  }, [isConnected]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleNewNotif = (data: { activeInRoom?: boolean }) => {
      if (data?.activeInRoom) return;
      setUnreadCount((prev) => prev + 1);
    };
    socket.on('notification:received', handleNewNotif);
    return () => {
      socket.off('notification:received', handleNewNotif);
    };
  }, []);

  // On mobile, if an active conversation is open in ChatWindow, hide bottom nav for full immersive chat screen
  if (activeConversationId) {
    return null;
  }

  const items = [
    { id: 'chats' as NavTab, label: 'Chats', icon: MessageSquare },
    { id: 'people' as NavTab, label: 'People', icon: Users },
    { id: 'groups' as NavTab, label: 'Groups', icon: UserPlus },
    { id: 'notifications' as NavTab, label: 'Notifications', icon: Bell },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (id: NavTab) => {
    if (id === 'settings') {
      setProfileModalOpen(true);
    } else if (id === 'notifications') {
      setNotificationOpen(true);
      setUnreadCount(0);
    } else {
      setActiveTab(id);
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090B]/90 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isNotif = item.id === 'notifications';

        return (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 relative active:scale-95 cursor-pointer',
              isActive
                ? 'text-[#5D5FEF] font-bold'
                : 'text-zinc-400 font-semibold hover:text-white'
            )}
          >
            <div className="relative">
              <Icon
                className={cn(
                  'w-5 h-5 transition-transform duration-200',
                  isActive && 'scale-110'
                )}
              />
              {isNotif && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white text-[9px] font-extrabold flex items-center justify-center border border-[#09090B] animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 capitalize">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

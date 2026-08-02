import { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  AtSign,
  Users,
  Shield,
  Trash2,
  BellOff,
  Loader2,
  X,
} from 'lucide-react';
import { notificationsApi } from '../../api/notifications.api';
import type { AppNotification } from '../../types/notification';
import { useChatStore } from '../../store/chat.store';
import { useUIStore } from '../../store/ui.store';
import { getSocket } from '../../socket/client';
import { useSocketStore } from '../../store/socket.store';
import { formatConversationDate } from '../../lib/format';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

type FilterTab = 'all' | 'unread' | 'mentions' | 'system';

export function NotificationSidebar() {
  const { isNotificationOpen, setNotificationOpen, setActiveTab } = useUIStore();
  const { setActiveConversation } = useChatStore();
  const isConnected = useSocketStore((s) => s.isConnected);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await notificationsApi.getNotifications(1, 50);
      setNotifications(res.notifications || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isNotificationOpen) {
      fetchNotifications();
    }
  }, [isNotificationOpen]);

  // Listen for real-time incoming notifications over socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (newNotif: AppNotification) => {
      setNotifications((prev) => [newNotif, ...prev]);

      const currentActiveId = useChatStore.getState().activeConversationId;
      const isCurrentChatOpen = Boolean(
        (newNotif.chatId && currentActiveId === newNotif.chatId) || newNotif.activeInRoom
      );

      // Do not display popup toast notification if the recipient has that chat currently open
      if (!isCurrentChatOpen) {
        toast.info(newNotif.title, {
          description: newNotif.body,
        });
      }
    };

    socket.on('notification:received', handleNewNotification);
    return () => {
      socket.off('notification:received', handleNewNotification);
    };
  }, [isConnected]);

  if (!isNotificationOpen) return null;

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif._id);
    }
    if (notif.chatId) {
      setActiveConversation(notif.chatId);
      setActiveTab('chats');
      setNotificationOpen(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === 'unread') return !n.isRead;
    if (filterTab === 'mentions') return n.type === 'MENTION';
    if (filterTab === 'system') return n.type === 'SYSTEM_ALERT';
    return true;
  });

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-violet-500" />;
      case 'MENTION':
        return <AtSign className="w-4 h-4 text-cyan-500" />;
      case 'GROUP_INVITE':
      case 'GROUP_ROLE_UPDATE':
        return <Users className="w-4 h-4 text-emerald-500" />;
      case 'SYSTEM_ALERT':
        return <Shield className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-violet-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end md:justify-start">
      {/* Backdrop */}
      <div
        onClick={() => setNotificationOpen(false)}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Slide-over Notification Sidebar */}
      <div className="relative w-full sm:w-96 max-w-full md:ml-20 bg-[#09090B] h-full flex flex-col z-50 shadow-2xl animate-scale-in border-r border-white/10 select-none">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-[#09090B]/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-[#5D5FEF]/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Activity & Alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-1.5 text-xs font-bold text-[#5D5FEF] hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-4.5 h-4.5" />
              </button>
            )}

            <button
              onClick={() => setNotificationOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs Bar */}
        <div className="px-4 py-2.5 bg-[#09090B] border-b border-white/10 flex items-center gap-1.5 flex-shrink-0 overflow-x-auto">
          {(['all', 'unread', 'mentions', 'system'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={cn(
                'px-3 py-1 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap cursor-pointer',
                filterTab === tab
                  ? 'bg-[#18181C] text-white border border-white/10 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notifications List Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-7 h-7 text-[#5D5FEF] animate-spin mb-2" />
              <p className="text-xs text-zinc-400 font-medium">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#111114] border border-white/10 flex items-center justify-center mb-3">
                <BellOff className="w-7 h-7 text-zinc-500" />
              </div>
              <h4 className="text-sm font-bold text-white">
                No notifications
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-[220px]">
                When you receive new messages or mentions, they will appear in this sidebar.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  'group flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer relative',
                  notif.isRead
                    ? 'bg-[#111114] border-white/5 hover:bg-[#18181C]'
                    : 'bg-[#18181C] border-[#5D5FEF]/40 shadow-md shadow-[#5D5FEF]/5'
                )}
              >
                {/* Sender Avatar or Icon Badge */}
                <div className="relative flex-shrink-0">
                  {notif.sender?.avatarUrl ? (
                    <img
                      src={notif.sender.avatarUrl}
                      alt={notif.sender.displayName || notif.sender.username}
                      className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#18181C] border border-white/10 flex items-center justify-center shadow-xs">
                      {getNotificationIcon(notif.type)}
                    </div>
                  )}

                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#09090B] border border-white/10 flex items-center justify-center shadow-xs">
                    {getNotificationIcon(notif.type)}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className="text-xs font-bold text-white truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] font-medium text-zinc-500 flex-shrink-0">
                      {formatConversationDate(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                    {notif.body}
                  </p>
                </div>

                {/* Actions & Unread Indicator */}
                <div className="absolute right-3 top-3 flex items-center gap-1.5">
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#5D5FEF] animate-pulse" />
                  )}

                  <button
                    onClick={(e) => handleDelete(e, notif._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

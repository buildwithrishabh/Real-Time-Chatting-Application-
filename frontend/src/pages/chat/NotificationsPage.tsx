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
} from 'lucide-react';
import { notificationsApi } from '../../api/notifications.api';
import type { AppNotification } from '../../types/notification';
import { useChatStore } from '../../store/chat.store';
import { useUIStore } from '../../store/ui.store';
import { getSocket } from '../../socket/client';
import { formatConversationDate } from '../../lib/format';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

type FilterTab = 'all' | 'unread' | 'mentions' | 'system';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const { setActiveConversation } = useChatStore();
  const { setActiveTab } = useUIStore();

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
    fetchNotifications();
  }, []);

  // Listen for real-time incoming notifications over socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (newNotif: AppNotification) => {
      setNotifications((prev) => [newNotif, ...prev]);
      toast.info(newNotif.title, {
        description: newNotif.body,
      });
    };

    socket.on('notification:received', handleNewNotification);
    return () => {
      socket.off('notification:received', handleNewNotification);
    };
  }, []);

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
    <div className="flex-1 flex flex-col h-screen bg-slate-50/50 dark:bg-[#0B0F19] overflow-hidden select-none">
      {/* Top Header */}
      <div className="h-16 px-4 sm:px-8 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold gradient-btn text-white shadow-xs">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Stay updated with messages, mentions and system alerts
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-xl transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs Bar */}
      <div className="px-4 sm:px-8 py-3 bg-white dark:bg-[#0F172A] border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 flex-shrink-0 overflow-x-auto">
        {(['all', 'unread', 'mentions', 'system'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap',
              filterTab === tab
                ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-3 max-w-4xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-2" />
            <p className="text-xs text-slate-400 font-medium">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center mb-3">
              <BellOff className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No notifications
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              You're all caught up! When you receive new messages or mentions, they will show up here.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleNotificationClick(notif)}
              className={cn(
                'group flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative',
                notif.isRead
                  ? 'bg-white dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  : 'bg-violet-50/60 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900/60 shadow-xs'
              )}
            >
              {/* Sender Avatar or Icon Badge */}
              <div className="relative flex-shrink-0">
                {notif.sender?.avatarUrl ? (
                  <img
                    src={notif.sender.avatarUrl}
                    alt={notif.sender.displayName || notif.sender.username}
                    className="w-11 h-11 rounded-full object-cover border-2 border-violet-500/30 shadow-xs"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shadow-xs">
                    {getNotificationIcon(notif.type)}
                  </div>
                )}

                {/* Type Icon Badge */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                  {getNotificationIcon(notif.type)}
                </div>
              </div>

              {/* Notification Details */}
              <div className="flex-1 min-w-0 pr-8">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {notif.title}
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-400 flex-shrink-0">
                    {formatConversationDate(notif.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                  {notif.body}
                </p>
              </div>

              {/* Unread indicator dot & Action Buttons */}
              <div className="absolute right-4 top-4 flex items-center gap-2">
                {!notif.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-pulse" />
                )}

                <button
                  onClick={(e) => handleDelete(e, notif._id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

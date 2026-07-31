import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  UserPlus,
  Phone,
  Bookmark,
  Settings,
  X,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { useSocketStore } from '../../store/socket.store';
import type { NavTab } from '../../store/ui.store';
import { notificationsApi } from '../../api/notifications.api';
import { getSocket } from '../../socket/client';
import { cn } from '../../lib/utils';

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const {
    activeTab,
    setActiveTab,
    setProfileModalOpen,
    isMobileDrawerOpen,
    setMobileDrawerOpen,
    setNotificationOpen,
  } = useUIStore();
  const isConnected = useSocketStore((s) => s.isConnected);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const navItems: { id: string; label: string; icon: React.ElementType }[] = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'people', label: 'People', icon: Users },
    { id: 'groups', label: 'Groups', icon: UserPlus },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'saved', label: 'Saved Messages', icon: Bookmark },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    notificationsApi
      .getUnreadCount()
      .then((res) => setUnreadNotifCount(res.unreadCount || 0))
      .catch(() => {});
  }, [isConnected]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleNewNotif = (data: { activeInRoom?: boolean }) => {
      if (data?.activeInRoom) return;
      setUnreadNotifCount((prev) => prev + 1);
    };
    socket.on('notification:received', handleNewNotif);
    return () => {
      socket.off('notification:received', handleNewNotif);
    };
  }, []);

  const handleNavClick = (id: string) => {
    if (id === 'settings') {
      setProfileModalOpen(true);
    } else if (id === 'notifications') {
      setNotificationOpen(true);
      setUnreadNotifCount(0);
    } else {
      setActiveTab(id as NavTab);
    }
    setMobileDrawerOpen(false);
  };

  return (
    <>
      {/* 1. DESKTOP / LAPTOP HOVER-EXPAND SIDEBAR */}
      <aside className="hidden md:flex group relative hover:w-64 w-20 border-r border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#111827] flex-col justify-between h-screen p-3 hover:p-4 transition-all duration-300 ease-in-out select-none flex-shrink-0 z-30 shadow-sm hover:shadow-xl">
        <div className="flex flex-col gap-5 overflow-hidden">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 flex-shrink-0">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-extrabold tracking-tight gradient-text opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              ChitChat
            </span>
          </div>

          {/* User Profile Card */}
          <div className="relative">
            <div className="w-full flex items-center justify-between p-2 rounded-2xl border border-transparent">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName || user.username}
                      className="w-10 h-10 rounded-full object-cover border-2 border-violet-500/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                      {(user?.displayName || user?.username || 'ME').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={cn(
                      'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#111827] transition-colors duration-300',
                      isConnected ? 'bg-emerald-500' : 'bg-slate-400'
                    )}
                  />
                </div>
                <div className="flex flex-col text-left min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user?.displayName || user?.username || 'User'}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold truncate">
                    @{user?.username || 'username'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation List */}
          <nav className="flex flex-col gap-1.5 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isNotif = item.id === 'notifications';
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    'flex items-center gap-3.5 px-3 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 relative',
                    isActive
                      ? 'bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 shadow-xs border-l-4 border-violet-600'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Icon className={cn('w-5 h-5', isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400')} />
                    {isNotif && unreadNotifCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-[#111827] animate-pulse" />
                    )}
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap flex-1 text-left">
                    {item.label}
                  </span>
                  {isNotif && unreadNotifCount > 0 && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* 2. MOBILE SLIDE-OVER DRAWER & BACKDROP */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full p-5 flex flex-col justify-between z-50 shadow-2xl animate-scale-in">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                    <MessageSquare className="w-5 h-5 fill-current" />
                  </div>
                  <span className="text-lg font-extrabold gradient-text">ChitChat</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Card */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || user.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-violet-500/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-md">
                    {(user?.displayName || user?.username || 'ME').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user?.displayName || user?.username}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">@{user?.username}</p>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isNotif = item.id === 'notifications';
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left',
                        isActive
                          ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-violet-500" />
                        <span>{item.label}</span>
                      </div>
                      {isNotif && unreadNotifCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                          {unreadNotifCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

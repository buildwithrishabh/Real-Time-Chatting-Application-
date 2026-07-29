import { useState } from 'react';
import {
  MessageSquare,
  Users,
  UserPlus,
  Phone,
  Bookmark,
  Settings,
  Moon,
  LogOut,
  Plus,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { useSocketStore } from '../../store/socket.store';
import type { NavTab } from '../../store/ui.store';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { activeTab, setActiveTab, darkMode, toggleDarkMode, setNewChatOpen, setProfileModalOpen } = useUIStore();
  const { logout, isLoggingOut } = useAuth();
  const isConnected = useSocketStore((s) => s.isConnected);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'people', label: 'People', icon: Users },
    { id: 'groups', label: 'Groups', icon: UserPlus },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'saved', label: 'Saved Messages', icon: Bookmark },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: NavTab) => {
    setActiveTab(id);
  };

  return (
    <aside className="w-64 border-r border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#111827] flex flex-col justify-between h-screen p-4 transition-colors select-none flex-shrink-0">
      <div className="flex flex-col gap-5">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-extrabold tracking-tight gradient-text">
            ChitChat
          </span>
        </div>

        {/* User Profile Card */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60"
          >
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
              <div className="flex flex-col text-left min-w-0">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user?.displayName || user?.username || 'User'}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold truncate">
                  @{user?.username || 'username'}
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 py-2 animate-scale-in">
              <button
                onClick={() => {
                  setProfileModalOpen(true);
                  setProfileDropdownOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-600 flex items-center gap-2 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-violet-500" /> Edit Profile
              </button>
              <button
                onClick={() => {
                  logout();
                  setProfileDropdownOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => setNewChatOpen(true)}
          className="w-full py-3 px-4 gradient-btn hover:scale-[1.02] active:scale-[0.98] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all duration-200"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>New Chat</span>
        </button>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1.5 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200',
                  isActive
                    ? 'bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 shadow-xs border-l-4 border-violet-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400')} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Settings */}
      <div className="flex flex-col gap-2 pt-4 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between px-3.5 py-2 text-slate-600 dark:text-slate-400 text-sm font-semibold">
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-slate-400" />
            <span>Dark Mode</span>
          </div>
          <button
            onClick={toggleDarkMode}
            className={cn(
              'w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative',
              darkMode ? 'bg-violet-600' : 'bg-slate-300'
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm',
                darkMode ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </div>

        <button
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="flex items-center gap-3.5 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl text-sm font-semibold transition-all"
        >
          <LogOut className="w-5 h-5 text-slate-400" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

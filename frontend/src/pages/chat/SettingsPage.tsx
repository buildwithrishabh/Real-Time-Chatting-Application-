import { useState, useEffect } from 'react';
import { Moon, Sun, LogOut, Palette, MessageSquare, User, Shield, ChevronRight, Loader2, Check, Settings as SettingsIcon, ShieldAlert, UserX, UserCheck } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore, ACCENT_PALETTE, type AccentColor } from '../../store/ui.store';
import { useAuth } from '../../hooks/useAuth';
import { usersApi } from '../../api/users.api';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

const COLOR_OPTIONS: { label: string; value: AccentColor }[] = [
  { label: 'Violet', value: 'violet' },
  { label: 'Cyan', value: 'cyan' },
  { label: 'Green', value: 'green' },
  { label: 'Rose', value: 'rose' },
  { label: 'Pink', value: 'pink' },
  { label: 'Amber', value: 'amber' },
];

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { darkMode, toggleDarkMode, accentColor, setAccentColor, setActiveTab, setProfileModalOpen } = useUIStore();
  const { logout, isLoggingOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState<'appearance' | 'chat' | 'privacy' | 'account'>('appearance');

  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const [sendOnEnter, setSendOnEnter] = useState(() => localStorage.getItem('sendOnEnter') !== 'false');
  const [readReceipts, setReadReceipts] = useState(() => localStorage.getItem('readReceipts') !== 'false');

  const loadBlockedUsers = async () => {
    setLoadingBlocked(true);
    try {
      const list = await usersApi.listBlocked();
      setBlockedUsers(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Failed to load blocked users');
    } finally {
      setLoadingBlocked(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'privacy') {
      loadBlockedUsers();
    }
  }, [activeSection]);

  const handleUnblock = async (userId: string) => {
    setUnblockingId(userId);
    try {
      await usersApi.unblockUser(userId);
      toast.success('User unblocked successfully');
      setBlockedUsers((prev) =>
        prev.filter((item) => {
          const target = item.blockedId && typeof item.blockedId === 'object' ? item.blockedId : item;
          const id = target._id || target.id || (typeof item.blockedId === 'string' ? item.blockedId : item._id);
          return id !== userId;
        })
      );
    } catch {
      toast.error('Failed to unblock user');
    } finally {
      setUnblockingId(null);
    }
  };

  const toggleSendOnEnter = () => {
    const next = !sendOnEnter;
    setSendOnEnter(next);
    localStorage.setItem('sendOnEnter', String(next));
    toast.success(next ? 'Send on Enter enabled' : 'Send on Enter disabled');
  };

  const toggleReadReceipts = () => {
    const next = !readReceipts;
    setReadReceipts(next);
    localStorage.setItem('readReceipts', String(next));
    toast.success(next ? 'Read receipts enabled' : 'Read receipts disabled');
  };

  const sections = [
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'chat' as const, label: 'Chat Settings', icon: MessageSquare },
    { id: 'privacy' as const, label: 'Privacy & Blocking', icon: ShieldAlert },
    { id: 'account' as const, label: 'Account', icon: User },
  ];

  return (
    <div className="flex-1 flex h-screen bg-[#050505] overflow-hidden">
      {/* Section sidebar */}
      <div className="w-56 border-r border-white/10 bg-[#09090B] p-4 flex-shrink-0 hidden md:block">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#5D5FEF]" /> Settings
        </h2>
        <nav className="flex flex-col gap-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer',
                  isActive
                    ? 'bg-[#18181C] text-white border-l-2 border-[#5D5FEF]'
                    : 'text-zinc-400 hover:bg-[#111114] hover:text-white'
                )}
                aria-label={`Navigate to ${section.label} settings`}
              >
                <Icon className={cn('w-4.5 h-4.5', isActive ? 'text-[#5D5FEF]' : 'text-zinc-400')} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
        {/* Mobile section tabs */}
        <div className="flex gap-2 mb-6 md:hidden overflow-x-auto pb-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                )}
                aria-label={`Switch to ${section.label}`}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* === Appearance Section === */}
        {activeSection === 'appearance' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-violet-500" /> Accent Color
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Choose a primary color theme for the app
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {COLOR_OPTIONS.map((opt) => {
                const colors = ACCENT_PALETTE[opt.value];
                const isSelected = accentColor === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setAccentColor(opt.value)}
                    className="flex flex-col items-center gap-2 group"
                    aria-label={`Select ${opt.label} color theme`}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2',
                        isSelected
                          ? 'border-slate-900 dark:border-white scale-110 shadow-lg'
                          : 'border-transparent group-hover:scale-105'
                      )}
                      style={{
                        background: `linear-gradient(135deg, ${colors.gradientFrom}, ${colors.gradientTo})`,
                      }}
                    >
                      {isSelected && <Check className="w-5 h-5 text-white stroke-[3]" />}
                    </div>
                    <span className={cn(
                      'text-[11px] font-semibold',
                      isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                    )}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#111114] border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#18181C] flex items-center justify-center">
                    {darkMode ? <Moon className="w-5 h-5 text-[#5D5FEF]" /> : <Sun className="w-5 h-5 text-amber-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Dark Mode</p>
                    <p className="text-xs text-zinc-400">Switch between light and dark theme</p>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={cn(
                    'w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex-shrink-0 cursor-pointer',
                    darkMode ? 'bg-[#5D5FEF]' : 'bg-zinc-700'
                  )}
                  aria-label="Toggle dark mode"
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm',
                      darkMode ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === Chat Settings Section === */}
        {activeSection === 'chat' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#5D5FEF]" /> Chat & Messaging
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                Customize your chatting experience
              </p>
            </div>

            {/* Message bubble style preview */}
            <div className="p-5 rounded-2xl bg-[#111114] border border-white/10">
              <h4 className="text-sm font-bold text-white mb-3">Bubble Style</h4>
              <p className="text-xs text-zinc-400 mb-4">Preview of how messages appear</p>

              <div className="space-y-3">
                {/* Own message preview */}
                <div className="flex justify-end">
                  <div className="max-w-[70%] px-4 py-3 rounded-2xl rounded-br-xs text-sm leading-relaxed shadow-sm sent-bubble">
                    Hey! How are you?
                    <div className="text-[10px] text-white/70 text-right mt-1 font-semibold">10:30 AM</div>
                  </div>
                </div>
                {/* Other message preview */}
                <div className="flex justify-start">
                  <div className="max-w-[70%] px-4 py-3 rounded-2xl rounded-bl-xs text-sm leading-relaxed shadow-sm bg-[#181818] border border-white/5 text-white">
                    I'm good! Thanks for asking.
                    <div className="text-[10px] text-zinc-400 text-right mt-1 font-semibold">10:31 AM</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Send on Enter Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#111114] border border-white/10">
              <div>
                <p className="text-sm font-bold text-white">Send on Enter</p>
                <p className="text-xs text-zinc-400">Press Enter to send, Shift+Enter for new line</p>
              </div>
              <button
                onClick={toggleSendOnEnter}
                className={cn(
                  'w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex-shrink-0 cursor-pointer',
                  sendOnEnter ? 'bg-[#5D5FEF]' : 'bg-zinc-700'
                )}
                aria-label="Toggle send on enter"
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm',
                    sendOnEnter ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* Read receipts Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#111114] border border-white/10">
              <div>
                <p className="text-sm font-bold text-white">Read Receipts</p>
                <p className="text-xs text-zinc-400">Let others know when you've read their messages</p>
              </div>
              <button
                onClick={toggleReadReceipts}
                className={cn(
                  'w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex-shrink-0 cursor-pointer',
                  readReceipts ? 'bg-[#5D5FEF]' : 'bg-zinc-700'
                )}
                aria-label="Toggle read receipts"
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm',
                    readReceipts ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          </div>
        )}

        {/* === Privacy & Blocking Section === */}
        {activeSection === 'privacy' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#5D5FEF]" /> Privacy & Blocked Users
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                Manage contacts you have blocked from messaging or interacting with you
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#111114] border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserX className="w-4 h-4 text-rose-500" /> Blocked Contacts ({blockedUsers.length})
                </h4>
              </div>

              {loadingBlocked ? (
                <div className="flex items-center justify-center py-10 text-zinc-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#5D5FEF]" />
                  <span className="text-sm font-medium">Loading blocked users...</span>
                </div>
              ) : blockedUsers.length === 0 ? (
                <div className="text-center py-10 bg-[#09090B] rounded-2xl border border-dashed border-white/10">
                  <UserCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-bold text-white">No Blocked Users</p>
                  <p className="text-xs text-zinc-400 mt-1">You haven't blocked anyone yet. Blocked contacts will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map((item) => {
                    const targetUser = item.blockedId && typeof item.blockedId === 'object' ? item.blockedId : item;
                    const userId = targetUser._id || targetUser.id || (typeof item.blockedId === 'string' ? item.blockedId : item._id);
                    const name = targetUser.displayName || targetUser.username || 'Blocked User';
                    const username = targetUser.username;
                    const avatar = targetUser.avatarUrl;

                    return (
                      <div
                        key={item._id || userId}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-[#18181C] border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {avatar ? (
                            <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white font-bold flex items-center justify-center text-sm">
                              {name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{name}</p>
                            {username && <p className="text-xs text-zinc-400 truncate">@{username}</p>}
                          </div>
                        </div>

                        <button
                          onClick={() => handleUnblock(userId)}
                          disabled={unblockingId === userId}
                          className="px-3.5 py-1.5 bg-[#111114] hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0 cursor-pointer"
                          aria-label={`Unblock ${name}`}
                        >
                          {unblockingId === userId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5D5FEF]" />
                          ) : (
                            'Unblock'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === Account Section === */}
        {activeSection === 'account' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-[#5D5FEF]" /> Account
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                Manage your profile and account settings
              </p>
            </div>

            {/* Profile card */}
            <div className="p-5 rounded-2xl bg-[#111114] border border-white/10">
              <div className="flex items-center gap-4">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || user.username}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/10"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white font-bold flex items-center justify-center text-xl shadow-md">
                    {(user?.displayName || user?.username || 'U').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-white truncate">
                    {user?.displayName || user?.username}
                  </h4>
                  <p className="text-sm text-zinc-400 truncate">@{user?.username}</p>
                  {user?.bio && <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{user.bio}</p>}
                </div>
                <button
                  onClick={() => {
                    setActiveTab('chats');
                    setProfileModalOpen(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white text-sm font-bold rounded-xl hover:scale-105 active:scale-95 transition-all flex-shrink-0 cursor-pointer shadow-lg shadow-[#5D5FEF]/20"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="p-4 rounded-2xl bg-[#111114] border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Email</p>
                  <p className="text-xs text-zinc-400">{user?.email}</p>
                </div>
                {user?.isEmailVerified ? (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                    Verified
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full">
                    Unverified
                  </span>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-white/10 pt-6">
              <h4 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Danger Zone
              </h4>

              {!showLogoutConfirm ? (
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#111114] border border-rose-900/40 hover:bg-rose-950/30 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/40 flex items-center justify-center">
                      <LogOut className="w-5 h-5 text-rose-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-rose-300">Log out</p>
                      <p className="text-xs text-zinc-400">Sign out of your account</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-rose-400 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-900/60">
                  <p className="text-sm font-bold text-rose-300 mb-2">Are you sure you want to log out?</p>
                  <p className="text-xs text-rose-400 mb-4">You'll need to sign in again to access your account.</p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="px-4 py-2 text-sm font-bold text-zinc-400 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => logout()}
                      disabled={isLoggingOut}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-md shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isLoggingOut ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Logging out...</>
                      ) : 'Yes, log out'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

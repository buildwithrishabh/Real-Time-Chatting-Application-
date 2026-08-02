import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UserCheck,
  Camera,
  Loader2,
  Moon,
  Sun,
  ShieldCheck,
  LogOut,
  Bell,
  Lock,
  Smartphone,
  Check,
  Palette,
  ShieldAlert,
  UserX,
} from 'lucide-react';
import { useUIStore } from '../../store/ui.store';
import type { AccentColor } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { useSocketStore } from '../../store/socket.store';
import { useAuth } from '../../hooks/useAuth';
import { usersApi } from '../../api/users.api';
import { filesApi } from '../../api/files.api';
import axios from 'axios';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

type SettingsTab = 'profile' | 'appearance' | 'privacy' | 'security' | 'notifications';

export function ProfileSettingsModal() {
  const { isProfileModalOpen, setProfileModalOpen, darkMode, toggleDarkMode, accentColor, setAccentColor } = useUIStore();
  const { user, setUser, deviceId } = useAuthStore();
  const { logout, isLoggingOut } = useAuth();
  const isConnected = useSocketStore((s) => s.isConnected);

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBlockedUsers = async () => {
    try {
      setLoadingBlocked(true);
      const list = await usersApi.listBlocked();
      setBlockedUsers(list || []);
    } catch {
      toast.error('Failed to load blocked users');
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      setUnblockingId(userId);
      await usersApi.unblockUser(userId);
      setBlockedUsers((prev) =>
        prev.filter((item) => {
          const targetUser = item.blockedId && typeof item.blockedId === 'object' ? item.blockedId : item;
          const targetId = targetUser._id || targetUser.id || (typeof item.blockedId === 'string' ? item.blockedId : item._id);
          return targetId !== userId;
        })
      );
      toast.success('User unblocked successfully');
    } catch {
      toast.error('Failed to unblock user');
    } finally {
      setUnblockingId(null);
    }
  };

  useEffect(() => {
    if (isProfileModalOpen && activeTab === 'privacy') {
      fetchBlockedUsers();
    }
  }, [isProfileModalOpen, activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isProfileModalOpen) {
        setProfileModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileModalOpen, setProfileModalOpen]);

  if (!isProfileModalOpen) return null;

  const accentOptions: { id: AccentColor; name: string; bg: string }[] = [
    { id: 'violet', name: 'Electric Violet', bg: 'bg-violet-600' },
    { id: 'cyan', name: 'Radiant Cyan', bg: 'bg-cyan-500' },
    { id: 'green', name: 'Emerald Mint', bg: 'bg-emerald-500' },
    { id: 'rose', name: 'Sunset Rose', bg: 'bg-rose-500' },
    { id: 'pink', name: 'Neon Pink', bg: 'bg-pink-500' },
    { id: 'amber', name: 'Warm Amber', bg: 'bg-amber-500' },
  ];

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    try {
      const signed = await filesApi.sign('image', file.type);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signed.apiKey);
      formData.append('timestamp', String(signed.timestamp));
      formData.append('signature', signed.signature);
      formData.append('folder', signed.folder);

      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
        formData
      );

      const { public_id, secure_url } = cloudinaryRes.data;
      await usersApi.updateProfile({ avatarUrl: secure_url });
      setUser({ ...user!, avatarUrl: secure_url, avatarPublicId: public_id });
      toast.success('Avatar updated successfully');
    } catch {
      toast.error('Failed to upload avatar');
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedUser = await usersApi.updateProfile({ displayName, bio });
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const currentAvatar = avatarPreview || user?.avatarUrl;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 md:p-6"
      onClick={() => setProfileModalOpen(false)}
    >
      <div
        className="bg-[#09090B] border border-white/10 rounded-3xl md:max-w-2xl w-full h-[95vh] md:h-auto max-h-[95vh] p-4 sm:p-6 shadow-2xl animate-scale-in flex flex-col md:flex-row gap-4 md:gap-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Mobile Header & Horizontal Tab Pills Bar */}
        <div className="md:hidden flex flex-col gap-3 pb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-white">Settings</h3>
            <button
              onClick={() => setProfileModalOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
            <button
              onClick={() => setActiveTab('profile')}
              className={cn(
                'px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer',
                activeTab === 'profile'
                  ? 'bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white shadow-sm'
                  : 'bg-[#111114] border border-white/5 text-zinc-400'
              )}
              aria-label="Switch to profile tab"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={cn(
                'px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer',
                activeTab === 'appearance'
                  ? 'bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white shadow-sm'
                  : 'bg-[#111114] border border-white/5 text-zinc-400'
              )}
              aria-label="Switch to appearance tab"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Appearance</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={cn(
                'px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer',
                activeTab === 'privacy'
                  ? 'bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white shadow-sm'
                  : 'bg-[#111114] border border-white/5 text-zinc-400'
              )}
              aria-label="Switch to privacy tab"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Privacy & Blocking</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={cn(
                'px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer',
                activeTab === 'security'
                  ? 'bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white shadow-sm'
                  : 'bg-[#111114] border border-white/5 text-zinc-400'
              )}
              aria-label="Switch to security tab"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Security</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={cn(
                'px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer',
                activeTab === 'notifications'
                  ? 'bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white shadow-sm'
                  : 'bg-[#111114] border border-white/5 text-zinc-400'
              )}
              aria-label="Switch to notifications tab"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notifications</span>
            </button>
          </div>
        </div>

        {/* Desktop Left Navigation Sidebar */}
        <div className="hidden md:flex w-56 flex-col gap-1 border-r border-white/10 pr-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-lg font-extrabold text-white">Settings</h3>
          </div>

          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors text-left cursor-pointer',
              activeTab === 'profile'
                ? 'bg-[#18181C] text-white border-l-2 border-[#5D5FEF]'
                : 'text-zinc-400 hover:bg-[#111114] hover:text-white'
            )}
            aria-label="Profile and account settings"
          >
            <UserCheck className="w-4 h-4" />
            <span>Profile & Account</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors text-left cursor-pointer',
              activeTab === 'appearance'
                ? 'bg-[#18181C] text-white border-l-2 border-[#5D5FEF]'
                : 'text-zinc-400 hover:bg-[#111114] hover:text-white'
            )}
            aria-label="Appearance and theme settings"
          >
            <Palette className="w-4 h-4" />
            <span>Appearance & Theme</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors text-left cursor-pointer',
              activeTab === 'privacy'
                ? 'bg-[#18181C] text-white border-l-2 border-[#5D5FEF]'
                : 'text-zinc-400 hover:bg-[#111114] hover:text-white'
            )}
            aria-label="Privacy and blocking settings"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Privacy & Blocking</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors text-left cursor-pointer',
              activeTab === 'security'
                ? 'bg-[#18181C] text-white border-l-2 border-[#5D5FEF]'
                : 'text-zinc-400 hover:bg-[#111114] hover:text-white'
            )}
            aria-label="Security and sessions settings"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Security & Sessions</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors text-left cursor-pointer',
              activeTab === 'notifications'
                ? 'bg-[#18181C] text-white border-l-2 border-[#5D5FEF]'
                : 'text-zinc-400 hover:bg-[#111114] hover:text-white'
            )}
            aria-label="Notifications settings"
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>

          <div className="mt-auto pt-4 border-t border-white/10">
            <button
              onClick={() => {
                logout();
                setProfileModalOpen(false);
              }}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm text-rose-400 hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Settings Content Scroll Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pr-1 pb-4 md:pb-0">
          <div className="hidden md:flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <h4 className="text-base font-extrabold text-white capitalize">
              {activeTab === 'profile' ? 'Profile Details' : activeTab}
            </h4>
            <button
              onClick={() => setProfileModalOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {currentAvatar ? (
                    <img
                      src={currentAvatar}
                      alt="Avatar"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/10 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white font-bold flex items-center justify-center text-xl sm:text-2xl shadow-md border-2 border-white/10">
                      {(displayName || user?.username || 'ME').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white flex items-center justify-center shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                    aria-label="Change profile picture"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>

                <div>
                  <h5 className="font-extrabold text-white text-base">
                    {displayName || user?.username}
                  </h5>
                  <p className="text-xs text-zinc-400 font-medium">@{user?.username}</p>
                  <p className="text-[11px] text-emerald-400 font-bold mt-1">
                    {user?.isEmailVerified ? '✓ Verified Account' : 'Pending Verification'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#111114] border border-white/10 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/25 focus:border-[#5D5FEF]/60 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={50}
                    placeholder="Tell others about yourself..."
                    className="w-full px-4 py-2.5 bg-[#111114] border border-white/10 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/25 focus:border-[#5D5FEF]/60 resize-none font-medium placeholder:text-zinc-500"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1 text-right font-medium">{bio.length}/50</p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-[#5D5FEF]/20"
                  >
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-4 sm:space-y-5">
              <div className="p-4 rounded-2xl bg-[#111114] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-5 h-5 text-[#5D5FEF]" /> : <Sun className="w-5 h-5 text-amber-400" />}
                  <div>
                    <p className="text-sm font-bold text-white">Dark Theme</p>
                    <p className="text-xs text-zinc-400 font-medium">Switch between light and dark modes</p>
                  </div>
                </div>

                <button
                  onClick={toggleDarkMode}
                  className={cn(
                    'w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex-shrink-0 cursor-pointer',
                    darkMode ? 'bg-[#5D5FEF]' : 'bg-zinc-700'
                  )}
                  aria-label="Toggle dark theme"
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm',
                      darkMode ? 'translate-x-6' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* Accent Color Palette Switcher */}
              <div className="p-4 rounded-2xl bg-[#111114] border border-white/10 space-y-3">
                <div>
                  <h5 className="text-xs font-bold text-white">Dashboard Accent Palette</h5>
                  <p className="text-[11px] text-zinc-400 font-medium">Select a theme to instantly change dashboard & chat bubble colors</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {accentOptions.map((opt) => {
                    const isSelected = accentColor === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setAccentColor(opt.id);
                          toast.success(`Theme updated to ${opt.name}`);
                        }}
                        className={cn(
                          'flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer',
                          isSelected
                            ? 'bg-[#18181C] border-[#5D5FEF] shadow-xs'
                            : 'border-white/5 hover:bg-white/5'
                        )}
                        aria-label={`Select ${opt.name} color palette`}
                      >
                        <span className={cn('w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white', opt.bg)}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className="text-xs font-bold text-white truncate">
                          {opt.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY & BLOCKING */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#111114] border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserX className="w-4 h-4 text-rose-400" /> Blocked Contacts ({blockedUsers.length})
                  </h4>
                </div>

                {loadingBlocked ? (
                  <div className="flex items-center justify-center py-8 text-zinc-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#5D5FEF]" />
                    <span className="text-xs font-medium">Loading blocked users...</span>
                  </div>
                ) : blockedUsers.length === 0 ? (
                  <div className="text-center py-8 bg-[#09090B] rounded-2xl border border-dashed border-white/10">
                    <UserCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-bold text-white">No Blocked Users</p>
                    <p className="text-[11px] text-zinc-400 mt-1">You haven't blocked anyone yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {blockedUsers.map((item) => {
                      const targetUser = item.blockedId && typeof item.blockedId === 'object' ? item.blockedId : item;
                      const userId = targetUser._id || targetUser.id || (typeof item.blockedId === 'string' ? item.blockedId : item._id);
                      const name = targetUser.displayName || targetUser.username || 'Blocked User';
                      const username = targetUser.username;
                      const avatar = targetUser.avatarUrl;

                      return (
                        <div
                          key={item._id || userId}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#18181C] border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {avatar ? (
                              <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white font-bold flex items-center justify-center text-xs">
                                {name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{name}</p>
                              {username && <p className="text-[10px] text-zinc-400 truncate">@{username}</p>}
                            </div>
                          </div>

                          <button
                            onClick={() => handleUnblock(userId)}
                            disabled={unblockingId === userId}
                            className="px-3 py-1 bg-[#111114] hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0 cursor-pointer"
                            aria-label={`Unblock ${name}`}
                          >
                            {unblockingId === userId ? (
                              <Loader2 className="w-3 h-3 animate-spin text-[#5D5FEF]" />
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

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#111114] border border-white/10 space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#5D5FEF]" />
                  <p className="text-sm font-bold text-white">In-Memory JWT Tokens</p>
                </div>
                <p className="text-xs text-zinc-400 font-medium">
                  Your session is protected with short-lived memory access tokens and HTTP-only cookie rotation.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#111114] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-zinc-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Active Device Session</p>
                    <p className="text-[11px] text-zinc-400 font-mono truncate max-w-[150px] sm:max-w-[200px]">{deviceId}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#111114] border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Real-Time Socket Alerts</p>
                  <p className="text-xs text-zinc-400 font-medium">Receive instant popups for mentions & messages</p>
                </div>
                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-lg border', isConnected ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' : 'bg-amber-950/60 text-amber-400 border-amber-500/30')}>
                  {isConnected ? 'Connected' : 'Connecting'}
                </span>
              </div>
            </div>
          )}

          {/* Mobile Logout Button at the bottom of Content */}
          <div className="md:hidden mt-6 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                logout();
                setProfileModalOpen(false);
              }}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs text-rose-400 bg-rose-950/30 border border-rose-900/60 cursor-pointer"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

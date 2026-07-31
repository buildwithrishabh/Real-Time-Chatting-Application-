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

type SettingsTab = 'profile' | 'appearance' | 'security' | 'notifications';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 md:p-6"
      onClick={() => setProfileModalOpen(false)}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl md:max-w-2xl w-full h-[95vh] md:h-auto max-h-[95vh] p-4 sm:p-6 shadow-2xl animate-scale-in flex flex-col md:flex-row gap-4 md:gap-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Mobile Header & Horizontal Tab Pills Bar */}
        <div className="md:hidden flex flex-col gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Settings</h3>
            <button
              onClick={() => setProfileModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
            <button
              onClick={() => setActiveTab('profile')}
              className={cn(
                'px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5',
                activeTab === 'profile'
                  ? 'gradient-btn text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
              aria-label="Switch to profile tab"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={cn(
                'px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5',
                activeTab === 'appearance'
                  ? 'gradient-btn text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
              aria-label="Switch to appearance tab"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Appearance</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={cn(
                'px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5',
                activeTab === 'security'
                  ? 'gradient-btn text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
              aria-label="Switch to security tab"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Security</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={cn(
                'px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5',
                activeTab === 'notifications'
                  ? 'gradient-btn text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
              aria-label="Switch to notifications tab"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notifications</span>
            </button>
          </div>
        </div>

        {/* Desktop Left Navigation Sidebar */}
        <div className="hidden md:flex w-56 flex-col gap-1 border-r border-slate-200 dark:border-slate-800 pr-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Settings</h3>
          </div>

          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors text-left',
              activeTab === 'profile'
                ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
            aria-label="Profile and account settings"
          >
            <UserCheck className="w-4 h-4" />
            <span>Profile & Account</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors text-left',
              activeTab === 'appearance'
                ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
            aria-label="Appearance and theme settings"
          >
            <Palette className="w-4 h-4" />
            <span>Appearance & Theme</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors text-left',
              activeTab === 'security'
                ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
            aria-label="Security and sessions settings"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Security & Sessions</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors text-left',
              activeTab === 'notifications'
                ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
            aria-label="Notifications settings"
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>

          <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                logout();
                setProfileModalOpen(false);
              }}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Settings Content Scroll Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pr-1 pb-4 md:pb-0">
          <div className="hidden md:flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white capitalize">
              {activeTab === 'profile' ? 'Profile Details' : activeTab}
            </h4>
            <button
              onClick={() => setProfileModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
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
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-violet-500/30 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xl sm:text-2xl shadow-md border-4 border-violet-500/30">
                      {(displayName || user?.username || 'ME').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full gradient-btn text-white flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
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
                  <h5 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {displayName || user?.username}
                  </h5>
                  <p className="text-xs text-slate-400 font-medium">@{user?.username}</p>
                  <p className="text-[11px] text-emerald-500 font-bold mt-1">
                    {user?.isEmailVerified ? '✓ Verified Account' : 'Pending Verification'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={50}
                    placeholder="Tell others about yourself..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 text-right font-medium">{bio.length}/50</p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto px-6 py-2.5 gradient-btn text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md active:scale-95 disabled:opacity-50 transition-all"
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
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-5 h-5 text-violet-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Dark Theme</p>
                    <p className="text-xs text-slate-400 font-medium">Switch between light and dark modes</p>
                  </div>
                </div>

                <button
                  onClick={toggleDarkMode}
                  className={cn(
                    'w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex-shrink-0',
                    darkMode ? 'bg-violet-600' : 'bg-slate-300'
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
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Dashboard Accent Palette</h5>
                  <p className="text-[11px] text-slate-400 font-medium">Select a theme to instantly change dashboard & chat bubble colors</p>
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
                          'flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all',
                          isSelected
                            ? 'bg-slate-100 dark:bg-slate-800 border-violet-500 dark:border-violet-400 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        )}
                        aria-label={`Select ${opt.name} color palette`}
                      >
                        <span className={cn('w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white', opt.bg)}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {opt.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-violet-500" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">In-Memory JWT Tokens</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Your session is protected with short-lived memory access tokens and HTTP-only cookie rotation.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Active Device Session</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate max-w-[150px] sm:max-w-[200px]">{deviceId}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                  Active
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Real-Time Socket Alerts</p>
                  <p className="text-xs text-slate-400 font-medium">Receive instant popups for mentions & messages</p>
                </div>
                <span className={cn('text-xs font-bold px-2 py-1 rounded-lg', isConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600')}>
                  {isConnected ? 'Connected' : 'Connecting'}
                </span>
              </div>
            </div>
          )}

          {/* Mobile Logout Button at the bottom of Content */}
          <div className="md:hidden mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                logout();
                setProfileModalOpen(false);
              }}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60"
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

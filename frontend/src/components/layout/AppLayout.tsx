import { useEffect, useMemo, useState } from 'react';
import { Bookmark, Phone, Settings, Users, UserPlus, WifiOff } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { ChatSidebar } from '../chat/ChatSidebar';
import { ChatWindow } from '../chat/ChatWindow';
import { NewChatModal } from '../chat/NewChatModal';
import { ProfileSettingsModal } from '../chat/ProfileSettingsModal';
import { NotificationSidebar } from '../chat/NotificationSidebar';
import { CallHistorySidebar } from '../chat/CallHistorySidebar';
import { SettingsPage } from '../../pages/chat/SettingsPage';
import { useConversations } from '../../hooks/useConversations';
import { useChatStore } from '../../store/chat.store';
import { useUIStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { usePresenceStore } from '../../store/presence.store';
import { usersApi } from '../../api/users.api';
import { useSocketStore } from '../../store/socket.store';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export function AppLayout() {
  const { data: conversationsData, isLoading } = useConversations();
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const activeTab = useUIStore((s) => s.activeTab);
  const initPresenceListener = usePresenceStore((s) => s.initListener);
  const syncPresence = usePresenceStore((s) => s.syncPresence);
  const setUser = useAuthStore((s) => s.setUser);
  const currentUserId = useAuthStore((s) => s.user?._id || (s.user as any)?.id)?.toString();
  const isConnected = useSocketStore((s) => s.isConnected);
  const [isNetworkOffline, setIsNetworkOffline] = useState(!navigator.onLine);

  const conversations = conversationsData?.pages.flatMap((page) => page.items) || [];
  const activeConversation = conversations.find((c) => c._id === activeConversationId) || null;

  const participantUserIds = useMemo(() => {
    const ids: string[] = [];
    (conversationsData?.pages || []).forEach((page) =>
      (page.items || []).forEach((conv) => {
        (conv.participants || []).forEach((p) => {
          if (!p?.userId) return;
          const pid =
            typeof p.userId === 'string'
              ? p.userId
              : (p.userId as any)?._id || (p.userId as any)?.id;
          if (pid && pid.toString() !== currentUserId) ids.push(pid.toString());
        });
      })
    );
    return [...new Set(ids)];
  }, [conversationsData, currentUserId]);
  const showChatView = activeTab === 'chats';
  const EmptyTabIcon =
    activeTab === 'people'
      ? Users
      : activeTab === 'groups'
        ? UserPlus
        : activeTab === 'saved'
          ? Bookmark
          : Settings;

  useEffect(() => {
    const handleOnline = () => {
      setIsNetworkOffline(false);
      toast.success('Internet connection restored');
    };
    const handleOffline = () => {
      setIsNetworkOffline(true);
      toast.error('You are currently offline. Check your internet connection.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    usersApi
      .getMe()
      .then((userData) => {
        if (userData) setUser(userData);
      })
      .catch(() => {});
  }, [setUser]);

  useEffect(() => {
    const cleanup = initPresenceListener();
    return cleanup;
  }, [initPresenceListener, isConnected]);

  useEffect(() => {
    if (!isConnected) return;
    syncPresence(participantUserIds);
  }, [isConnected, syncPresence, participantUserIds]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050505] relative">
      {isNetworkOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-4 h-4" />
          <span>No internet connection. Attempting to reconnect...</span>
        </div>
      )}

      <Sidebar />

      {showChatView && (
        <>
          <div
            className={cn(
              'flex-shrink-0',
              activeConversationId ? 'hidden md:flex' : 'flex flex-1 md:flex-none w-full md:w-auto pb-16 md:pb-0'
            )}
          >
            <ChatSidebar conversations={conversations} isLoading={isLoading} />
          </div>

          <div
            className={cn(
              'flex-1 min-w-0 h-full',
              activeConversationId ? 'flex' : 'hidden md:flex'
            )}
          >
            <ChatWindow activeConversation={activeConversation} />
          </div>
        </>
      )}

      {!showChatView && activeTab === 'calls' && (
        <>
          <div className="flex-shrink-0 flex flex-1 md:flex-none w-full md:w-auto pb-16 md:pb-0">
            <CallHistorySidebar />
          </div>
          <div className="hidden md:flex flex-1 items-center justify-center bg-[#070B12] text-center p-8">
            <div className="flex flex-col items-center justify-center max-w-sm">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#5D5FEF]/20 to-[#3B82F6]/20 border border-white/10 flex items-center justify-center mb-4">
                <Phone className="w-8 h-8 text-[#5D5FEF]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Call Logs & History</h3>
              <p className="text-xs text-zinc-400">
                Select a call from your log to redial or view past voice and video conversation details.
              </p>
            </div>
          </div>
        </>
      )}

      {!showChatView && activeTab === 'settings' && (
        <div className="flex-1 min-w-0 pb-16 md:pb-0">
          <SettingsPage />
        </div>
      )}

      {!showChatView && activeTab !== 'settings' && activeTab !== 'calls' && (
        <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#070B12] pb-16 md:pb-0">
          <div className="text-center px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-violet-600/15 via-cyan-500/15 to-emerald-500/15 flex items-center justify-center border border-slate-200/80 dark:border-slate-800/80">
              <EmptyTabIcon className="w-9 h-9 text-violet-500/70" />
            </div>
            <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 capitalize">
              {activeTab === 'saved' ? 'Saved Messages' : activeTab}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {activeTab === 'people'
                ? 'Coming soon: find and connect with people'
                : activeTab === 'groups'
                  ? 'Coming soon: discover and manage groups'
                  : activeTab === 'saved'
                    ? 'Coming soon: your bookmarked messages'
                    : 'Coming soon: app settings and preferences'}
            </p>
          </div>
        </div>
      )}

      <MobileBottomNav />
      <NewChatModal />
      <ProfileSettingsModal />
      <NotificationSidebar />
    </div>
  );
}

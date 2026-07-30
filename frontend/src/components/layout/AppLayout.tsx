import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { ChatSidebar } from '../chat/ChatSidebar';
import { ChatWindow } from '../chat/ChatWindow';
import { NewChatModal } from '../chat/NewChatModal';
import { ProfileSettingsModal } from '../chat/ProfileSettingsModal';
import { NotificationSidebar } from '../chat/NotificationSidebar';
import { SettingsPage } from '../../pages/chat/SettingsPage';
import { useConversations } from '../../hooks/useConversations';
import { useChatStore } from '../../store/chat.store';
import { useUIStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { usePresenceStore } from '../../store/presence.store';
import { usersApi } from '../../api/users.api';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export function AppLayout() {
  const { data: conversationsData, isLoading } = useConversations();
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const activeTab = useUIStore((s) => s.activeTab);
  const initPresenceListener = usePresenceStore((s) => s.initListener);
  const setUser = useAuthStore((s) => s.setUser);
  const [isNetworkOffline, setIsNetworkOffline] = useState(!navigator.onLine);

  const conversations = conversationsData?.pages.flatMap((page) => page.items) || [];
  const activeConversation = conversations.find((c) => c._id === activeConversationId) || null;

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
    // Fetch and sync user profile details on dashboard mount
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
  }, [initPresenceListener]);

  const showChatView = activeTab === 'chats';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0F172A] relative">
      {/* Network Offline Alert Banner */}
      {isNetworkOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-4 h-4" />
          <span>No Internet Connection. Attempting to reconnect...</span>
        </div>
      )}

      {/* Sidebar navigation (Desktop hover rail + Mobile slide-over drawer) */}
      <Sidebar />

      {showChatView && (
        <>
          {/* Conversations panel - hidden on small screens when viewing an active chat */}
          <div className={cn(
            'flex-shrink-0',
            activeConversationId ? 'hidden md:flex' : 'flex flex-1 md:flex-none w-full md:w-auto pb-16 md:pb-0'
          )}>
            <ChatSidebar
              conversations={conversations}
              isLoading={isLoading}
            />
          </div>

          {/* Active chat window - takes full screen on mobile when active */}
          <div className={cn(
            'flex-1 min-w-0 h-full',
            activeConversationId ? 'flex' : 'hidden md:flex'
          )}>
            <ChatWindow activeConversation={activeConversation} />
          </div>
        </>
      )}

      {/* Non-chat tabs */}
      {!showChatView && activeTab === 'settings' && (
        <div className="flex-1 min-w-0 pb-16 md:pb-0">
          <SettingsPage />
        </div>
      )}
      {!showChatView && activeTab !== 'settings' && (
        <div className="flex-1 flex items-center justify-center bg-slate-50/50 dark:bg-[#0B0F19] pb-16 md:pb-0">
          <div className="text-center px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-violet-600/20 via-indigo-600/20 to-cyan-500/20 flex items-center justify-center">
              <span className="text-3xl font-bold text-violet-600/40 capitalize">
                {activeTab === 'people' ? '👥' : activeTab === 'groups' ? '👤' : activeTab === 'calls' ? '📞' : activeTab === 'saved' ? '🔖' : '⚙️'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500 capitalize">
              {activeTab === 'saved' ? 'Saved Messages' : activeTab}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {activeTab === 'people' ? 'Coming soon — find and connect with people' :
               activeTab === 'groups' ? 'Coming soon — discover and manage groups' :
               activeTab === 'calls' ? 'Coming soon — voice and video calls' :
               activeTab === 'saved' ? 'Coming soon — your bookmarked messages' :
               'Coming soon — app settings and preferences'}
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

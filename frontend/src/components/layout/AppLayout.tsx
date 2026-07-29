import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ChatSidebar } from '../chat/ChatSidebar';
import { ChatWindow } from '../chat/ChatWindow';
import { NewChatModal } from '../chat/NewChatModal';
import { ProfileSettingsModal } from '../chat/ProfileSettingsModal';
import { useConversations } from '../../hooks/useConversations';
import { useChatStore } from '../../store/chat.store';
import { useUIStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { usePresenceStore } from '../../store/presence.store';
import { usersApi } from '../../api/users.api';
import { cn } from '../../lib/utils';

export function AppLayout() {
  const { data: conversationsData, isLoading } = useConversations();
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const activeTab = useUIStore((s) => s.activeTab);
  const initPresenceListener = usePresenceStore((s) => s.initListener);
  const setUser = useAuthStore((s) => s.setUser);

  const conversations = conversationsData?.pages.flatMap((page) => page.items) || [];
  const activeConversation = conversations.find((c) => c._id === activeConversationId) || null;

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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0F172A]">
      {/* Sidebar navigation - hidden on small screens when viewing active chat */}
      <div className={cn(
        'flex-shrink-0',
        activeConversationId ? 'hidden lg:flex' : 'flex'
      )}>
        <Sidebar />
      </div>

      {showChatView && (
        <>
          {/* Conversations panel - hidden on small screens when viewing active chat */}
          <div className={cn(
            'flex-shrink-0',
            activeConversationId ? 'hidden md:flex' : 'flex flex-1 md:flex-none'
          )}>
            <ChatSidebar
              conversations={conversations}
              isLoading={isLoading}
            />
          </div>

          {/* Active chat window */}
          <div className={cn(
            'flex-1 min-w-0',
            activeConversationId ? 'flex' : 'hidden md:flex'
          )}>
            <ChatWindow activeConversation={activeConversation} />
          </div>
        </>
      )}

      {/* Non-chat tabs - placeholder content */}
      {!showChatView && (
        <div className="flex-1 flex items-center justify-center bg-slate-50/50 dark:bg-[#0B0F19]">
          <div className="text-center">
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

      <NewChatModal />
      <ProfileSettingsModal />
    </div>
  );
}

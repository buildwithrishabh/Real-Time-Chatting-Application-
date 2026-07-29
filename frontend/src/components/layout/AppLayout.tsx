import { Sidebar } from './Sidebar';
import { ChatSidebar } from '../chat/ChatSidebar';
import { ChatWindow } from '../chat/ChatWindow';
import { NewChatModal } from '../chat/NewChatModal';
import { ProfileSettingsModal } from '../chat/ProfileSettingsModal';
import { useConversations } from '../../hooks/useConversations';
import { useChatStore } from '../../store/chat.store';

export function AppLayout() {
  const { data: conversationsData, isLoading } = useConversations();
  const activeConversationId = useChatStore((s) => s.activeConversationId);

  const conversations = conversationsData?.pages.flatMap((page) => page.items) || [];
  const activeConversation = conversations.find((c) => c._id === activeConversationId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0F172A]">
      {/* Sidebar navigation - hidden on small screens when viewing active chat */}
      <div className={activeConversationId ? 'hidden md:flex' : 'flex'}>
        <Sidebar />
      </div>

      {/* Conversations panel - hidden on small screens when viewing active chat */}
      <div className={activeConversationId ? 'hidden md:flex' : 'flex flex-1 md:flex-none'}>
        <ChatSidebar conversations={conversations} isLoading={isLoading} />
      </div>

      {/* Active chat window - hidden on small screens when NO conversation is selected */}
      <div className={activeConversationId ? 'flex flex-1' : 'hidden md:flex flex-1'}>
        <ChatWindow activeConversation={activeConversation} />
      </div>

      <NewChatModal />
      <ProfileSettingsModal />
    </div>
  );
}

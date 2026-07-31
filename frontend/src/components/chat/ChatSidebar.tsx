import { useState } from 'react';
import { MessageSquareOff, WifiOff, Menu } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from '../../types/chat';
import { useChatStore } from '../../store/chat.store';
import { useSocketStore } from '../../store/socket.store';
import { useUIStore } from '../../store/ui.store';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';

interface ChatSidebarProps {
  conversations: Conversation[];
  isLoading?: boolean;
}

type FilterTab = 'all' | 'unread' | 'groups';

export function ChatSidebar({ conversations, isLoading }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const { activeConversationId, setActiveConversation } = useChatStore();
  const isConnected = useSocketStore((s) => s.isConnected);
  const { setNewChatOpen, setMobileDrawerOpen } = useUIStore();
  const currentUserId = useAuthStore((s) => s.user?._id || (s.user as any)?.id);

  const filteredConversations = conversations.filter((conv) => {
    const participantNames = conv.participants
      ?.map((p) => (p?.userId && typeof p.userId === 'object' ? `${p.userId.displayName || ''} ${p.userId.username || ''}` : ''))
      .join(' ');
    const title = `${conv.name || ''} ${participantNames || ''}`;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterTab === 'unread') {
      const myParticipant = conv.participants?.find((p) => {
        if (!p?.userId) return false;
        const pId = typeof p.userId === 'string' ? p.userId : p.userId._id || (p.userId as any)?.id;
        return pId === currentUserId;
      });
      return (myParticipant?.unreadCount || 0) > 0;
    }
    if (filterTab === 'groups') return conv.type === 'group';
    return true;
  });

  return (
    <div className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex flex-col h-screen select-none">
      {/* Connection Status */}
      {!isConnected && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Connecting to server...</span>
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
        </div>
      )}

      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Chats
            </h2>
          </div>
        </div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {searchQuery ? (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400">
              {filteredConversations.length} result{filteredConversations.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline"
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1 mt-3">
            <div className="flex gap-1">
              {(['all', 'unread', 'groups'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize',
                    filterTab === tab
                      ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={() => setNewChatOpen(true)}
              className="px-2.5 py-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg flex items-center gap-1 transition-colors"
            >
              <span>New</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            {searchQuery ? (
              <>
                <MessageSquareOff className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-slate-400 mb-1">No conversations found</p>
                <p className="text-xs text-slate-400">Try a different search term</p>
              </>
            ) : (
              <>
                <MessageSquareOff className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-slate-400 mb-1">No conversations yet</p>
                <p className="text-xs text-slate-400 mb-4">
                  Start a new chat to begin messaging
                </p>
                <button
                  onClick={() => setNewChatOpen(true)}
                  className="px-4 py-2 gradient-btn text-white text-sm font-bold rounded-xl hover:scale-105 active:scale-95 transition-all"
                >
                  Start a Chat
                </button>
              </>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv._id}
              conversation={conv}
              isActive={activeConversationId === conv._id}
              onClick={() => setActiveConversation(conv._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

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
    <div className="w-full md:w-80 border-r border-white/10 bg-[#09090B] flex flex-col h-screen select-none">
      {/* Connection Status */}
      {!isConnected && (
        <div className="px-4 py-2 bg-amber-950/30 border-b border-amber-900/50">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
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
              className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Messages
            </h2>
          </div>
        </div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {searchQuery ? (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-zinc-400">
              {filteredConversations.length} result{filteredConversations.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#5D5FEF] font-semibold hover:underline"
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1 mt-3">
            <div className="flex gap-1 bg-[#111114] p-1 rounded-xl border border-white/5">
              {(['all', 'unread', 'groups'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize cursor-pointer',
                    filterTab === tab
                      ? 'bg-[#18181C] text-white border border-white/10 shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={() => setNewChatOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] rounded-xl flex items-center gap-1 transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#5D5FEF]/20 cursor-pointer"
            >
              <span>+ New</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 px-3 pb-4">
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex items-center gap-3 p-3 rounded-2xl bg-[#111114] border border-white/5 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-[#18181C] flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#18181C] rounded w-2/3" />
                  <div className="h-3 bg-[#18181C] rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            {searchQuery ? (
              <>
                <MessageSquareOff className="w-10 h-10 text-zinc-600 mb-3" />
                <p className="text-sm text-zinc-400 mb-1">No conversations found</p>
                <p className="text-xs text-zinc-500">Try a different search term</p>
              </>
            ) : (
              <>
                <MessageSquareOff className="w-10 h-10 text-zinc-600 mb-3" />
                <p className="text-sm text-zinc-400 mb-1">No conversations yet</p>
                <p className="text-xs text-zinc-500 mb-4">
                  Start a new chat to begin messaging
                </p>
                <button
                  onClick={() => setNewChatOpen(true)}
                  className="px-4 py-2 bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white text-sm font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#5D5FEF]/20 cursor-pointer"
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

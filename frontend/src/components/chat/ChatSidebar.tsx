import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from '../../types/chat';
import { useChatStore } from '../../store/chat.store';

interface ChatSidebarProps {
  conversations: Conversation[];
  isLoading?: boolean;
}

const MOCK_CONVERSATIONS: Partial<Conversation>[] = [
  {
    _id: 'conv-1',
    type: 'private',
    name: 'Priya Verma',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    updatedAt: new Date().toISOString(),
    participants: [
      {
        _id: 'p-1',
        userId: { _id: 'u-1', displayName: 'Priya Verma', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', privacySettings: { onlineStatus: 'public', lastSeen: 'public' } } as any,
        conversationId: 'conv-1',
        role: 'member',
        muted: false,
        archived: false,
        unreadCount: 2,
        joinedAt: '',
      },
    ],
    lastMessage: {
      _id: 'm-1',
      conversationId: 'conv-1',
      senderId: 'u-1',
      content: 'Hey! How are you doing?',
      type: 'text',
      isPinned: false,
      isEdited: false,
      isDeletedForEveryone: false,
      deletedByUsers: [],
      mentions: [],
      starredBy: [],
      reactions: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    _id: 'conv-2',
    type: 'private',
    name: 'Rohan Mehta',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    participants: [
      {
        _id: 'p-2',
        userId: { _id: 'u-2', displayName: 'Rohan Mehta', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', privacySettings: { onlineStatus: 'public', lastSeen: 'public' } } as any,
        conversationId: 'conv-2',
        role: 'member',
        muted: false,
        archived: false,
        unreadCount: 1,
        joinedAt: '',
      },
    ],
    lastMessage: {
      _id: 'm-2',
      conversationId: 'conv-2',
      senderId: 'u-2',
      content: "Let's catch up later",
      type: 'text',
      isPinned: false,
      isEdited: false,
      isDeletedForEveryone: false,
      deletedByUsers: [],
      mentions: [],
      starredBy: [],
      reactions: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    _id: 'conv-3',
    type: 'group',
    name: 'College Group',
    avatarUrl: '',
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    participants: [
      {
        _id: 'p-3',
        userId: 'u-me',
        conversationId: 'conv-3',
        role: 'member',
        muted: false,
        archived: false,
        unreadCount: 3,
        joinedAt: '',
      },
    ],
    lastMessage: {
      _id: 'm-3',
      conversationId: 'conv-3',
      senderId: 'u-3',
      content: 'Sneha: Notes are uploaded',
      type: 'text',
      isPinned: false,
      isEdited: false,
      isDeletedForEveryone: false,
      deletedByUsers: [],
      mentions: [],
      starredBy: [],
      reactions: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
];

export function ChatSidebar({ conversations, isLoading }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { activeConversationId, setActiveConversation } = useChatStore();

  const displayList =
    conversations && conversations.length > 0
      ? conversations
      : (MOCK_CONVERSATIONS as Conversation[]);

  const filteredConversations = displayList.filter((conv) => {
    const title = conv.name || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex flex-col h-screen p-4 select-none">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Chats
        </h2>
        <button className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {isLoading ? (
          <div className="space-y-3 p-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No conversations found
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

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Search, UserPlus, Users, Check, ChevronRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../store/ui.store';
import { usersApi } from '../../api/users.api';
import { chatsApi } from '../../api/chats.api';
import { useChatStore } from '../../store/chat.store';
import type { User } from '../../types/user';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export function NewChatModal() {
  const queryClient = useQueryClient();
  const { isNewChatOpen, setNewChatOpen } = useUIStore();
  const { setActiveConversation } = useChatStore();
  const [mode, setMode] = useState<'private' | 'group'>('private');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNewChatOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      setMode('private');
      setQuery('');
      setResults([]);
      setSelectedUsers([]);
      setGroupName('');
    }
  }, [isNewChatOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNewChatOpen) {
        setNewChatOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNewChatOpen, setNewChatOpen]);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await usersApi.search(q);
        setResults(users.filter((u) => !selectedUsers.some((s) => s._id === u._id)));
      } catch {
        toast.error('Failed to search users');
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [selectedUsers]);

  const handleSelectUser = (user: User) => {
    if (mode === 'private') {
      handleStartPrivateChat(user);
    } else {
      if (selectedUsers.some((u) => u._id === user._id)) {
        setSelectedUsers((prev) => prev.filter((u) => u._id !== user._id));
      } else {
        setSelectedUsers((prev) => [...prev, user]);
        setQuery('');
        setResults([]);
        searchInputRef.current?.focus();
      }
    }
  };

  const handleStartPrivateChat = async (user: User) => {
    try {
      setIsCreating(true);
      const conv = await chatsApi.create({
        type: 'private',
        participantUserIds: [user._id],
      });
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConversation(conv._id);
      setNewChatOpen(false);
      toast.success(`Chat started with ${user.displayName || user.username}`);
    } catch {
      toast.error('Failed to create chat');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (selectedUsers.length === 0) {
      toast.error('Please add at least one participant');
      return;
    }

    try {
      setIsCreating(true);
      const conv = await chatsApi.create({
        type: 'group',
        name: groupName.trim(),
        participantUserIds: selectedUsers.map((u) => u._id),
      });
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConversation(conv._id);
      setNewChatOpen(false);
      toast.success(`Group "${groupName}" created`);
    } catch {
      toast.error('Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isNewChatOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={() => setNewChatOpen(false)}
    >
      <div
        className="bg-[#09090B] border border-white/10 rounded-3xl max-w-md w-full shadow-2xl animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#5D5FEF]" />
            {mode === 'private' ? 'New Chat' : 'Create Group'}
          </h3>
          <button
            onClick={() => setNewChatOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 px-6 pt-4">
          <button
            onClick={() => { setMode('private'); setSelectedUsers([]); }}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer',
              mode === 'private'
                ? 'bg-[#18181C] text-white border border-white/10 shadow-xs'
                : 'text-zinc-400 hover:text-white'
            )}
            aria-label="Switch to private chat mode"
          >
            Private
          </button>
          <button
            onClick={() => setMode('group')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer',
              mode === 'group'
                ? 'bg-[#18181C] text-white border border-white/10 shadow-xs'
                : 'text-zinc-400 hover:text-white'
            )}
            aria-label="Switch to group chat mode"
          >
            Group
          </button>
        </div>

        <div className="p-6 pt-4">
          {/* Group name input (group mode) */}
          {mode === 'group' && (
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full px-4 py-2.5 mb-3 bg-[#111114] border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/25 focus:border-[#5D5FEF]/60 font-semibold"
              aria-label="Group name input"
            />
          )}

          {/* Selected users chips (group mode) */}
          {mode === 'group' && selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedUsers.map((user) => (
                <span
                  key={user._id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18181C] border border-white/10 text-white rounded-full text-xs font-semibold"
                >
                  {user.displayName || user.username}
                  <button
                    onClick={() => setSelectedUsers((prev) => prev.filter((u) => u._id !== user._id))}
                    className="hover:text-rose-400"
                    aria-label={`Remove ${user.displayName || user.username}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={mode === 'private' ? 'Search by username...' : 'Add participants...'}
              className="w-full pl-10 pr-4 py-2.5 bg-[#111114] border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/25 focus:border-[#5D5FEF]/60"
              aria-label="Search users input"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-60 overflow-y-auto px-6 pb-6 space-y-1">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#5D5FEF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length === 0 && query.trim() ? (
            <div className="text-center py-6 text-zinc-400 text-sm">
              No users found
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-6 text-zinc-400 text-sm">
              {mode === 'private'
                ? 'Search for users to connect and chat'
                : selectedUsers.length > 0
                  ? 'Search for more participants'
                  : 'Search for users to add to the group'}
            </div>
          ) : (
            results.map((u) => (
              <div
                key={u._id}
                onClick={() => handleSelectUser(u)}
                className="flex items-center justify-between p-3 hover:bg-[#18181C] rounded-2xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {(u.displayName || u.username).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">
                      {u.displayName || u.username}
                    </h4>
                    <p className="text-xs text-zinc-400 truncate">@{u.username}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {mode === 'group' ? (
                    <div className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                      selectedUsers.some((s) => s._id === u._id)
                        ? 'bg-[#5D5FEF] border-[#5D5FEF]'
                        : 'border-zinc-600'
                    )}>
                      {selectedUsers.some((s) => s._id === u._id) && (
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-[#5D5FEF] flex items-center gap-1">
                      Chat <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Group button */}
        {mode === 'group' && selectedUsers.length > 0 && (
          <div className="px-6 pb-6 pt-2 border-t border-white/10">
            <button
              onClick={handleCreateGroup}
              disabled={isCreating || !groupName.trim()}
              className="w-full py-3 bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] hover:scale-[1.02] active:scale-[0.98] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-[#5D5FEF]/20 cursor-pointer"
              aria-label="Create group"
            >
              {isCreating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Users className="w-5 h-5" />
              )}
              <span>
                {isCreating ? 'Creating...' : `Create Group${selectedUsers.length > 0 ? ` (${selectedUsers.length + 1} members)` : ''}`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

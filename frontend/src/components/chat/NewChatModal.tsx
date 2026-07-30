import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Search, UserPlus, Users, Check, ChevronRight } from 'lucide-react';
import { useUIStore } from '../../store/ui.store';
import { usersApi } from '../../api/users.api';
import { chatsApi } from '../../api/chats.api';
import { useChatStore } from '../../store/chat.store';
import type { User } from '../../types/user';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export function NewChatModal() {
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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={() => setNewChatOpen(false)}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-violet-600" />
            {mode === 'private' ? 'New Chat' : 'Create Group'}
          </h3>
          <button
            onClick={() => setNewChatOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
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
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors',
              mode === 'private'
                ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
            aria-label="Switch to private chat mode"
          >
            Private
          </button>
          <button
            onClick={() => setMode('group')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors',
              mode === 'group'
                ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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
              className="w-full px-4 py-2.5 mb-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-semibold"
              aria-label="Group name input"
            />
          )}

          {/* Selected users chips (group mode) */}
          {mode === 'group' && selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedUsers.map((user) => (
                <span
                  key={user._id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full text-xs font-semibold"
                >
                  {user.displayName || user.username}
                  <button
                    onClick={() => setSelectedUsers((prev) => prev.filter((u) => u._id !== user._id))}
                    className="hover:text-violet-900 dark:hover:text-violet-100"
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
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={mode === 'private' ? 'Search by username or email...' : 'Add participants...'}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              aria-label="Search users input"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-60 overflow-y-auto px-6 pb-6 space-y-1">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length === 0 && query.trim() ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              No users found
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
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
                className="flex items-center justify-between p-3 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-2xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {(u.displayName || u.username).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {u.displayName || u.username}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">@{u.username}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {mode === 'group' ? (
                    <div className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                      selectedUsers.some((s) => s._id === u._id)
                        ? 'bg-violet-600 border-violet-600'
                        : 'border-slate-300 dark:border-slate-600'
                    )}>
                      {selectedUsers.some((s) => s._id === u._id) && (
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1">
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
          <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleCreateGroup}
              disabled={isCreating || !groupName.trim()}
              className="w-full py-3 gradient-btn hover:scale-[1.02] active:scale-[0.98] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
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

import { useState } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import { useUIStore } from '../../store/ui.store';
import { usersApi } from '../../api/users.api';
import { chatsApi } from '../../api/chats.api';
import { useChatStore } from '../../store/chat.store';
import type { User } from '../../types/user';
import { toast } from 'sonner';

export function NewChatModal() {
  const { isNewChatOpen, setNewChatOpen } = useUIStore();
  const { setActiveConversation } = useChatStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!isNewChatOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const users = await usersApi.search(query);
      setResults(users);
    } catch {
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = async (user: User) => {
    try {
      const conv = await chatsApi.create({
        type: 'private',
        participantUserIds: [user._id],
      });
      setActiveConversation(conv._id);
      setNewChatOpen(false);
      toast.success(`Chat started with ${user.displayName}`);
    } catch {
      toast.error('Failed to create chat');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" /> Start a New Chat
          </h3>
          <button
            onClick={() => setNewChatOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-colors"
          >
            Search
          </button>
        </form>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {results.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Search for users to connect and chat
            </div>
          ) : (
            results.map((u) => (
              <div
                key={u._id}
                onClick={() => handleStartChat(u)}
                className="flex items-center justify-between p-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-2xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center">
                    {u.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {u.displayName}
                    </h4>
                    <p className="text-xs text-slate-400">@{u.username}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  Chat
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

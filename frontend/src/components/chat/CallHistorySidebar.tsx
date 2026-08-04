import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Loader2,
  PhoneOff,
} from 'lucide-react';
import { callsApi } from '../../api/calls.api';
import { useAuthStore } from '../../store/auth.store';
import { useWebRTC } from '../../hooks/useWebRTC';
import { formatConversationDate } from '../../lib/format';
import { SearchBar } from './SearchBar';
import { cn } from '../../lib/utils';
import type { CallHistoryItem } from '../../types/call';

function formatCallDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

type FilterTab = 'all' | 'missed' | 'audio' | 'video';

export function CallHistorySidebar() {
  const currentUserId = useAuthStore(
    (s) => s.user?._id || (s.user as any)?.id
  )?.toString();
  const { initiateCall } = useWebRTC();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['call-history'],
    queryFn: () => callsApi.getHistory(1, 50),
    staleTime: 10 * 1000,
    refetchOnMount: true,
  });

  const rawCalls: CallHistoryItem[] = data?.items || [];

  const filteredCalls = rawCalls.filter((call) => {
    const callerIdStr = typeof call.callerId === 'string' ? call.callerId : call.callerId?._id || (call.callerId as any)?.id;
    const isCaller = callerIdStr?.toString() === currentUserId;
    const peer = isCaller ? call.receiverId : call.callerId;
    const peerName = `${peer?.displayName || ''} ${peer?.username || ''}`.toLowerCase();
    const matchesSearch = peerName.includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterTab === 'missed') return call.status === 'missed' || call.status === 'rejected';
    if (filterTab === 'audio') return call.callType === 'audio';
    if (filterTab === 'video') return call.callType === 'video';
    return true;
  });

  return (
    <div className="w-full md:w-80 border-r border-white/10 bg-[#09090B] flex flex-col h-screen select-none">
      {/* Header */}
      <div className="p-4 pb-2 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-[#5D5FEF]/20">
              <Phone className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Call Log</h2>
          </div>
          <span className="text-xs text-zinc-500 font-semibold px-2 py-0.5 bg-white/5 rounded-full">
            {rawCalls.length} calls
          </span>
        </div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mt-3 bg-[#111114] p-1 rounded-xl border border-white/5">
          {(['all', 'missed', 'audio', 'video'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize cursor-pointer text-center',
                filterTab === tab
                  ? 'bg-[#18181C] text-white border border-white/10 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Call History List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#5D5FEF]" />
            <span className="text-xs">Loading call history...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-48 p-6 text-center">
            <p className="text-xs text-rose-400 mb-2">Failed to load call logs</p>
            <button
              onClick={() => refetch()}
              className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-6 text-center text-zinc-400">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <Phone className="w-6 h-6 text-zinc-500" />
            </div>
            <h4 className="font-semibold text-white text-sm">No Call History</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
              {searchQuery
                ? 'No calls match your search.'
                : filterTab !== 'all'
                ? `No ${filterTab} calls recorded yet.`
                : 'Your recent voice and video call logs will show up here.'}
            </p>
          </div>
        ) : (
          filteredCalls.map((call) => {
            const callerIdStr = typeof call.callerId === 'string' ? call.callerId : call.callerId?._id || (call.callerId as any)?.id;
            const isCaller = callerIdStr?.toString() === currentUserId;
            const peer = isCaller ? call.receiverId : call.callerId;
            const peerId = (peer?._id || (peer as any)?.id)?.toString();
            const isMissed = call.status === 'missed';
            const isRejected = call.status === 'rejected';

            return (
              <div
                key={call._id}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group"
              >
                {/* User Avatar & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                      {peer?.avatarUrl ? (
                        <img
                          src={peer.avatarUrl}
                          alt={peer.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {(peer?.displayName || peer?.username || 'US')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {peer?.displayName || peer?.username || 'Unknown User'}
                      </h4>
                      <span className="text-[10px] text-zinc-500 flex-shrink-0 ml-1">
                        {formatConversationDate(call.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs mt-0.5">
                      {isMissed ? (
                        <PhoneMissed className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                      ) : isRejected ? (
                        <PhoneOff className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      ) : isCaller ? (
                        <PhoneOutgoing className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <PhoneIncoming className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      )}

                      <span
                        className={cn(
                          'text-xs truncate',
                          isMissed
                            ? 'text-rose-400 font-medium'
                            : isRejected
                            ? 'text-amber-400'
                            : 'text-zinc-400'
                        )}
                      >
                        {call.callType === 'video' ? 'Video' : 'Audio'} Call
                        {call.duration > 0 && (
                          <span className="text-zinc-500 font-normal">
                            {' '}
                            • {formatCallDuration(call.duration)}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Redial Buttons */}
                {peer && peerId && (
                  <div className="flex items-center gap-1 ml-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() =>
                        initiateCall(
                          {
                            id: peerId,
                            username: peer.username,
                            displayName: peer.displayName,
                            avatarUrl: peer.avatarUrl,
                          },
                          call.callType
                        )
                      }
                      className="p-2 rounded-xl bg-white/5 hover:bg-emerald-600/20 hover:text-emerald-400 text-zinc-400 transition-all cursor-pointer"
                      title={`Redial ${call.callType} call`}
                    >
                      {call.callType === 'video' ? (
                        <Video className="w-4 h-4" />
                      ) : (
                        <Phone className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

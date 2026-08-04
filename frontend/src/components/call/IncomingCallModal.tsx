import React from 'react';
import { Phone, PhoneOff, Video, PhoneIncoming, MessageSquare } from 'lucide-react';
import { useCallStore } from '../../store/call.store';
import { useWebRTC } from '../../hooks/useWebRTC';

export const IncomingCallModal: React.FC = () => {
  const { callStatus, peer, callType } = useCallStore();
  const { acceptCall, rejectCall } = useWebRTC();

  if (callStatus !== 'incoming' || !peer) return null;

  const isVideoCall = callType === 'video';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#09090B] border border-white/10 shadow-2xl p-6 text-white text-center flex flex-col items-center gap-6 overflow-hidden">
        {/* Ambient Radial Background Glows matching the chat dashboard */}
        <div className="absolute w-72 h-72 bg-violet-600/12 rounded-full blur-3xl -top-24 -left-24 pointer-events-none animate-pulse-slow" />
        <div className="absolute w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl -bottom-24 -right-24 pointer-events-none animate-pulse-slow" />

        {/* Brand + Status Header */}
        <div className="relative flex items-center justify-center gap-2 mt-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-[#5D5FEF]/30">
            <MessageSquare className="w-4 h-4 fill-current" />
          </div>
          <span className="text-sm font-extrabold tracking-tight gradient-text">ChitChat</span>
        </div>

        {/* Pulsing Avatar Container */}
        <div className="relative mt-1">
          <div className="absolute -inset-3 rounded-full bg-[#5D5FEF]/20 animate-ping opacity-75 pointer-events-none" />
          <div className="relative p-1 rounded-full bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] shadow-2xl shadow-[#5D5FEF]/30">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#09090B] bg-[#111114] flex items-center justify-center">
              {peer.avatarUrl ? (
                <img src={peer.avatarUrl} alt={peer.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-zinc-300 uppercase">
                  {peer.username?.slice(0, 2) || 'US'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="relative space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">{peer.displayName || peer.username}</h3>
          <div className="flex items-center justify-center gap-2 text-sm text-emerald-400 font-semibold">
            {isVideoCall ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            <span>Incoming {isVideoCall ? 'Video' : 'Audio'} Call...</span>
          </div>
        </div>

        {/* Call Action Buttons */}
        <div className="relative flex items-center justify-center gap-10 w-full pt-1">
          {/* Decline Button */}
          <button
            onClick={() => rejectCall()}
            className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
            title="Decline Call"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 flex items-center justify-center text-white shadow-lg shadow-rose-600/40 transition-all group-hover:scale-105">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-xs text-zinc-400 font-medium group-hover:text-zinc-200">Decline</span>
          </button>

          {/* Accept Button */}
          <button
            onClick={acceptCall}
            className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
            title="Accept Call"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-600/40 transition-all group-hover:scale-105 animate-pulse">
              <PhoneIncoming className="w-6 h-6" />
            </div>
            <span className="text-xs text-zinc-400 font-medium group-hover:text-zinc-200">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

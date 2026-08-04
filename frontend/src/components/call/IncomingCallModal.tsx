import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCallStore } from '../../store/call.store';
import { useWebRTC } from '../../hooks/useWebRTC';

export const IncomingCallModal: React.FC = () => {
  const { callStatus, peer, callType } = useCallStore();
  const { acceptCall, rejectCall } = useWebRTC();

  if (callStatus !== 'incoming' || !peer) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900/90 border border-slate-700/60 p-6 shadow-2xl text-white text-center flex flex-col items-center gap-6">
        
        {/* Pulsing Avatar Container */}
        <div className="relative mt-2">
          <div className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500 shadow-xl bg-slate-800 flex items-center justify-center">
            {peer.avatarUrl ? (
              <img src={peer.avatarUrl} alt={peer.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-slate-300 uppercase">
                {peer.username?.slice(0, 2) || 'US'}
              </span>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">{peer.displayName || peer.username}</h3>
          <div className="flex items-center justify-center gap-2 text-sm text-emerald-400 font-medium">
            {callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            <span>Incoming {callType === 'video' ? 'Video' : 'Audio'} Call...</span>
          </div>
        </div>

        {/* Call Action Buttons */}
        <div className="flex items-center justify-center gap-8 w-full pt-2">
          {/* Decline Button */}
          <button
            onClick={() => rejectCall()}
            className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
            title="Decline Call"
          >
            <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/40 transition-colors">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-400 font-medium group-hover:text-slate-200">Decline</span>
          </button>

          {/* Accept Button */}
          <button
            onClick={acceptCall}
            className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
            title="Accept Call"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/40 transition-colors animate-bounce">
              <Phone className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-400 font-medium group-hover:text-slate-200">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

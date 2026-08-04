import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, AlertCircle } from 'lucide-react';
import { useCallStore } from '../../store/call.store';
import { useWebRTC } from '../../hooks/useWebRTC';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const ActiveCallModal: React.FC = () => {
  const {
    callStatus,
    callType,
    peer,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    remoteIsVideoOff,
    callDuration,
    errorMessage,
  } = useCallStore();

  const { endCall, toggleMute, toggleVideo } = useWebRTC();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callStatus !== 'outgoing' && callStatus !== 'connected') return null;
  if (!peer) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-lg p-2 md:p-6 animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between">
        
        {/* Error / Alert Banner */}
        {errorMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-rose-500/90 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-bounce">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Top Bar (Peer info + Status + Duration) */}
        <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-4 py-2 rounded-full pointer-events-auto shadow-md">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-200">
              {peer.avatarUrl ? (
                <img src={peer.avatarUrl} alt={peer.username} className="w-full h-full object-cover" />
              ) : (
                <span>{peer.username?.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white leading-none">{peer.displayName || peer.username}</h4>
              <p className="text-[11px] text-emerald-400 font-medium leading-tight mt-0.5">
                {callStatus === 'outgoing' ? 'Ringing...' : formatDuration(callDuration)}
              </p>
            </div>
          </div>
        </div>

        {/* Main Display Container */}
        <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
          {callType === 'video' && callStatus === 'connected' ? (
            <>
              {/* Remote Video Stream */}
              <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                {remoteIsVideoOff ? (
                  <div className="flex flex-col items-center gap-4 text-slate-400">
                    <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-200 shadow-inner">
                      {peer.username?.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium">Camera turned off by {peer.displayName || peer.username}</p>
                  </div>
                ) : (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Local Video Inset (PIP) */}
              <div className="absolute bottom-20 right-4 z-30 w-36 h-48 md:w-48 md:h-64 rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-slate-900 flex items-center justify-center">
                {isVideoOff ? (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <VideoOff className="w-6 h-6" />
                    <span className="text-[10px]">Camera Off</span>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                )}
              </div>
            </>
          ) : (
            /* Audio Call Display or Outgoing Ringing View */
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="relative">
                {callStatus === 'outgoing' && (
                  <div className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
                )}
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-700 bg-slate-800 shadow-2xl overflow-hidden flex items-center justify-center text-4xl font-bold text-slate-200">
                  {peer.avatarUrl ? (
                    <img src={peer.avatarUrl} alt={peer.username} className="w-full h-full object-cover" />
                  ) : (
                    <span>{peer.username?.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-2xl font-bold text-white">{peer.displayName || peer.username}</h3>
                <p className="text-sm font-medium text-emerald-400">
                  {callStatus === 'outgoing' ? 'Calling...' : `${callType === 'video' ? 'Video' : 'Audio'} Call Active`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="relative z-40 w-full py-6 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-center gap-6">
          {/* Toggle Mute */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isVideoOff ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition-transform active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

      </div>
    </div>
  );
};

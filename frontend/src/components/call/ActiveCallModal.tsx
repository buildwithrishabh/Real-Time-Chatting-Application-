import React, { useCallback, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { useCallStore } from '../../store/call.store';
import { useWebRTC } from '../../hooks/useWebRTC';
import { cn } from '../../lib/utils';

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
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Callback refs attach the stream the moment the element mounts, so the
  // media is bound regardless of when srcObject vs. the element appears.
  const attachLocalVideo = useCallback(
    (el: HTMLVideoElement | null) => {
      localVideoRef.current = el;
      if (el && localStream) {
        el.srcObject = localStream;
        el.play().catch(() => {});
      }
    },
    [localStream]
  );

  const attachRemoteVideo = useCallback(
    (el: HTMLVideoElement | null) => {
      remoteVideoRef.current = el;
      if (el && remoteStream) {
        el.srcObject = remoteStream;
        el.play().catch(() => {});
      }
    },
    [remoteStream]
  );

  const attachRemoteAudio = useCallback(
    (el: HTMLAudioElement | null) => {
      remoteAudioRef.current = el;
      if (el && remoteStream) {
        el.srcObject = remoteStream;
        el.play().catch(() => {});
      }
    },
    [remoteStream]
  );

  if (callStatus !== 'outgoing' && callStatus !== 'connected') return null;
  if (!peer) return null;

  const isRinging = callStatus === 'outgoing';
  const isVideoCall = callType === 'video';
  const isVideoConnected = isVideoCall && callStatus === 'connected';
  const statusText = isRinging
    ? 'Ringing...'
    : `${isVideoCall ? 'Video' : 'Audio'} call active`;

  const ControlButton = ({
    label,
    title,
    disabled = false,
    active,
    activeClass,
    onClick,
    children,
  }: {
    label: string;
    title: string;
    disabled?: boolean;
    active: boolean;
    activeClass: string;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex flex-col items-center gap-2 group transition-transform active:scale-95 disabled:cursor-not-allowed"
    >
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center transition-all',
          disabled
            ? 'bg-[#111114] text-zinc-600 border border-white/5'
            : active
              ? activeClass
              : 'bg-[#18181C] border border-white/10 text-zinc-300 group-hover:bg-white/10 group-hover:text-white shadow-sm'
        )}
      >
        {children}
      </div>
      <span
        className={cn(
          'text-[11px] font-semibold',
          disabled ? 'text-zinc-600' : active ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
        )}
      >
        {label}
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl p-2 md:p-6 animate-fade-in">
      <div className="relative w-full max-w-4xl h-[88vh] md:h-[85vh] rounded-3xl bg-[#09090B] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Ambient Radial Background Glows matching the chat dashboard */}
        <div className="absolute w-[420px] h-[420px] bg-violet-600/12 rounded-full blur-3xl -top-24 -left-24 pointer-events-none animate-pulse-slow" />
        <div className="absolute w-[380px] h-[380px] bg-cyan-500/10 rounded-full blur-3xl -bottom-24 -right-24 pointer-events-none animate-pulse-slow" />

        {/* Error / Alert Banner */}
        {errorMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-rose-600/95 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-fade-in">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="relative z-10 h-16 px-4 sm:px-6 border-b border-white/10 bg-[#09090B]/90 backdrop-blur-xl flex items-center justify-between flex-shrink-0 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#111114] border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-300 shadow-md">
                {peer.avatarUrl ? (
                  <img src={peer.avatarUrl} alt={peer.username} className="w-full h-full object-cover" />
                ) : (
                  <span>{peer.username?.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <span
                className={cn(
                  'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#09090B]',
                  isRinging ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 shadow-sm shadow-emerald-500/60'
                )}
              />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight truncate">
                {peer.displayName || peer.username}
              </h4>
              <p
                className={cn(
                  'text-[11px] sm:text-xs font-semibold leading-tight mt-0.5 truncate',
                  isRinging ? 'text-amber-400' : 'text-emerald-400'
                )}
              >
                {isRinging ? statusText : formatDuration(callDuration)}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5D5FEF]" />
            <span>End-to-end encrypted</span>
          </div>
        </div>

        {/* Main Display Container */}
        <div className="relative flex-1 min-h-0 flex items-center justify-center bg-[#050505] chat-workspace-bg overflow-hidden">
          {isVideoConnected ? (
            <>
              {/* Remote Video Stream — kept mounted so audio keeps playing
                  even when the peer's camera is turned off. */}
              <div className="absolute inset-0 flex items-center justify-center">
                <video
                  ref={attachRemoteVideo}
                  autoPlay
                  playsInline
                  className={cn(
                    'w-full h-full object-cover transition-opacity',
                    remoteIsVideoOff && 'opacity-0'
                  )}
                />
                {remoteIsVideoOff && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-zinc-500 pointer-events-none">
                    <div className="w-24 h-24 rounded-full bg-[#111114] border-2 border-white/10 flex items-center justify-center text-2xl font-bold text-zinc-300 shadow-inner">
                      {peer.username?.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium">Camera turned off by {peer.displayName || peer.username}</p>
                  </div>
                )}
              </div>

              {/* Local Video Inset (PIP) */}
              <div className="absolute bottom-4 right-4 z-30 w-32 h-44 md:w-44 md:h-60 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#111114] flex items-center justify-center">
                {isVideoOff ? (
                  <div className="flex flex-col items-center gap-2 text-zinc-500">
                    <VideoOff className="w-6 h-6" />
                    <span className="text-[10px] font-semibold">Camera Off</span>
                  </div>
                ) : (
                  <video
                    ref={attachLocalVideo}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                )}
              </div>
            </>
          ) : (
            <>
              {/* Remote audio element: audio calls have no video surface, so we
                  need a dedicated element for the incoming audio to play. */}
              <audio ref={attachRemoteAudio} autoPlay playsInline className="hidden" />

              {/* Audio Call Display or Outgoing Ringing View */}
              <div className="relative flex flex-col items-center justify-center gap-6 px-4">
                {isRinging && (
                  <div className="absolute -inset-4 rounded-full bg-[#5D5FEF]/15 animate-ping opacity-75 pointer-events-none" />
                )}
                <div className="relative">
                  <div className="p-1 rounded-full bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] shadow-2xl shadow-[#5D5FEF]/30">
                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-2 border-[#09090B] bg-[#111114] overflow-hidden flex items-center justify-center text-4xl font-bold text-zinc-200">
                      {peer.avatarUrl ? (
                        <img src={peer.avatarUrl} alt={peer.username} className="w-full h-full object-cover" />
                      ) : (
                        <span>{peer.username?.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    {peer.displayName || peer.username}
                  </h3>
                  <p
                    className={cn(
                      'text-sm font-semibold flex items-center justify-center gap-1.5',
                      isRinging ? 'text-amber-400' : 'text-emerald-400'
                    )}
                  >
                    {statusText}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="relative z-10 border-t border-white/10 bg-[#09090B]/90 backdrop-blur-xl py-4 sm:py-5 px-4 flex items-center justify-center gap-8 sm:gap-10 flex-shrink-0 select-none">
          <ControlButton
            label={isMuted ? 'Unmute' : 'Mute'}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            active={isMuted}
            activeClass="bg-rose-600 text-white shadow-lg shadow-rose-600/30"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </ControlButton>

          <ControlButton
            label={isVideoOff ? 'Camera On' : 'Camera Off'}
            title={
              isVideoCall
                ? isVideoOff
                  ? 'Turn Camera On'
                  : 'Turn Camera Off'
                : 'Video not available on an audio call'
            }
            active={isVideoOff}
            disabled={!isVideoCall}
            activeClass="bg-rose-600 text-white shadow-lg shadow-rose-600/30"
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </ControlButton>

          {/* End Call Button */}
          <button
            onClick={endCall}
            title="End Call"
            className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition-all group-hover:scale-105">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-rose-400 group-hover:text-rose-300">End</span>
          </button>
        </div>
      </div>
    </div>
  );
};

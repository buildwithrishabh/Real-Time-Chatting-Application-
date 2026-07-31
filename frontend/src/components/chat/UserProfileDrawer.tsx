import { useState, useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  BellOff,
  ShieldAlert,
  Mail,
  ExternalLink,
  Download,
} from 'lucide-react';
import type { Conversation } from '../../types/chat';
import type { Message } from '../../types/message';
import { useUIStore } from '../../store/ui.store';
import { usePresenceStore } from '../../store/presence.store';
import { useAuthStore } from '../../store/auth.store';
import { usersApi } from '../../api/users.api';
import { formatConversationDate } from '../../lib/format';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface UserProfileDrawerProps {
  activeConversation: Conversation | null;
  messages: Message[];
}

type TabType = 'media' | 'docs' | 'links';

export function UserProfileDrawer({ activeConversation, messages }: UserProfileDrawerProps) {
  const { isUserProfileDrawerOpen, setUserProfileDrawerOpen } = useUIStore();
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  const currentUserId = useAuthStore((s) => s.user?._id || (s.user as any)?.id)?.toString();

  const [activeTab, setActiveTab] = useState<TabType>('media');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isUserProfileDrawerOpen) {
        setUserProfileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUserProfileDrawerOpen, setUserProfileDrawerOpen]);

  const otherParticipant = activeConversation?.participants?.find((p) => {
    if (!p?.userId) return false;
    const pId = (typeof p.userId === 'string' ? p.userId : (p.userId._id || (p.userId as any)?.id))?.toString();
    return pId && currentUserId ? pId !== currentUserId : true;
  }) || activeConversation?.participants?.[0];

  const otherUserObj = (otherParticipant?.userId && typeof otherParticipant.userId === 'object') ? otherParticipant.userId : null;
  const otherUserId = (typeof otherParticipant?.userId === 'string' ? otherParticipant.userId : otherUserObj?._id || (otherUserObj as any)?.id)?.toString();
  const lastSeenAt = usePresenceStore((s) => (otherUserId ? s.lastSeen[otherUserId] : undefined));

  useEffect(() => {
    if (!otherUserId) return;
    usersApi
      .listBlocked()
      .then((blockedList) => {
        const list = Array.isArray(blockedList) ? blockedList : [];
        const isUserBlocked = list.some(
          (u) => u && (u._id === otherUserId || (u as any).id === otherUserId)
        );
        setIsBlocked(isUserBlocked);
      })
      .catch(() => {});
  }, [otherUserId]);

  if (!isUserProfileDrawerOpen || !activeConversation) return null;

  const handleToggleBlock = async () => {
    if (!otherUserId) return;
    try {
      if (isBlocked) {
        await usersApi.unblockUser(otherUserId);
        setIsBlocked(false);
        toast.success('Contact unblocked successfully');
      } else {
        await usersApi.blockUser(otherUserId);
        setIsBlocked(true);
        toast.success('Contact blocked');
      }
    } catch {
      toast.error('Failed to update block status');
    }
  };

  const isGroup = activeConversation.type === 'group';
  const title = isGroup
    ? activeConversation.name || 'Group Chat'
    : otherUserObj?.displayName || otherUserObj?.username || activeConversation.name || 'User Profile';

  const avatarUrl = isGroup
    ? activeConversation.avatarUrl
    : otherUserObj?.avatarUrl || activeConversation.avatarUrl;

  const isOnline = otherUserId ? onlineUsers[otherUserId] === 'online' : false;
  const otherUserLastSeenAt = lastSeenAt || otherUserObj?.lastSeenAt;

  const getMessageFileUrl = (m: Message): string | undefined => {
    if (!m) return undefined;
    if (m.fileUrl) return m.fileUrl;
    if (m.fileId && typeof m.fileId === 'object') {
      return m.fileId.url || m.fileId.thumbnailUrl;
    }
    return undefined;
  };

  // Filter Shared Media (Images / Videos)
  const sharedMedia = (messages || [])
    .map((m) => ({ message: m, url: getMessageFileUrl(m) }))
    .filter(
      ({ message: m, url }) =>
        url &&
        (m.type === 'image' ||
          m.type === 'video' ||
          /\.(jpg|jpeg|png|webp|gif|mp4|mov)$/i.test(url))
    );

  // Filter Shared Docs & Files (PDFs, Zip, Documents, Audio)
  const sharedDocs = (messages || [])
    .map((m) => ({ message: m, url: getMessageFileUrl(m) }))
    .filter(
      ({ message: m, url }) =>
        url &&
        !(
          m.type === 'image' ||
          m.type === 'video' ||
          /\.(jpg|jpeg|png|webp|gif|mp4|mov)$/i.test(url)
        )
    );

  // Filter Shared Web Links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const sharedLinks: { url: string; date: string; senderName?: string }[] = [];
  (messages || []).forEach((m) => {
    if (m?.content) {
      const matches = m.content.match(urlRegex);
      if (matches) {
        matches.forEach((url) => {
          const senderName =
            m.senderId && typeof m.senderId === 'object'
              ? (m.senderId as any)?.displayName || (m.senderId as any)?.username || 'Sender'
              : 'Sender';
          sharedLinks.push({
            url,
            date: m.createdAt,
            senderName,
          });
        });
      }
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop Overlay */}
      <div
        onClick={() => setUserProfileDrawerOpen(false)}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Drawer Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:w-96 bg-white dark:bg-[#0F172A] h-full flex flex-col z-50 shadow-2xl animate-scale-in border-l border-slate-200 dark:border-slate-800 select-none overflow-hidden"
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {isGroup ? 'Group Information' : 'Contact Profile'}
          </h3>
          <button
            onClick={() => setUserProfileDrawerOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close profile drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Profile Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* User Profile Header Summary Card */}
          <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="relative mb-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={title}
                  onClick={() => setLightboxUrl(avatarUrl)}
                  className="w-24 h-24 rounded-full object-cover border-4 border-violet-500/30 shadow-lg cursor-pointer hover:opacity-95 transition-opacity"
                />
              ) : (
                <div className="w-24 h-24 rounded-full gradient-btn text-white font-extrabold flex items-center justify-center text-3xl shadow-lg">
                  {title.slice(0, 2).toUpperCase()}
                </div>
              )}
              {!isGroup && (
                <span
                  className={cn(
                    'absolute bottom-1 right-1 w-4 h-4 border-2 border-white dark:border-[#0F172A] rounded-full transition-colors duration-300',
                    isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                  )}
                />
              )}
            </div>

            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white truncate max-w-full">
              {title}
            </h4>
            {!isGroup && otherUserObj?.username && (
              <p className="text-xs text-slate-400 font-semibold mt-0.5">@{otherUserObj.username}</p>
            )}
            <p className="text-xs font-bold text-violet-500 mt-1">
              {isGroup
                ? `${activeConversation.participants?.length || 0} Members`
                : isOnline
                  ? 'Active Now'
                  : otherUserLastSeenAt
                    ? `Last seen ${formatConversationDate(otherUserLastSeenAt)}`
                    : 'Offline'}
            </p>
          </div>

          {/* User Bio & Details (Private Chats) */}
          {!isGroup && (
            <div className="space-y-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
              {otherUserObj?.bio && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">About / Bio</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    {otherUserObj.bio}
                  </p>
                </div>
              )}

              {otherUserObj?.email && (
                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium pt-1">
                  <Mail className="w-4 h-4 text-violet-500 flex-shrink-0" />
                  <span className="truncate">{otherUserObj.email}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 gap-2 pb-5 border-b border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                toast.success(isMuted ? 'Notifications unmuted' : 'Notifications muted for this chat');
              }}
              className={cn(
                'flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all',
                isMuted
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-600'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <BellOff className="w-4 h-4" />
              <span>{isMuted ? 'Muted' : 'Mute Notifications'}</span>
            </button>

            <button
              onClick={handleToggleBlock}
              className={cn(
                'flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all',
                isBlocked
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60'
              )}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isBlocked ? 'Unblock Contact' : 'Block Contact'}</span>
            </button>
          </div>

          {/* Shared Media, Docs & Links Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Shared Content
              </h5>
            </div>

            {/* Content Filter Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('media')}
                className={cn(
                  'flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5',
                  activeTab === 'media'
                    ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Media ({sharedMedia.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('docs')}
                className={cn(
                  'flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5',
                  activeTab === 'docs'
                    ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Docs ({sharedDocs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('links')}
                className={cn(
                  'flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5',
                  activeTab === 'links'
                    ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Links ({sharedLinks.length})</span>
              </button>
            </div>

            {/* TAB 1: MEDIA GRID */}
            {activeTab === 'media' && (
              <div className="pt-2">
                {sharedMedia.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 font-medium">
                    No photos or videos shared in this chat
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {sharedMedia.map(({ message: m, url }) => (
                      <button
                        key={m._id}
                        onClick={() => url && setLightboxUrl(url)}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60"
                      >
                        <img
                          src={url}
                          alt="Shared media"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DOCS & FILES */}
            {activeTab === 'docs' && (
              <div className="pt-2 space-y-2">
                {sharedDocs.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 font-medium">
                    No documents or files shared in this chat
                  </div>
                ) : (
                  sharedDocs.map(({ message: m, url }) => (
                    <a
                      key={m._id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {m.type === 'video' ? 'Video File' : m.type === 'audio' ? 'Audio Recording' : 'Document File'}
                        </p>
                        <span className="text-[10px] text-slate-400">{formatConversationDate(m.createdAt)}</span>
                      </div>
                      <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </a>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: LINKS */}
            {activeTab === 'links' && (
              <div className="pt-2 space-y-2">
                {sharedLinks.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 font-medium">
                    No web links shared in this chat
                  </div>
                ) : (
                  sharedLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 flex items-center justify-center text-cyan-600 flex-shrink-0">
                        <LinkIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {link.url}
                        </p>
                        <span className="text-[10px] text-slate-400">{formatConversationDate(link.date)}</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </a>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Enlarged media"
            className="max-w-full max-h-full object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

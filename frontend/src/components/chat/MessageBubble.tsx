import React, { useState, useRef, useEffect } from 'react';
import { Check, CheckCheck, Smile, MoreHorizontal, Pencil, Trash2, FileText, ExternalLink, X, UserX } from 'lucide-react';
import type { Message } from '../../types/message';
import { formatMessageTime } from '../../lib/format';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  onUnreact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string, mode: 'me' | 'everyone') => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function MessageBubble({ message, isOwn, onReact, onUnreact, onEdit, onDelete }: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || '');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const reactionsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const currentUserId = useAuthStore((s) => s.user?._id || (s.user as any)?.id)?.toString();
  const fileUrl =
    message.fileUrl ||
    (message.fileId && typeof message.fileId === 'object' ? message.fileId.url || message.fileId.thumbnailUrl : undefined);

  const reactionsList = Object.entries(message.reactions || {}).filter(([_, users]) => Array.isArray(users) && users.length > 0);
  const userReactedEmojis = reactionsList
    .filter(([_, users]) => currentUserId && Array.isArray(users) && users.includes(currentUserId))
    .map(([emoji]) => emoji);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (reactionsRef.current && !reactionsRef.current.contains(e.target as Node)) {
        setShowReactions(false);
      }
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [isEditing, editText.length]);

  const handleReactToggle = (emoji: string) => {
    const isReacted = userReactedEmojis.includes(emoji);
    if (isReacted) {
      onUnreact?.(message._id, emoji);
    } else {
      onReact?.(message._id, emoji);
    }
    setShowReactions(false);
  };

  const handleEdit = () => {
    setShowActions(false);
    setIsEditing(true);
    setEditText(message.content || '');
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.content) {
      onEdit?.(message._id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleDeleteForMe = () => {
    setShowActions(false);
    onDelete?.(message._id, 'me');
  };

  const handleDeleteForEveryone = () => {
    setShowActions(false);
    onDelete?.(message._id, 'everyone');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const createdAt = message.createdAt || (message as any).created_at;

  return (
    <>
      <div
        className={cn(
          'group relative flex items-end gap-2 mb-3 max-w-[88%] sm:max-w-[75%]',
          isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
        )}
      >
        <div className="flex flex-col">
          <div
            className={cn(
              'relative px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-xs transition-all duration-200',
              isOwn
                ? 'sent-bubble rounded-br-xs'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs'
            )}
          >
            {fileUrl && (
              <div className="mb-2 overflow-hidden rounded-xl">
                {message.type === 'image' ? (
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="block w-full"
                    aria-label="View attachment"
                  >
                    <img
                      src={fileUrl}
                      alt="Attachment"
                      className="max-h-60 w-full object-cover rounded-xl hover:opacity-95 transition-opacity cursor-pointer"
                      loading="lazy"
                    />
                  </button>
                ) : (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-xl hover:opacity-90 transition-opacity"
                    aria-label="Open file attachment"
                  >
                    <FileText className="w-6 h-6 text-violet-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold truncate block">
                        {message.type === 'video' ? 'Video' : message.type === 'audio' ? 'Audio' : message.type === 'pdf' ? 'PDF' : 'File'}
                      </span>
                      <span className="text-[10px] text-slate-400">Click to open</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </a>
                )}
              </div>
            )}

            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={editInputRef}
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={handleSaveEdit}
                  className={cn(
                    'flex-1 bg-transparent border-b-2 outline-none text-sm font-medium',
                    isOwn
                      ? 'border-white/80 text-white placeholder:text-white/60'
                      : 'border-violet-500 text-slate-900 dark:text-white'
                  )}
                  aria-label="Edit message input"
                />
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                  aria-label="Cancel editing"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : message.isDeletedForEveryone ? (
              <p className="italic text-xs text-slate-400 font-medium">
                This message was deleted
              </p>
            ) : message.content ? (
              <p className="whitespace-pre-wrap break-words font-medium select-text">
                {message.content}
                {message.isEdited && (
                  <span className={cn(
                    'text-[10px] ml-1 opacity-80',
                    isOwn ? 'text-white/80' : 'text-slate-400'
                  )}>
                    (edited)
                  </span>
                )}
              </p>
            ) : null}

            <div
              className={cn(
                'flex items-center gap-1 mt-1 text-[11px] font-semibold select-none',
                isOwn ? 'text-white/90 justify-end' : 'text-slate-400 justify-end'
              )}
            >
              <span>{formatMessageTime(createdAt)}</span>
              {isOwn && !message.isDeletedForEveryone && (
                <span>
                  {message.status === 'read' || (message.readBy && message.readBy.length > 0) ? (
                    <CheckCheck className="w-3.5 h-3.5 text-cyan-300 dark:text-cyan-400 stroke-[2.5]" title="Read / Seen" />
                  ) : message.status === 'delivered' ? (
                    <CheckCheck className="w-3.5 h-3.5 text-white/75 stroke-[2.5]" title="Delivered" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-white/75 stroke-[2.5]" title="Sent" />
                  )}
                </span>
              )}
            </div>
          </div>

          {reactionsList.length > 0 && !message.isDeletedForEveryone && (
            <div
              className={cn(
                'flex items-center gap-1 mt-1',
                isOwn ? 'justify-end' : 'justify-start'
              )}
            >
              {reactionsList.map(([emoji, users]) => {
                const isMine = currentUserId && users.includes(currentUserId);
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReactToggle(emoji)}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold shadow-xs transition-all hover:scale-110',
                      isMine
                        ? 'bg-violet-100 dark:bg-violet-900/50 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    )}
                    aria-label={`Reaction ${emoji}`}
                  >
                    <span>{emoji}</span>
                    <span className="text-[10px] text-slate-500">{users.length}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Reaction & Action controls */}
        {!message.isDeletedForEveryone && (
          <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowReactions((prev) => !prev)}
              className="p-1.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all"
              aria-label="Add reaction"
            >
              <Smile className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowActions((prev) => !prev)}
              className="p-1.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all"
              aria-label="More message options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Reaction picker popup */}
        {showReactions && (
          <div
            ref={reactionsRef}
            className={cn(
              'absolute bottom-full mb-2 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 shadow-xl z-50 animate-scale-in',
              isOwn ? 'right-0' : 'left-0'
            )}
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReactToggle(emoji)}
                className={cn(
                  'text-lg hover:scale-125 transition-transform p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700',
                  userReactedEmojis.includes(emoji) && 'scale-110 bg-violet-100 dark:bg-violet-900/50'
                )}
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Actions dropdown */}
        {showActions && (
          <div
            ref={actionsRef}
            className={cn(
              'absolute bottom-full mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 py-1.5 min-w-[150px] animate-scale-in',
              isOwn ? 'right-0' : 'left-0'
            )}
          >
            {isOwn && message.content && (
              <button
                onClick={handleEdit}
                className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-950/40 flex items-center gap-2 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-violet-500" /> Edit
              </button>
            )}
            <button
              onClick={handleDeleteForMe}
              className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
            >
              <UserX className="w-3.5 h-3.5 text-slate-400" /> Delete for Me
            </button>
            {isOwn && (
              <button
                onClick={handleDeleteForEveryone}
                className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete for Everyone
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image lightbox */}
      {lightboxOpen && fileUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
            aria-label="Close image preview"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fileUrl}
            alt="Full size preview"
            className="max-w-full max-h-full object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

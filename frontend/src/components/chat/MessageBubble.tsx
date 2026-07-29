import { CheckCheck, Smile, FileText } from 'lucide-react';
import type { Message } from '../../types/message';
import { formatMessageTime } from '../../lib/format';
import { cn } from '../../lib/utils';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderAvatarUrl?: string;
  onReact?: (messageId: string, emoji: string) => void;
}

export function MessageBubble({ message, isOwn, senderAvatarUrl, onReact }: MessageBubbleProps) {
  const reactionsList = Object.entries(message.reactions || {}).filter(([_, users]) => users.length > 0);

  return (
    <div
      className={cn(
        'group relative flex items-end gap-2.5 mb-3.5 max-w-[85%] sm:max-w-[75%]',
        isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {!isOwn && (
        <div className="flex-shrink-0">
          {senderAvatarUrl ? (
            <img
              src={senderAvatarUrl}
              alt=""
              className="w-8 h-8 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              P
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col">
        <div
          className={cn(
            'relative px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-200',
            isOwn
              ? 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-indigo-700 text-white rounded-br-xs shadow-violet-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs'
          )}
        >
          {message.fileUrl && (
            <div className="mb-2 overflow-hidden rounded-xl">
              {message.type === 'image' ? (
                <img
                  src={message.fileUrl}
                  alt="Attachment"
                  className="max-h-60 w-full object-cover rounded-xl"
                  loading="lazy"
                />
              ) : (
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-xl hover:opacity-90 transition-opacity"
                >
                  <FileText className="w-6 h-6 text-violet-500" />
                  <span className="text-xs font-semibold underline truncate">Download File</span>
                </a>
              )}
            </div>
          )}

          {message.content && (
            <p className="whitespace-pre-wrap break-words font-medium">{message.content}</p>
          )}

          <div
            className={cn(
              'flex items-center gap-1 mt-1 text-[11px] font-semibold select-none',
              isOwn ? 'text-violet-200 justify-end' : 'text-slate-400 justify-end'
            )}
          >
            <span>{formatMessageTime(message.createdAt)}</span>
            {isOwn && (
              <CheckCheck className="w-3.5 h-3.5 text-cyan-300 stroke-[2.5]" />
            )}
          </div>
        </div>

        {reactionsList.length > 0 && (
          <div
            className={cn(
              'flex items-center gap-1 mt-1',
              isOwn ? 'justify-end' : 'justify-start'
            )}
          >
            {reactionsList.map(([emoji, users]) => (
              <span
                key={emoji}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-xs"
              >
                <span>{emoji}</span>
                <span className="text-[10px] text-slate-500">{users.length}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => onReact && onReact(message._id, '👍')}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800"
      >
        <Smile className="w-4 h-4" />
      </button>
    </div>
  );
}

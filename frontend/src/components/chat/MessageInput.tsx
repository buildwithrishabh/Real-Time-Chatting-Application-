import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Mic, Send, X, Image as ImageIcon, FileText } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface MessageInputProps {
  onSendMessage: (content: string, fileId?: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  conversationId: string | null;
}

const EMOJI_LIST = ['😀', '😂', '❤️', '👍', '🔥', '🎉', '😢', '😮', '😍', '🙏', '💀', '🤣', '💯', '✨', '👋', '🚀', '💪', '🤔'];

export function MessageInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  conversationId,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const { upload, isUploading, progress } = useFileUpload();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (e.target.value.trim()) {
      onTypingStart?.();
    } else {
      onTypingStop?.();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => setFilePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !selectedFile) || isUploading) return;

    let fileId: string | undefined;

    if (selectedFile && conversationId) {
      try {
        const fileMeta = await upload(selectedFile, conversationId);
        fileId = fileMeta._id;
      } catch {
        return;
      }
    }

    onSendMessage(text.trim(), fileId);
    setText('');
    handleRemoveFile();
    onTypingStop?.();
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
    onTypingStart?.();
  };

  const getFileIcon = () => {
    if (!selectedFile) return null;
    if (selectedFile.type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-violet-500" />;
    return <FileText className="w-5 h-5 text-violet-500" />;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-2.5 sm:p-4 bg-white dark:bg-[#0B0F19] border-t border-slate-200/80 dark:border-slate-800/80"
    >
      {selectedFile && (
        <div className="mb-2 flex items-center gap-3 p-2.5 px-4 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 rounded-xl">
          {filePreview ? (
            <img
              src={filePreview}
              alt="Preview"
              className="w-10 h-10 rounded-lg object-cover border border-violet-300 dark:border-violet-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
              {getFileIcon()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-violet-700 dark:text-violet-300 truncate">
              {selectedFile.name}
            </p>
            <p className="text-[10px] text-violet-500 dark:text-violet-400">
              {isUploading ? `Uploading... ${progress}%` : 'Ready to send'}
            </p>
          </div>
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1 text-violet-400 hover:text-violet-600 dark:hover:text-violet-200 rounded-full hover:bg-violet-200/50 dark:hover:bg-violet-800/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 sm:gap-3 relative">
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowEmoji((prev) => !prev)}
            className={cn(
              'p-2 sm:p-2.5 rounded-full transition-colors',
              showEmoji
                ? 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/50'
                : 'text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <Smile className="w-5 h-5" />
          </button>

          {showEmoji && (
            <div
              ref={emojiRef}
              className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 grid grid-cols-6 gap-1 z-50 animate-scale-in min-w-[260px]"
            >
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiSelect(emoji)}
                  className="text-lg hover:scale-125 transition-transform p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="Type a message..."
          className="flex-1 min-w-0 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 focus:border-violet-500/50 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all duration-200 font-medium"
        />

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 sm:p-2.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => toast.info('Voice messages coming soon!')}
          className="hidden sm:inline-flex p-2 sm:p-2.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          <Mic className="w-5 h-5" />
        </button>

        <button
          type="submit"
          disabled={(!text.trim() && !selectedFile) || isUploading}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl gradient-btn text-white flex items-center justify-center shadow-lg shadow-violet-600/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 flex-shrink-0"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] translate-x-[1px]" />
        </button>
      </div>
    </form>
  );
}

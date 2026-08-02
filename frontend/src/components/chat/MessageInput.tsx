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
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 144)}px`;
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
    if (textAreaRef.current) textAreaRef.current.style.height = 'auto';
    handleRemoveFile();
    onTypingStop?.();
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
    onTypingStart?.();
    requestAnimationFrame(() => textAreaRef.current?.focus());
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return null;
    if (selectedFile.type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-violet-500" />;
    return <FileText className="w-5 h-5 text-violet-500" />;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 sm:p-4 bg-[#09090B]/90 backdrop-blur-xl border-t border-white/10"
    >
      {selectedFile && (
        <div className="mb-2 flex items-center gap-3 p-2.5 px-4 bg-[#18181C] border border-white/10 rounded-2xl">
          {filePreview ? (
            <img
              src={filePreview}
              alt="Preview"
              className="w-10 h-10 rounded-lg object-cover border border-white/10"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#111114] flex items-center justify-center">
              {getFileIcon()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {selectedFile.name}
            </p>
            <p className="text-[10px] text-zinc-400">
              {isUploading ? `Uploading... ${progress}%` : 'Ready to send'}
            </p>
          </div>
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-[#5D5FEF] border-t-transparent rounded-full animate-spin" />
          ) : (
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
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
              'p-2 sm:p-2.5 rounded-2xl transition-colors',
              showEmoji
                ? 'text-[#5D5FEF] bg-[#18181C]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Smile className="w-5 h-5" />
          </button>

          {showEmoji && (
            <div
              ref={emojiRef}
              className="absolute bottom-full mb-2 left-0 bg-[#111114] border border-white/10 rounded-2xl shadow-2xl p-3 grid grid-cols-6 gap-1 z-50 animate-scale-in min-w-[260px]"
            >
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiSelect(emoji)}
                  className="text-lg hover:scale-125 transition-transform p-1.5 rounded-lg hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <textarea
          ref={textAreaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleTextKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 min-w-0 max-h-36 resize-none bg-[#111114] border border-white/10 focus:border-[#5D5FEF]/60 rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all duration-200 font-medium leading-relaxed"
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
          className="p-2 sm:p-2.5 text-zinc-400 hover:text-white rounded-2xl hover:bg-white/5 transition-colors flex-shrink-0"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => toast.info('Voice messages coming soon!')}
          className="hidden sm:inline-flex p-2 sm:p-2.5 text-zinc-400 hover:text-white rounded-2xl hover:bg-white/5 transition-colors flex-shrink-0"
        >
          <Mic className="w-5 h-5" />
        </button>

        <button
          type="submit"
          disabled={(!text.trim() && !selectedFile) || isUploading}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white flex items-center justify-center shadow-lg shadow-[#5D5FEF]/25 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 flex-shrink-0"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] translate-x-[1px]" />
        </button>
      </div>
    </form>
  );
}

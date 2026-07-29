import React, { useState, useRef } from 'react';
import { Smile, Paperclip, Mic, Send, X } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';

interface MessageInputProps {
  onSendMessage: (content: string, fileId?: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  conversationId: string | null;
}

export function MessageInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  conversationId,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading, progress } = useFileUpload();

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
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !selectedFile) || isUploading) return;

    let fileId: string | undefined;

    if (selectedFile && conversationId) {
      try {
        const fileMeta = await upload(selectedFile, conversationId);
        fileId = fileMeta._id;
      } catch (err) {
        console.error('File upload failed', err);
        return;
      }
    }

    onSendMessage(text.trim(), fileId);
    setText('');
    setSelectedFile(null);
    onTypingStop?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white dark:bg-[#0B0F19] border-t border-slate-200/80 dark:border-slate-800/80"
    >
      {selectedFile && (
        <div className="mb-2 flex items-center justify-between p-2.5 px-4 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 rounded-xl text-xs text-violet-700 dark:text-violet-300 font-semibold">
          <span className="truncate max-w-[250px] font-bold">{selectedFile.name}</span>
          {isUploading ? (
            <span className="font-extrabold">{progress}%</span>
          ) : (
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="p-2.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Smile className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="Type a message..."
          className="flex-1 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 focus:border-violet-500/50 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all duration-200 font-medium"
        />

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <button
          type="button"
          className="p-2.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Mic className="w-5 h-5" />
        </button>

        <button
          type="submit"
          disabled={(!text.trim() && !selectedFile) || isUploading}
          className="w-11 h-11 rounded-2xl gradient-btn text-white flex items-center justify-center shadow-lg shadow-violet-600/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200"
        >
          <Send className="w-5 h-5 stroke-[2.2] translate-x-[1px]" />
        </button>
      </div>
    </form>
  );
}

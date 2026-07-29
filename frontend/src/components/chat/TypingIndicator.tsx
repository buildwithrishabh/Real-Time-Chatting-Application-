interface TypingIndicatorProps {
  userName?: string | null;
}

export function TypingIndicator({ userName }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-4 animate-fade-in">
      {userName && (
        <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
          {userName}
        </span>
      )}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-2xl rounded-bl-xs shadow-2xs flex items-center gap-1.5">
        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
      </div>
    </div>
  );
}

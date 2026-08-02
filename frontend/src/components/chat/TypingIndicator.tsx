interface TypingIndicatorProps {
  userName?: string | null;
}

export function TypingIndicator({ userName }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 my-3 animate-fade-in select-none">
      {userName && (
        <span className="text-xs text-zinc-400 font-semibold">
          {userName}
        </span>
      )}
      <div className="bg-[#181818] border border-white/5 px-4 py-2.5 rounded-2xl rounded-bl-xs shadow-md flex items-center gap-1.5">
        <span className="w-2 h-2 bg-[#5D5FEF] rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-[#5D5FEF] rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-[#5D5FEF] rounded-full animate-bounce" />
      </div>
    </div>
  );
}

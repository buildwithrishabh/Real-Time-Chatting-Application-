interface DateDividerProps {
  date: string;
}

export function DateDivider({ date }: DateDividerProps) {
  return (
    <div className="flex items-center justify-center my-6 select-none">
      <span className="px-3.5 py-1 rounded-xl bg-[#111114] border border-white/10 text-[11px] font-bold text-zinc-400 shadow-md">
        {date}
      </span>
    </div>
  );
}

interface DateDividerProps {
  date: string;
}

export function DateDivider({ date }: DateDividerProps) {
  return (
    <div className="flex items-center justify-center my-6">
      <span className="px-4 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 shadow-2xs">
        {date}
      </span>
    </div>
  );
}

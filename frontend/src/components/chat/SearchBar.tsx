import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search conversations...' }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 bg-[#111114] border border-white/10 focus:border-[#5D5FEF]/60 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/25 transition-all duration-200"
      />
    </div>
  );
}

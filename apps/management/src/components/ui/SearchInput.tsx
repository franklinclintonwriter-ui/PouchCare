import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
  autoFocus?: boolean;
}

function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  className,
  size = 'sm',
  autoFocus = false,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn('relative', className)}>
      <Search className={cn(
        'pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500',
        size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
      )} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSearch?.(); }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full rounded-lg border border-gray-200 bg-gray-50/80 pl-8 text-sm text-gray-900 transition-all duration-150',
          'placeholder:text-gray-400',
          'focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-500/10 focus:outline-none',
          'dark:border-gray-600/80 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder:text-gray-500',
          'dark:focus:border-primary-500/50 dark:focus:bg-gray-800',
          size === 'sm' ? 'h-9 pr-8' : 'h-10 pr-9',
        )}
      />
      {value && (
        <button
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export { SearchInput };

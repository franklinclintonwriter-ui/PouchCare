import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useClickOutside } from '@/hooks/useClickOutside';

interface FilterOption {
  label: string;
  value: string;
  icon?: LucideIcon;
}

interface FilterDropdownProps {
  label: string;
  icon?: LucideIcon;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function FilterDropdown({ label, icon: LabelIcon, options, value, onChange, className }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));
  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all duration-150',
          value
            ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-700/50 dark:bg-primary-900/20 dark:text-primary-300'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600/80 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500',
        )}
        aria-label={label}
      >
        {LabelIcon && <LabelIcon className="h-3.5 w-3.5" />}
        <span className={cn('whitespace-nowrap', LabelIcon && 'hidden sm:inline')}>
          {value ? selected?.label : label}
        </span>
        {value ? (
          <X
            className="h-3 w-3 opacity-60 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
          />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-50" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-40 mt-1 min-w-[140px] max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto animate-scale-in rounded-lg border border-gray-200 bg-white py-1 shadow-elevated scrollbar-thin dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors',
              !value
                ? 'bg-gray-50 font-medium text-gray-900 dark:bg-gray-700/50 dark:text-gray-100'
                : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/30',
            )}
          >
            All
          </button>
          {options.map((opt) => {
            const OptIcon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors',
                  value === opt.value
                    ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/30',
                )}
              >
                {OptIcon && <OptIcon className="h-3.5 w-3.5 shrink-0" />}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { FilterDropdown, type FilterOption };

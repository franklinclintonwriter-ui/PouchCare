import { cn } from '@/utils/cn';

interface Tab {
  label: string;
  value: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Accessible name for the tab strip (e.g. "Filter tasks by status") */
  ariaLabel?: string;
  /**
   * `wrap` — tabs wrap to multiple rows (no horizontal scroll). Better for many tabs on mobile.
   * `scroll` — default horizontal scroll strip.
   */
  variant?: 'scroll' | 'wrap';
}

function Tabs({ tabs, value, onChange, className, ariaLabel, variant = 'scroll' }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'rounded-xl border border-gray-200/80 bg-gray-100/70 p-1 dark:border-gray-700/60 dark:bg-gray-900/50',
        variant === 'wrap'
          ? 'grid w-full grid-cols-2 gap-1 p-1 sm:grid-cols-3 lg:grid-cols-5'
          : 'flex min-w-0 gap-0.5 overflow-x-auto overscroll-x-contain scrollbar-thin sm:gap-1 snap-x snap-proximity scroll-pl-1 scroll-pr-1 touch-manipulation',
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150 sm:min-h-11 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm',
            variant === 'scroll' && 'h-8 shrink-0 snap-start whitespace-nowrap sm:h-auto',
            variant === 'wrap' && 'min-h-10 w-full',
            value === tab.value
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/80 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600/60'
              : 'text-gray-500 hover:bg-white/60 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-100',
          )}
        >
          {tab.icon && <span className="[&>svg]:h-3 [&>svg]:w-3 sm:[&>svg]:h-3.5 sm:[&>svg]:w-3.5">{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={cn(
                'rounded-full px-1 py-px text-[10px] font-semibold tabular-nums sm:px-1.5 sm:py-0.5 sm:text-[11px]',
                value === tab.value
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export { Tabs, type Tab };

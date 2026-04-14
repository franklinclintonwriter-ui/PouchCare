import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useClickOutside } from '@/hooks/useClickOutside';
import { formatDate } from '@/utils/format';

interface DateRange {
  start: string;
  end: string;
}

interface DateRangePickerProps {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
  className?: string;
}

function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  const presets = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'This month', days: -1 },
    { label: 'Last month', days: -2 },
  ];

  function applyPreset(days: number) {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (days === -1) {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (days === -2) {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (days === 0) {
      start = now;
    } else {
      start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    onChange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
    setIsOpen(false);
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all',
          value
            ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-700/50 dark:bg-primary-900/20 dark:text-primary-300'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-600/80 dark:bg-gray-800 dark:text-gray-300',
        )}
      >
        <Calendar className="h-3.5 w-3.5" />
        {value ? (
          <>
            <span className="hidden sm:inline">{formatDate(value.start)} - {formatDate(value.end)}</span>
            <span className="sm:hidden">Date range</span>
            <X
              className="h-3 w-3 opacity-60 hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
            />
          </>
        ) : (
          <span>Date range</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-1 animate-scale-in rounded-lg border border-gray-200 bg-white p-3 shadow-elevated dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-1">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.days)}
                className="block w-full rounded-md px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="date"
                value={value?.start ?? ''}
                onChange={(e) =>
                  onChange({ start: e.target.value, end: value?.end ?? e.target.value })
                }
                className="h-9 rounded-md border border-gray-200 bg-white px-2 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={value?.end ?? ''}
                onChange={(e) =>
                  onChange({ start: value?.start ?? e.target.value, end: e.target.value })
                }
                className="h-9 rounded-md border border-gray-200 bg-white px-2 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { DateRangePicker, type DateRange };

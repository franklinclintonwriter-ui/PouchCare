import { cn } from '@/utils/cn';
import { STATUS_COLORS, STATUS_DOT_COLORS, getStatusLabel } from '@/utils/constants';

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

function StatusBadge({ status, showDot = true, size = 'md', className }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] || STATUS_COLORS['default'] || 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300';
  const dotColor = STATUS_DOT_COLORS[status] || 'bg-gray-400';
  const label = getStatusLabel(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium whitespace-nowrap',
        colorClass,
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        className,
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />}
      {label}
    </span>
  );
}

export { StatusBadge };

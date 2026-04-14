import { cn } from '@/utils/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  className?: string;
}

const colorStyles = {
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

const sizeStyles = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2.5',
};

function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);

  const autoColor = percent >= 80 ? 'success' : percent >= 50 ? 'primary' : percent >= 25 ? 'warning' : 'danger';
  const finalColor = color === 'primary' && !showLabel ? autoColor : color;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', colorStyles[finalColor])}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="shrink-0 text-xs font-medium text-gray-600 dark:text-gray-400">
          {Math.round(percent)}%
        </span>
      )}
    </div>
  );
}

export { ProgressBar };

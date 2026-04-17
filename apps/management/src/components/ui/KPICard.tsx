import { cn } from '@/utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  className?: string;
  loading?: boolean;
}

function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconBg = 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
  className,
  loading = false,
}: KPICardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  if (loading) {
    return (
      <div className={cn(
        'rounded-xl border border-gray-200/80 bg-white p-2 sm:p-4 dark:border-gray-700/60 dark:bg-gray-800/80',
        className,
      )}>
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="h-3.5 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-7 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  return (
      <div className={cn(
        'rounded-xl border border-gray-200/80 bg-white p-2 transition-all duration-200 sm:p-4',
        'hover:shadow-card dark:border-gray-700/60 dark:bg-gray-800/80',
        className,
      )}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-xs">
            {title}
          </p>
          <p className="mt-0.5 truncate text-base font-bold tabular-nums text-gray-900 dark:text-gray-100 sm:mt-2 sm:text-2xl">
            {value}
          </p>
          {change !== undefined && (
            <div className="mt-1.5 flex items-center gap-1">
              {isPositive && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
              {isNegative && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
              {!isPositive && !isNegative && <Minus className="h-3.5 w-3.5 text-gray-400" />}
              <span
                className={cn(
                  'text-xs font-medium',
                  isPositive && 'text-emerald-600 dark:text-emerald-400',
                  isNegative && 'text-red-600 dark:text-red-400',
                  !isPositive && !isNegative && 'text-gray-500',
                )}
              >
                {isPositive && '+'}
                {change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{changeLabel}</span>
              )}
            </div>
          )}
          {change === undefined && changeLabel && (
            <p className="mt-1.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{changeLabel}</p>
          )}
        </div>
        {icon && (
          <div className={cn('rounded-lg p-1.5 sm:rounded-xl sm:p-2.5', iconBg)}>
            <div className="[&>svg]:h-3.5 [&>svg]:w-3.5 sm:[&>svg]:h-5 sm:[&>svg]:w-5">{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export { KPICard };

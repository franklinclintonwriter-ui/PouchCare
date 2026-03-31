import { cn } from '@/utils/cn';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

function EmptyState({
  icon,
  title = 'No data found',
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
      <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
        <div className="text-gray-300 dark:text-gray-600 [&>svg]:h-8 [&>svg]:w-8">
          {icon || <Inbox />}
        </div>
      </div>
      <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-200">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="outline" className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };

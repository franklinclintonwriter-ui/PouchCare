import { cn } from '@/utils/cn';
import { Check, Clock, Truck, PackageCheck, X } from 'lucide-react';
import type { OrderStatus } from '@/types/enums';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
}

const steps = [
  { key: 'PENDING', label: 'Placed', icon: Clock },
  { key: 'PROCESSING', label: 'Processing', icon: Clock },
  { key: 'DELIVERED', label: 'Delivered', icon: Truck },
  { key: 'COMPLETED', label: 'Completed', icon: PackageCheck },
] as const;

const statusOrder: Record<string, number> = {
  PENDING: 0, PROCESSING: 1, DELIVERED: 2, REVISION_REQUESTED: 2, COMPLETED: 3,
};

function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'REFUNDED';
  const currentIndex = isCancelled ? -1 : (statusOrder[currentStatus] ?? 0);

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-900/20">
        <X className="h-4 w-4 text-red-500" />
        <span className="text-sm font-medium text-red-600 dark:text-red-400">
          {currentStatus === 'CANCELLED' ? 'Cancelled' : 'Refunded'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        const Icon = isCompleted ? Check : step.icon;

        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full transition-all sm:h-9 sm:w-9',
                  isCompleted && 'bg-emerald-500 text-white',
                  isCurrent && 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/40',
                  !isCompleted && !isCurrent && 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500',
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium sm:text-xs',
                  (isCompleted || isCurrent) ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500',
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-0.5 flex-1 rounded-full sm:mx-2',
                  i < currentIndex ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export { OrderTimeline };

import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded bg-gray-200/80 dark:bg-gray-700/60', className)} />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-5 dark:border-gray-700/60 dark:bg-gray-800/80">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-5 w-16 rounded" />
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonRow };

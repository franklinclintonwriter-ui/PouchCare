import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

interface ExpandableRowDetailProps {
  expanded: boolean;
  onToggle: () => void;
  label?: string;
  children: ReactNode;
  className?: string;
}

/** Accessible row control: chevron + optional label; expand content in caller. */
export function ExpandableRowDetail({
  expanded,
  onToggle,
  label = 'Details',
  children,
  className,
}: ExpandableRowDetailProps) {
  return (
    <div className={cn('border-t border-gray-100 bg-gray-50/80 dark:border-gray-700/50 dark:bg-gray-900/30', className)}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full min-h-[44px] items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-primary-600 hover:bg-gray-100/80 dark:text-primary-400 dark:hover:bg-gray-800/60"
      >
        {expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        {label}
      </button>
      {expanded ? <div className="px-4 pb-4 pt-0">{children}</div> : null}
    </div>
  );
}

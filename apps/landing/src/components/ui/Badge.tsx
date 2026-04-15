import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant =
  | 'sky'
  | 'indigo'
  | 'green'
  | 'yellow'
  | 'red'
  | 'slate'
  // Semantic aliases
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  sky: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
  green: 'bg-green-500/10 text-green-700 border-green-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  red: 'bg-red-500/10 text-red-700 border-red-500/20',
  slate: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  // Semantic aliases
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  neutral: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};

export function Badge({ children, variant = 'sky', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

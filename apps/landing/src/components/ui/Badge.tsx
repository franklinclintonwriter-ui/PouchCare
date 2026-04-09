import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'sky' | 'indigo' | 'green' | 'yellow' | 'red' | 'slate';

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  green: 'bg-green-500/10 text-green-400 border-green-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
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

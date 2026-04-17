import { cn } from '@/utils/cn';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'custom';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  dotColor?: string;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300',
  primary: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  custom: '',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[11px]',
  md: 'px-2 py-0.5 text-xs',
};

function Badge({ children, variant = 'default', size = 'md', dot, dotColor, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotColor || 'bg-current opacity-60')} />
      )}
      {children}
    </span>
  );
}

export { Badge, type BadgeProps };

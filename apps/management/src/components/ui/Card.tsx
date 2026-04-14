import { cn } from '@/utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const paddingStyles = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

function Card({ children, className, padding = 'md', hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-gray-200/80 bg-white shadow-soft transition-all duration-200',
        'dark:border-gray-700/60 dark:bg-gray-800/80',
        hover && 'cursor-pointer hover:shadow-elevated hover:border-gray-300 dark:hover:border-gray-600',
        paddingStyles[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {children}
    </div>
  );
}

function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-sm font-semibold text-gray-900 dark:text-gray-100', className)}>
      {children}
    </h3>
  );
}

function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mt-3', className)}>{children}</div>;
}

export { Card, CardHeader, CardTitle, CardContent };

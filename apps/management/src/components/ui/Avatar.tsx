import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/format';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
  xl: 'h-14 w-14 text-lg',
};

const bgColors = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
];

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % bgColors.length;
}

function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const safeName = (name ?? '').trim();
  const alt = safeName || 'Avatar';

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn('rounded-full object-cover ring-2 ring-white dark:ring-gray-800', sizeStyles[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold ring-2 ring-white dark:ring-gray-800',
        sizeStyles[size],
        bgColors[getColorIndex(safeName || 'user')],
        className,
      )}
    >
      {getInitials(safeName)}
    </div>
  );
}

export { Avatar };

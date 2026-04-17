import { useState, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useClickOutside } from '@/hooks/useClickOutside';

interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
  trigger?: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

function Dropdown({ items, trigger, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      >
        {trigger || <MoreHorizontal className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full z-50 mt-1 min-w-[160px] max-w-[calc(100vw-2rem)] animate-scale-in rounded-lg border border-gray-200 bg-white py-1 shadow-elevated',
            'dark:border-gray-700 dark:bg-gray-800',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                setIsOpen(false);
              }}
              disabled={item.disabled}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-50',
                item.variant === 'danger'
                  ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50',
              )}
            >
              {item.icon && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { Dropdown, type DropdownItem };

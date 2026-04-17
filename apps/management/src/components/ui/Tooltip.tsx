import { useState, useRef, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 400);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {visible && (
        <div
          className={cn(
            'absolute z-50 max-w-[200px] whitespace-normal break-words rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg',
            'dark:bg-gray-700',
            'animate-fade-in pointer-events-none',
            positionStyles[side],
            className,
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export { Tooltip };

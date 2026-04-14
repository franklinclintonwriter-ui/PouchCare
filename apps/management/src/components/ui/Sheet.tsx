import { Fragment, type ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

type SheetSide = 'right' | 'left';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: SheetSide;
  width?: string;
  footer?: ReactNode;
}

const slideVariants = {
  right: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
  },
  left: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
  },
};

function Sheet({ isOpen, onClose, title, children, side = 'right', width = 'max-w-md', footer }: SheetProps) {
  const variant = slideVariants[side];

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            initial={variant.initial}
            animate={variant.animate}
            exit={variant.exit}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed inset-y-0 z-50 flex w-full flex-col bg-white shadow-2xl',
              'dark:bg-gray-800 dark:border-l dark:border-gray-700/60',
              side === 'right' ? 'right-0' : 'left-0',
              width,
            )}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5 sm:py-4 dark:border-gray-700/60">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4 scrollbar-thin">{children}</div>

            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-4 py-3 sm:px-5 dark:border-gray-700/60">
                {footer}
              </div>
            )}
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}

export { Sheet };

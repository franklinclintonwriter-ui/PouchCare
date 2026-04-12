import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: ModalSize;
  footer?: ReactNode;
  closeOnOverlay?: boolean;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-4rem)]',
};

function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  footer,
  closeOnOverlay = true,
}: ModalProps) {
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalEl(document.body);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  if (!portalEl) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-overlay"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={cn(
            'fixed inset-0 z-50 flex min-h-0 flex-col',
            // Full dynamic viewport height (mobile toolbars / rotation)
            'min-h-[100dvh]',
          )}
        >
          {/* Full-display blur + dim — edge-to-edge under notches and home indicator */}
          <div
            className={cn(
              'absolute inset-0 z-0',
              'bg-black/45 dark:bg-black/55',
              'backdrop-blur-md backdrop-saturate-150',
              'supports-[backdrop-filter]:bg-black/35 dark:supports-[backdrop-filter]:bg-black/45',
            )}
            aria-hidden
            onClick={closeOnOverlay ? onClose : undefined}
          />

          {/* Scroll + safe-area insets only affect the dialog chrome, not the blur layer */}
          <div
            className={cn(
              'relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto overscroll-contain',
              'p-4',
              'pt-[max(1rem,env(safe-area-inset-top,0px))]',
              'pb-[max(1rem,env(safe-area-inset-bottom,0px))]',
              'pl-[max(1rem,env(safe-area-inset-left,0px))]',
              'pr-[max(1rem,env(safe-area-inset-right,0px))]',
              'sm:p-6',
            )}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: 'spring', duration: 0.28, bounce: 0.12 }}
              className={cn(
                'relative w-full overflow-hidden rounded-2xl bg-white shadow-modal',
                'dark:bg-gray-800 dark:border dark:border-gray-700/60',
                'max-h-[min(calc(100dvh-2rem),calc(100svh-2rem))] sm:max-h-[min(calc(100dvh-4rem),calc(100svh-4rem))]',
                'flex flex-col',
                sizeStyles[size],
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {(title || description) && (
                <div className="flex items-start justify-between border-b border-gray-100 px-4 py-4 sm:px-5 dark:border-gray-700/60">
                  <div>
                    {title && (
                      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalEl,
  );
}

export { Modal };

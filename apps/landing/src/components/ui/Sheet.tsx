import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ui, transition } from "@/lib/ui";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeOnOverlay?: boolean;
}

/**
 * Bottom sheet for mobile-friendly actions (also usable on desktop).
 */
export function Sheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  closeOnOverlay = true,
}: SheetProps) {
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(isOpen);
  useFocusTrap(isOpen, panelRef);

  useEffect(() => {
    setPortalEl(document.body);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!portalEl) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="sheet-root"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition.easeOut}
          className={cn(
            "fixed inset-0 z-[195] flex flex-col justify-end bg-black/45 backdrop-blur-[2px]",
            "min-h-[100dvh]",
          )}
        >
          <div
            className="absolute inset-0 z-0"
            aria-hidden
            onClick={closeOnOverlay ? onClose : undefined}
          />
          <div
            className={cn(
              "relative z-10 flex max-h-[min(92dvh,92svh)] flex-col justify-end",
              "pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]",
            )}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "sheet-title" : undefined}
              aria-describedby={description ? "sheet-desc" : undefined}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={transition.spring}
              className={cn(
                ui.panel,
                "max-h-[inherit] w-full overflow-hidden rounded-b-none rounded-t-2xl",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />

              {(title || description) && (
                <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-3 sm:px-5">
                  <div className="min-w-0">
                    {title && (
                      <h2 id="sheet-title" className={ui.headingLg}>{title}</h2>
                    )}
                    {description && (
                      <p id="sheet-desc" className={cn("mt-1", ui.description)}>{description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className={cn(
                      "shrink-0 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300",
                      ui.focusRing,
                    )}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2 [scrollbar-width:thin] sm:px-5">
                {children}
              </div>

              {footer && (
                <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 sm:px-5">
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

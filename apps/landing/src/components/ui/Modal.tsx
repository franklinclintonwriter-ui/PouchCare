import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ui, transition } from "@/lib/ui";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: ModalSize;
  footer?: ReactNode;
  closeOnOverlay?: boolean;
  /** Hide the top-right close control */
  hideCloseButton?: boolean;
  /** Extra class on the inner panel */
  panelClassName?: string;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-4rem)]",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  footer,
  closeOnOverlay = true,
  hideCloseButton = false,
  panelClassName,
}: ModalProps) {
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
          key="modal-root"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition.easeOut}
          className={cn(
            ui.overlay,
            "flex min-h-0 flex-col",
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
              "relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto overscroll-contain",
              "p-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:p-6",
            )}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "modal-title" : undefined}
              aria-describedby={description ? "modal-desc" : undefined}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={transition.spring}
              className={cn(
                ui.panel,
                "relative flex max-h-[min(calc(100dvh-2rem),calc(100svh-2rem))] w-full flex-col overflow-hidden sm:max-h-[min(calc(100dvh-4rem),calc(100svh-4rem))]",
                sizeStyles[size],
                panelClassName,
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {(title || description || !hideCloseButton) && (
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
                  <div className="min-w-0">
                    {title && (
                      <h2 id="modal-title" className={ui.heading}>
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p id="modal-desc" className={cn("mt-1", ui.description)}>
                        {description}
                      </p>
                    )}
                  </div>
                  {!hideCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close"
                      className={cn(
                        "shrink-0 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700",
                        ui.focusRing,
                      )}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 [scrollbar-width:thin] sm:px-5 sm:py-4">
                {children}
              </div>

              {footer && (
                <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
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

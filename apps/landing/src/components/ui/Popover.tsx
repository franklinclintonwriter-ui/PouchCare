import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  type Placement,
} from "@floating-ui/react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { ui, transition } from "@/lib/ui";

export interface PopoverProps {
  /** Renders the toggle control (wrapped for positioning). */
  trigger: ReactNode;
  children: ReactNode;
  placement?: Placement;
  /** Controlled open state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Uncontrolled initial open */
  defaultOpen?: boolean;
  /** z-index above page chrome (below modals) */
  className?: string;
}

export function Popover({
  trigger,
  children,
  placement = "bottom-end",
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  className,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    middleware: [offset(8), flip(), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <>
      <span
        ref={refs.setReference}
        className="inline-flex max-w-full"
        {...getReferenceProps()}
      >
        {trigger}
      </span>
      <FloatingPortal>
        <AnimatePresence>
          {open && (
            <motion.div
              ref={refs.setFloating}
              style={{ ...floatingStyles, zIndex: ui.z.popover }}
              initial={{ opacity: 0, scale: 0.98, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -4 }}
              transition={transition.easeOut}
              className={cn(ui.popoverSurface, "max-w-[min(100vw-1.5rem,20rem)] outline-none", className)}
              {...getFloatingProps()}
            >
              <div className="max-h-[min(70dvh,24rem)] overflow-y-auto overscroll-contain [scrollbar-width:thin] p-1">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}

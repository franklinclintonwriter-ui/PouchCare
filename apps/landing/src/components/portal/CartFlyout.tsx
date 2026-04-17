/**
 * Cart flyout popover for the dashboard header.
 * Shows line items with qty stepper + remove, subtotal, and checkout CTA.
 * The full checkout page at /dashboard/cart is still the primary flow.
 *
 * On mobile (<640px) the dropdown uses `fixed inset-x` with a backdrop
 * so it never overflows the viewport. On `sm:` it uses absolute right-0.
 */
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { paths } from "@/routes/paths";
import { formatUsd } from "@/lib/format";
import { useCartStore } from "@/stores/cartStore";

const easeOut = [0.22, 1, 0.36, 1] as const;

interface CartFlyoutProps {
  open: boolean;
  onClose: () => void;
}

export function CartFlyout({ open, onClose }: CartFlyoutProps) {
  const { lines, updateQty, remove } = useCartStore();
  const subtotal = lines.reduce((s, l) => s + l.unitPriceUsd * l.quantity, 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cart-flyout"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] sm:hidden"
            aria-hidden
            onPointerDown={onClose}
          />

          {/* Panel — fixed on mobile, absolute on desktop */}
          <motion.div
            initial={{ y: -10, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: easeOut }}
            style={{ transformOrigin: "top right" }}
            className={cn(
              "overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-lg shadow-gray-900/10 ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-900",
              "fixed inset-x-3 top-[3.75rem] z-50",
              "sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[22rem]",
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Cart preview"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100/80 px-4 py-3 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                Cart{" "}
                {lines.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-700">
                    {lines.reduce((n, l) => n + l.quantity, 0)}
                  </span>
                )}
              </span>
              <Link
                to={paths.dashboardServices}
                onClick={onClose}
                className="text-[11px] font-medium text-primary-600 hover:text-primary-800"
              >
                Browse services
              </Link>
            </div>

            {/* Body */}
            {lines.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                <ShoppingBag className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Your cart is empty.</p>
                <Link
                  to={paths.dashboardServices}
                  onClick={onClose}
                  className="text-sm font-medium text-primary-600 hover:text-primary-800"
                >
                  Add services →
                </Link>
              </div>
            ) : (
              <>
                <ul className="max-h-60 divide-y divide-gray-100/80 dark:divide-gray-800 overflow-y-auto overscroll-contain [scrollbar-width:thin] sm:max-h-72">
                  {lines.map((line) => (
                    <li key={line.serviceId} className="flex items-start gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                          {line.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{line.slug}</p>
                        <p className="mt-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {formatUsd(line.unitPriceUsd)} × {line.quantity} ={" "}
                          {formatUsd(line.unitPriceUsd * line.quantity)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                          <button
                            type="button"
                            onClick={() => updateQty(line.serviceId, line.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300 touch-manipulation"
                            aria-label={`Decrease ${line.name} quantity`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[1.5rem] select-none px-1 text-center text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(line.serviceId, line.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300 touch-manipulation"
                            aria-label={`Increase ${line.name} quantity`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(line.serviceId)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 touch-manipulation"
                          aria-label={`Remove ${line.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-gray-100/80 px-4 py-3 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">
                      {formatUsd(subtotal)}
                    </span>
                  </div>
                  <Link
                    to={paths.dashboardCart}
                    onClick={onClose}
                    className={cn(
                      "mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl",
                      "bg-gradient-to-r from-primary-600 to-primary-500 text-sm font-semibold text-white",
                      "shadow-sm transition-all hover:from-primary-700 hover:to-primary-600 touch-manipulation",
                    )}
                  >
                    Checkout →
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * EmptyState — icon + title + description + optional action.
 *
 * Used everywhere a list can be empty (Orders, Invoices, Notifications,
 * Websites, Support tickets, Referrals). Replaces the ~14 hand-rolled
 * "Nothing here" blocks across the dashboard pages.
 *
 * @example
 *   <EmptyState
 *     icon={<Package />}
 *     title="No orders yet"
 *     description="Your completed orders will show here."
 *     action={<Button onClick={openServices}>Browse services</Button>}
 *   />
 */
import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  /** Lucide icon or any ReactNode; rendered inside a muted circle. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Single action button / link rendered below the description. */
  action?: ReactNode;
  /** Secondary link or hint next to the primary action. */
  secondary?: ReactNode;
  className?: string;
  /** Compact (smaller padding + smaller icon) for inline list placement. */
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondary,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8" : "py-14",
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden
          className={cn(
            "mb-4 flex items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300",
            compact ? "h-10 w-10 [&>*]:h-5 [&>*]:w-5" : "h-14 w-14 [&>*]:h-7 [&>*]:w-7",
          )}
        >
          {icon}
        </div>
      )}
      <h3
        className={cn(
          "font-semibold text-gray-900 dark:text-gray-100",
          compact ? "text-sm" : "text-base",
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "mt-1 max-w-sm text-gray-500 dark:text-gray-400",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </p>
      )}
      {(action || secondary) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondary}
        </div>
      )}
    </div>
  );
}

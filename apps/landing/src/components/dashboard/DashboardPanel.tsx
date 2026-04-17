import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function DashboardPanel({
  children,
  className,
  title,
  description,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5 md:p-6 dark:border-gray-800 dark:bg-gray-900",
        className,
      )}
    >
      {(title || description || action) && (
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400 sm:text-sm">
                {description}
              </p>
            )}
          </div>
          {action ? (
            <div className="w-full shrink-0 sm:w-auto sm:max-w-[min(100%,20rem)]">
              {action}
            </div>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}

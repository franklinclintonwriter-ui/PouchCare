import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-800 dark:bg-gray-900",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </p>
        {icon ? (
          <span className="shrink-0 text-gray-400 [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-1 break-words text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-100 sm:text-2xl">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p> : null}
    </div>
  );
}

/**
 * Skeleton — shimmer placeholder for loading states.
 *
 * Use directly for arbitrary shapes, or pick one of the preset shortcuts
 * (`SkeletonText`, `SkeletonRow`, `SkeletonCard`, `SkeletonStat`) to match
 * the common layouts used across the client portal.
 *
 * The shimmer is a pure CSS gradient animation driven by the `animate-pulse`
 * Tailwind utility; no JS, no layout shift.
 */
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional explicit height (defaults to text-like `h-4`). */
  height?: string;
  /** Optional explicit width (defaults to 100%). */
  width?: string;
  /** Shape — `rect` is the default, `circle` sets aspect-ratio:1 and rounds. */
  shape?: "rect" | "circle";
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ height, width, shape = "rect", className, style, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden
        role="presentation"
        className={cn(
          "animate-pulse rounded-md bg-gray-200/80 dark:bg-gray-700/50",
          shape === "circle" && "aspect-square rounded-full",
          !height && "h-4",
          className,
        )}
        style={{ width, height, ...style }}
        {...rest}
      />
    );
  },
);
Skeleton.displayName = "Skeleton";
export { Skeleton };

/** Two lines of stacked text, last line 70% width. Great inside cards. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5", i === lines - 1 && "w-3/4")}
        />
      ))}
    </div>
  );
}

/** One row in a list-style layout (avatar + text + value). */
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3",
        className,
      )}
    >
      <Skeleton shape="circle" className="h-10 w-10" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-3.5 w-14" />
    </div>
  );
}

/** A KPI / stat card placeholder — matches the shape of StatCard. */
export function SkeletonStat({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4",
        className,
      )}
    >
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-7 w-28" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

/** A generic card placeholder — title + body. */
export function SkeletonCard({
  className,
  bodyLines = 3,
}: {
  className?: string;
  bodyLines?: number;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5",
        className,
      )}
    >
      <Skeleton className="h-5 w-1/3" />
      <div className="mt-4">
        <SkeletonText lines={bodyLines} />
      </div>
    </div>
  );
}

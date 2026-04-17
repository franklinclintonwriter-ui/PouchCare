/**
 * DataTable — responsive card-on-mobile / table-on-desktop.
 *
 * Every dashboard list page today re-rolls this exact pattern via
 * `<NarrowWide narrow={...} wide={...} />`. This primitive packages it into
 * one declarative API driven by a `columns` config so the page just says:
 *
 *   <DataTable
 *     columns={columns}
 *     data={filtered}
 *     getRowId={(o) => o.id}
 *     onRowClick={(o) => navigate(`/orders/${o.id}`)}
 *   />
 *
 * Each column declares which cells render on the desktop table AND what to
 * show on the mobile card (falling back to the table cell if no card
 * override is given). Built-in: loading skeletons, empty state, error
 * state, optional pagination in the footer.
 */
import {
  type ReactNode,
  type MouseEvent,
  type KeyboardEvent,
  Fragment,
  useId,
} from "react";
import { cn } from "@/lib/cn";
import { Skeleton, SkeletonRow } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { Pagination, type PaginationProps } from "./Pagination";

export interface DataTableColumn<T> {
  /** Stable column key — doubles as the React key when mapping cells. */
  key: string;
  /** Header label shown in the desktop `<thead>`. */
  header: ReactNode;
  /** Alignment of the column's header + cell. Default `left`. */
  align?: "left" | "right" | "center";
  /** Override the Tailwind width class ("w-24", "min-w-[140px]", …). */
  width?: string;
  /** Desktop cell renderer. */
  cell: (row: T, index: number) => ReactNode;
  /** Hide this column on the desktop table (useful for mobile-only data). */
  hideOnDesktop?: boolean;
  /** Hide on mobile cards (header / actions often don't apply). */
  hideOnMobile?: boolean;
  /** When rendering the mobile card, show this label next to the value.
   *  Defaults to `header`. */
  mobileLabel?: ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Extract a stable key from the row for React; falls back to row index. */
  getRowId?: (row: T, index: number) => string | number;
  /** Invoked on row click — makes the entire row interactive. */
  onRowClick?: (row: T, index: number) => void;
  /** Per-row className — receives the row so you can highlight e.g. unread. */
  rowClassName?: (row: T, index: number) => string | undefined;

  isLoading?: boolean;
  /** Number of skeleton rows to render while loading. Default 5. */
  skeletonRows?: number;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Shown when `data` is empty and not loading/errored. Pass a React node,
   *  or an object forwarded to `<EmptyState>`. */
  empty?: ReactNode | { title: string; description?: string; icon?: ReactNode; action?: ReactNode };

  /** Desktop wrapping container class (overrides default border + rounding). */
  desktopClassName?: string;
  /** Mobile wrapping <ul> class. */
  mobileClassName?: string;
  /** Additional className on the outer `<div>`. */
  className?: string;

  /** Optional pagination footer — pass the props through from your page. */
  pagination?: Omit<PaginationProps, "className"> & { className?: string };

  /** Caption / descriptor announced to screen readers. */
  caption?: string;
  /** Compact rows (less padding) for dense lists. */
  dense?: boolean;
}

function rowBaseClasses(clickable: boolean) {
  return cn(
    "transition-colors",
    clickable &&
      "cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
  );
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  rowClassName,
  isLoading,
  skeletonRows = 5,
  isError,
  error,
  onRetry,
  empty,
  desktopClassName,
  mobileClassName,
  className,
  pagination,
  caption,
  dense,
}: DataTableProps<T>) {
  const captionId = useId();
  const desktopCols = columns.filter((c) => !c.hideOnDesktop);
  const mobileCols = columns.filter((c) => !c.hideOnMobile);

  // ── Loading ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={className}>
        {/* Mobile skeleton cards */}
        <ul className="space-y-3 md:hidden">
          {Array.from({ length: Math.min(3, skeletonRows) }).map((_, i) => (
            <li key={i}>
              <SkeletonRow />
            </li>
          ))}
        </ul>
        {/* Desktop skeleton rows */}
        <div
          className={cn(
            "hidden overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 md:block",
            desktopClassName,
          )}
        >
          <table className="w-full text-left text-sm">
            <tbody>
              {Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  {desktopCols.map((c) => (
                    <td key={c.key} className={dense ? "px-3 py-2" : "px-4 py-3"}>
                      <Skeleton className="h-4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className={className}>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────
  if (!data.length) {
    if (empty && typeof empty === "object" && "title" in empty) {
      return (
        <div className={className}>
          <EmptyState {...(empty as { title: string; description?: string; icon?: ReactNode; action?: ReactNode })} />
        </div>
      );
    }
    return (
      <div className={className}>
        {empty ?? (
          <EmptyState
            title="Nothing to show"
            description="When there's something here it'll appear in this list."
          />
        )}
      </div>
    );
  }

  const alignClass = (a?: "left" | "right" | "center") =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  // ── Rendered ─────────────────────────────────────────────────────
  return (
    <div className={className}>
      {caption && (
        <span id={captionId} className="sr-only">
          {caption}
        </span>
      )}
      {/* Mobile cards */}
      <ul className={cn("space-y-3 md:hidden", mobileClassName)}>
        {data.map((row, i) => {
          const key = String(getRowId?.(row, i) ?? i);
          const interactive = !!onRowClick;
          return (
            <li
              key={key}
              tabIndex={interactive ? 0 : undefined}
              role={interactive ? "button" : undefined}
              onClick={interactive ? (e: MouseEvent) => {
                if ((e.target as HTMLElement).closest("a, button")) return;
                onRowClick!(row, i);
              } : undefined}
              onKeyDown={
                interactive
                  ? (e: KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick!(row, i);
                      }
                    }
                  : undefined
              }
              className={cn(
                "rounded-2xl border border-gray-200/90 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm",
                rowBaseClasses(interactive),
                rowClassName?.(row, i),
              )}
            >
              <dl className="space-y-2">
                {mobileCols.map((c, idx) => {
                  const label = c.mobileLabel ?? c.header;
                  return (
                    <div
                      key={c.key}
                      className={cn(
                        "flex items-start justify-between gap-3 text-sm",
                        idx === 0 && "border-b border-gray-100 dark:border-gray-800 pb-2",
                      )}
                    >
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {label}
                      </dt>
                      <dd
                        className={cn(
                          "min-w-0 flex-1 text-right",
                          idx === 0 && "text-left",
                        )}
                      >
                        {c.cell(row, i)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </li>
          );
        })}
      </ul>

      {/* Desktop table */}
      <div
        className={cn(
          "hidden overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 md:block",
          desktopClassName,
        )}
      >
        <table className="w-full text-left text-sm" aria-describedby={caption ? captionId : undefined}>
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {desktopCols.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    dense ? "px-3 py-2" : "px-4 py-2.5",
                    "font-semibold",
                    alignClass(c.align),
                    c.width,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((row, i) => {
              const key = String(getRowId?.(row, i) ?? i);
              const interactive = !!onRowClick;
              return (
                <tr
                  key={key}
                  tabIndex={interactive ? 0 : undefined}
                  onClick={interactive ? (e: MouseEvent) => {
                    if ((e.target as HTMLElement).closest("a, button")) return;
                    onRowClick!(row, i);
                  } : undefined}
                  onKeyDown={
                    interactive
                      ? (e: KeyboardEvent) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick!(row, i);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    rowBaseClasses(interactive),
                    rowClassName?.(row, i),
                  )}
                >
                  {desktopCols.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        dense ? "px-3 py-2" : "px-4 py-3",
                        alignClass(c.align),
                        c.width,
                      )}
                    >
                      {c.cell(row, i)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          className={cn("mt-4", pagination.className)}
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={pagination.onChange}
          showInputThreshold={pagination.showInputThreshold}
          hideCaption={pagination.hideCaption}
        />
      )}

      {/* Keep the Fragment import referenced for future slot extension. */}
      {false && <Fragment />}
    </div>
  );
}

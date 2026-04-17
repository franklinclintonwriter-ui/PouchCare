/**
 * Pagination — first / prev / page-input / next / last + results caption.
 *
 * Usage:
 *   <Pagination
 *     page={page}
 *     pageSize={20}
 *     total={data?.total ?? 0}
 *     onChange={setPage}
 *   />
 *
 * Renders nothing when there is at most one page. Computes the total number
 * of pages from `total / pageSize` so callers don't have to. The "jump to
 * page" input is hidden below a configurable row threshold to avoid noise.
 */
import { useEffect, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface PaginationProps {
  /** 1-indexed current page. */
  page: number;
  pageSize: number;
  /** Total item count across all pages. */
  total: number;
  onChange: (page: number) => void;
  /** Hide the "Jump to page" input below this total-page count. Default 5. */
  showInputThreshold?: number;
  /** Hide the results caption ("Showing 1–20 of 137"). Default false. */
  hideCaption?: boolean;
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
  showInputThreshold = 5,
  hideCaption = false,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));
  const safePage = Math.min(Math.max(1, page || 1), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);
  const atFirst = safePage <= 1;
  const atLast = safePage >= totalPages;
  const showInput = totalPages >= showInputThreshold;

  const [draft, setDraft] = useState(String(safePage));
  useEffect(() => {
    setDraft(String(safePage));
  }, [safePage]);

  if (totalPages <= 1) return null;

  const go = (p: number) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    if (clamped !== safePage) onChange(clamped);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const p = parseInt(draft, 10);
    if (Number.isFinite(p)) go(p);
  };

  const btn = cn(
    "inline-flex h-8 min-w-[32px] items-center justify-center rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-700 transition-colors",
    "hover:border-primary-300 hover:text-primary-700",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-700",
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-primary-600 dark:hover:text-primary-300",
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 text-sm",
        className,
      )}
      role="navigation"
      aria-label="Pagination"
    >
      {!hideCaption && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Showing <span className="font-medium text-gray-900 dark:text-gray-100">{start}</span>–
          <span className="font-medium text-gray-900 dark:text-gray-100">{end}</span> of{" "}
          <span className="font-medium text-gray-900 dark:text-gray-100">{total}</span>
        </span>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => go(1)}
          disabled={atFirst}
          aria-label="First page"
          className={btn}
        >
          <ChevronsLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go(safePage - 1)}
          disabled={atFirst}
          aria-label="Previous page"
          className={btn}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <span className="px-2 text-xs text-gray-600 dark:text-gray-400">
          Page <span className="font-semibold text-gray-900 dark:text-gray-100">{safePage}</span> of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => go(safePage + 1)}
          disabled={atLast}
          aria-label="Next page"
          className={btn}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go(totalPages)}
          disabled={atLast}
          aria-label="Last page"
          className={btn}
        >
          <ChevronsRight className="h-4 w-4" aria-hidden />
        </button>
        {showInput && (
          <form onSubmit={onSubmit} className="ml-2 flex items-center gap-1">
            <label className="sr-only" htmlFor="pagination-jump">
              Jump to page
            </label>
            <input
              id="pagination-jump"
              type="number"
              min={1}
              max={totalPages}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={onSubmit as unknown as React.FocusEventHandler<HTMLInputElement>}
              className={cn(
                "h-8 w-14 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-900 tabular-nums",
                "focus-visible:outline-none focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-500/25",
                "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
              )}
            />
            <button type="submit" className={cn(btn, "px-2.5 text-xs")}>
              Go
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

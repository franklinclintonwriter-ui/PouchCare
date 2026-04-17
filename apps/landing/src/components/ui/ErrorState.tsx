/**
 * ErrorState — standardised "something went wrong" panel with retry.
 *
 * Usage in any query:
 *   if (query.isError) {
 *     return <ErrorState error={query.error} onRetry={() => query.refetch()} />
 *   }
 *
 * Replaces every plain "Failed to load" string across the client portal.
 * See Audit §P1 — "No shared error UI."
 */
import { useState, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export interface ErrorStateProps {
  /** Optional override for the heading. Default: "Something went wrong". */
  title?: string;
  /** Optional override for the body copy. If omitted, we try to pull a sensible
   *  message from the provided `error`. */
  description?: string;
  /** The raw error object from the failed request / mutation. Falls back to a
   *  generic message if this is `undefined`. */
  error?: unknown;
  /** Retry handler — typically `() => query.refetch()`. */
  onRetry?: () => void;
  /** Secondary action rendered next to the retry button (e.g., "Contact support"). */
  secondary?: ReactNode;
  /** Compact variant for inline placement inside a card. */
  compact?: boolean;
  className?: string;
}

function extractMessage(err: unknown): string | null {
  if (!err) return null;
  // Axios: error.response?.data?.error is the app's envelope shape.
  const envelope = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
  if (envelope?.error) return envelope.error;
  if (envelope?.message) return envelope.message;
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return null;
}

function stringifyDetails(err: unknown): string {
  try {
    const anyErr = err as any;
    const safe = {
      name: anyErr?.name ?? undefined,
      message: anyErr?.message ?? undefined,
      status: anyErr?.response?.status ?? undefined,
      data: anyErr?.response?.data ?? undefined,
      stack: anyErr?.stack ?? undefined,
    };
    return JSON.stringify(safe, null, 2);
  } catch {
    return String(err);
  }
}

export function ErrorState({
  title = "Something went wrong",
  description,
  error,
  onRetry,
  secondary,
  compact = false,
  className,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false);
  const resolvedDescription =
    description ??
    extractMessage(error) ??
    "Please try again in a moment.";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col items-center text-center",
        compact ? "py-6" : "py-10",
        "rounded-2xl border border-red-200 bg-red-50/60 dark:border-red-900/60 dark:bg-red-950/30",
        "px-4",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "mb-3 flex items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
          compact ? "h-9 w-9" : "h-12 w-12",
        )}
      >
        <AlertTriangle className={compact ? "h-4 w-4" : "h-6 w-6"} />
      </div>
      <h3
        className={cn(
          "font-semibold text-red-900 dark:text-red-200",
          compact ? "text-sm" : "text-base",
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "mt-1 max-w-md text-red-800/80 dark:text-red-200/80",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {resolvedDescription}
      </p>

      {(onRetry || secondary) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry} icon={<RefreshCw className="h-3.5 w-3.5" />}>
              Try again
            </Button>
          )}
          {secondary}
        </div>
      )}

      {error != null && (
        <div className="mt-3 w-full max-w-md">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700/70 hover:text-red-800 dark:text-red-300/70 dark:hover:text-red-200"
            aria-expanded={showDetails}
          >
            <ChevronDown
              className={cn("h-3 w-3 transition-transform", showDetails && "rotate-180")}
            />
            {showDetails ? "Hide" : "Show"} technical details
          </button>
          {showDetails && (
            <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-red-100/60 px-2 py-1.5 text-left text-[11px] text-red-900/80 dark:bg-red-900/40 dark:text-red-200/80">
              {stringifyDetails(error)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

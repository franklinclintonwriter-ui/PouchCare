/**
 * Date + relative-time helpers for the client portal.
 *
 * Kept intentionally tiny — no dayjs / date-fns dependency — since the portal
 * only needs a "minutes / hours / days / weeks ago" caption. Absolute
 * formatting lives in `lib/format.ts`.
 */

/**
 * Format a date (ISO string, ms number, or `Date`) as a short relative
 * distance like "just now", "3m ago", "2h ago", "5d ago", "3w ago".
 * Returns `"—"` for null / invalid input.
 */
export function timeAgo(input: string | number | Date | null | undefined): string {
  if (input === null || input === undefined) return "—";
  const d = input instanceof Date ? input : new Date(input);
  const ms = d.getTime();
  if (Number.isNaN(ms)) return "—";

  const diffMs = Date.now() - ms;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWk = Math.floor(diffDay / 7);
  if (diffWk < 5) return `${diffWk}w ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  const diffYr = Math.floor(diffDay / 365);
  return `${diffYr}y ago`;
}

/**
 * Bucket label for grouping notifications / activity feeds by time.
 * Returns `"Today"`, `"Yesterday"`, `"Last 7 days"`, `"Last 30 days"`,
 * or a `YYYY-MM` string (e.g. `"2026-03"`) for anything older.
 */
export function dayBucket(input: string | number | Date | null | undefined): string {
  if (input === null || input === undefined) return "Unknown";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "Unknown";

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const diffMs = startOfToday.getTime() - d.getTime();
  const diffDay = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (d.getTime() >= startOfToday.getTime()) return "Today";
  if (diffDay === 0) return "Yesterday";
  if (diffDay <= 7) return "Last 7 days";
  if (diffDay <= 30) return "Last 30 days";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

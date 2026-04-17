/** Shared number formatting for tables, KPIs, and portal views. */

export type CurrencyCode = 'USD' | 'BDT';

/**
 * Format a number as currency.
 * @param n - The amount to format
 * @param currency - Currency code ('USD' or 'BDT'). Defaults to 'USD'.
 */
export function formatCurrency(n: number | null | undefined, currency: CurrencyCode = 'USD') {
  if (n == null) return '—';
  const locale = currency === 'BDT' ? 'en-BD' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === 'BDT' ? 0 : 2,
  }).format(n);
}

/** Format as USD specifically */
export function formatUSD(n: number | null | undefined) {
  return formatCurrency(n, 'USD');
}

/** Format as BDT specifically */
export function formatBDT(n: number | null | undefined) {
  return formatCurrency(n, 'BDT');
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n);
}

/** Short relative time for notification rows (e.g. "3m ago"). */
export function formatNotificationTime(dateIso: string): string {
  const diff = Date.now() - new Date(dateIso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateIso).toLocaleDateString();
}

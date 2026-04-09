/** Shared number formatting for tables, KPIs, and portal views. */

export function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);
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

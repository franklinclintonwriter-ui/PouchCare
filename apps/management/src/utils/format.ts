import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, 'MMM d, yyyy') : '—';
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, 'MMM d, yyyy h:mm a') : '—';
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, 'h:mm a') : '—';
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '—';
}

export type CurrencyCode = 'USD' | 'BDT';

/**
 * Format a number as currency with proper locale handling.
 * @param amount - The amount to format
 * @param currency - Currency code ('USD' or 'BDT'). Defaults to 'USD'.
 */
export function formatCurrency(amount: number | null | undefined, currency: CurrencyCode = 'USD'): string {
  if (amount == null) return '—';
  const locale = currency === 'BDT' ? 'en-BD' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === 'BDT' ? 0 : 2,
  }).format(amount);
}

/** Format as USD specifically */
export function formatUSD(amount: number | null | undefined): string {
  return formatCurrency(amount, 'USD');
}

/** Format as BDT specifically */
export function formatBDT(amount: number | null | undefined): string {
  return formatCurrency(amount, 'BDT');
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatCompact(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function getInitials(name?: string | null): string {
  const value = (name ?? '').trim();
  if (!value) return '?';
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
  return initials || '?';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

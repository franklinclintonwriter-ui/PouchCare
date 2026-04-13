import { isAxiosError } from 'axios';

/** Reads API `{ success: false, error: string }` or generic Error message. */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    const msg = data?.error ?? data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
    return err.message || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

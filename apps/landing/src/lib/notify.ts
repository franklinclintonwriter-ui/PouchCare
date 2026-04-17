import { toast as sonner } from "sonner";

/** Consistent toast helpers (Sonner). */
export const notify = {
  success: (message: string) => sonner.success(message),
  error: (message: string) => sonner.error(message),
  info: (message: string) => sonner.message(message),
  loading: (message: string) => sonner.loading(message),
  dismiss: (id?: string | number) => sonner.dismiss(id),
  promise: sonner.promise,
} as const;

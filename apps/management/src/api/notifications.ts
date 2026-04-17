import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client";
import type { AppNotification } from "@/types/models";

/**
 * Backend: GET/POST/DELETE `/v1/notifications` (apps/api/src/routes/notifications/index.ts).
 * Envelope: `{ success, data, meta? }` → axios interceptor unwraps to `{ data, meta? }`.
 *
 * - GET `?page=&limit=&unread=true` — list + `meta.unreadCount`
 * - GET `/:id` — single row (uuid; must belong to JWT user)
 * - POST `/mark-read` — `{ id: uuid }` or `{ all: true }`
 * - DELETE `/` — remove all read for user
 * - DELETE `/:id` — one row (must belong to JWT user)
 */
export interface NotificationApiRow {
  id: string;
  recipientId: string;
  recipientType: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  metadata: string | null;
  createdAt: string;
}

const NOTIF_TYPES: AppNotification["type"][] = [
  "task",
  "leave",
  "ticket",
  "payment",
  "system",
  "order",
];

const NOTIFICATION_PATH_ALIASES: Record<string, string> = {
  "/dashboard": "/",
};

const ALLOWED_NOTIFICATION_PATH_PREFIXES = [
  "/",
  "/staff",
  "/tasks",
  "/projects",
  "/attendance",
  "/leave",
  "/reports",
  "/payroll",
  "/finance",
  "/crm",
  "/hr",
  "/assets",
  "/services",
  "/support",
  "/broadcast",
  "/analytics",
  "/notifications",
  "/settings",
  "/portal",
  "/admin/portal",
  "/plugins",
  "/tools",
  "/monitor",
];

const NOTIFICATION_TYPE_FALLBACK_PATHS: Record<
  AppNotification["type"],
  string
> = {
  task: "/tasks",
  leave: "/leave",
  ticket: "/support",
  payment: "/finance/invoices",
  system: "/notifications",
  order: "/admin/portal/orders",
};

function normalizeNotificationUrl(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return undefined;

  const prefixed = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const mapped = NOTIFICATION_PATH_ALIASES[prefixed] ?? prefixed;

  if (mapped === "/") return "/";

  const isAllowed = ALLOWED_NOTIFICATION_PATH_PREFIXES.some(
    (prefix) => prefix !== "/" && (mapped === prefix || mapped.startsWith(`${prefix}/`)),
  );

  return isAllowed ? mapped : "/notifications";
}

/** Maps API/Prisma notification rows to `AppNotification`. */
export function mapApiNotification(
  raw: Record<string, unknown> | NotificationApiRow,
): AppNotification {
  const r = raw as Record<string, unknown>;
  const created =
    r.createdAt ??
    r.timestamp ??
    r.created_at;
  const ts =
    typeof created === "string"
      ? created
      : created instanceof Date
        ? created.toISOString()
        : new Date(String(created)).toISOString();
  const type = String(r.type ?? "system");
  const normalizedType = (NOTIF_TYPES.includes(type as AppNotification["type"])
    ? type
    : "system") as AppNotification["type"];
  const resourceUrl = normalizeNotificationUrl(r.link ?? r.resourceUrl);
  const fallbackUrl = NOTIFICATION_TYPE_FALLBACK_PATHS[normalizedType];
  const resolvedUrl =
    normalizedType !== "system" && resourceUrl === "/" ? fallbackUrl : resourceUrl;

  return {
    id: String(r.id),
    type: normalizedType,
    title: String(r.title ?? ""),
    description: String(r.message ?? r.description ?? ""),
    timestamp: ts,
    read: Boolean(r.read),
    resourceUrl: resolvedUrl ?? fallbackUrl,
  };
}

export type NotificationsQueryData = {
  notifications: AppNotification[];
  unreadCount: number;
};

export function useNotifications() {
  return useQuery<NotificationsQueryData>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications", {
        params: { limit: 80, page: 1 },
      });
      const payload = data as {
        data?: unknown[];
        meta?: { unreadCount?: number };
      };
      const list = Array.isArray(payload?.data) ? payload.data : [];
      const notifications = list.map((row) =>
        mapApiNotification(row as Record<string, unknown>),
      );
      const unreadCount =
        typeof payload?.meta?.unreadCount === "number"
          ? payload.meta.unreadCount
          : notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
}

/** Single notification (e.g. deep link / prefetch). */
export function useNotification(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["notifications", "detail", id],
    queryFn: async () => {
      const { data } = await api.get(`/notifications/${id}`);
      return mapApiNotification(data as Record<string, unknown>);
    },
    enabled: Boolean(enabled && id),
    staleTime: 15_000,
  });
}

export function useMarkOneNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post("/notifications/mark-read", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/notifications/mark-read", { all: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useDeleteReadNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete("/notifications"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client";
import type { AppNotification } from "@/types/models";

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
  raw: Record<string, unknown>,
): AppNotification {
  const created = raw.createdAt ?? raw.timestamp;
  const ts =
    typeof created === "string"
      ? created
      : created instanceof Date
        ? created.toISOString()
        : new Date(String(created)).toISOString();
  const type = String(raw.type ?? "system");
  const normalizedType = (NOTIF_TYPES.includes(type as AppNotification["type"])
    ? type
    : "system") as AppNotification["type"];
  const resourceUrl = normalizeNotificationUrl(raw.link ?? raw.resourceUrl);
  const fallbackUrl = NOTIFICATION_TYPE_FALLBACK_PATHS[normalizedType];
  const resolvedUrl =
    normalizedType !== "system" && resourceUrl === "/" ? fallbackUrl : resourceUrl;

  return {
    id: String(raw.id),
    type: normalizedType,
    title: String(raw.title ?? ""),
    description: String(raw.message ?? raw.description ?? ""),
    timestamp: ts,
    read: Boolean(raw.read),
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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";

export interface PortalNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  createdAt: string;
}

export interface NotificationsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

interface NotificationsPayload {
  data: PortalNotification[];
  meta: NotificationsMeta;
}

export function usePortalNotifications(page = 1, limit = 15) {
  return useQuery({
    queryKey: ["portal", "notifications", page, limit],
    queryFn: async () => {
      const res = await api.get(
        `/portal/notifications?page=${page}&limit=${limit}`,
      );
      const body = res.data as unknown as NotificationsPayload;
      if (!body?.data || !body.meta) {
        return {
          items: [] as PortalNotification[],
          meta: undefined as NotificationsMeta | undefined,
          unreadCount: 0,
        };
      }
      return {
        items: body.data,
        meta: body.meta,
        unreadCount: body.meta.unreadCount ?? 0,
      };
    },
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: { all?: boolean; id?: string }) => {
      await api.post("/portal/notifications/mark-read", opts);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal", "notifications"] });
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post("/portal/notifications/mark-read", { id });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal", "notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/portal/notifications/mark-read", { all: true });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal", "notifications"] });
    },
  });
}

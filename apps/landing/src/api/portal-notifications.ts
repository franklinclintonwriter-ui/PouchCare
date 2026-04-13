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

interface NotificationsPayload {
  data: PortalNotification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
  };
}

export function usePortalNotifications(page = 1, limit = 15) {
  return useQuery({
    queryKey: ["portal", "notifications", page, limit],
    queryFn: async () => {
      const res = await api.get(`/notifications?page=${page}&limit=${limit}`);
      const body = res.data as unknown as NotificationsPayload;
      if (!body?.data || !body.meta) {
        return {
          items: [] as PortalNotification[],
          unreadCount: 0,
        };
      }
      return {
        items: body.data,
        unreadCount: body.meta.unreadCount ?? 0,
      };
    },
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: { all?: boolean; id?: string }) => {
      await api.post("/notifications/mark-read", opts);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal", "notifications"] });
    },
  });
}

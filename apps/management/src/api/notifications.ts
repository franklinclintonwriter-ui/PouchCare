import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { AppNotification } from '@/types/models';

export function useNotifications(unreadOnly?: boolean) {
  return useQuery<AppNotification[]>({
    queryKey: ['notifications', unreadOnly],
    queryFn: async () => {
      const { data } = await api.get('/notifications', { params: unreadOnly ? { unread: true } : undefined });
      const result = data.notifications ?? data.data ?? data;
      return Array.isArray(result) ? result : [];
    },
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.post('/notifications/mark-read', { ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { Broadcast } from '@/types/models';

export function useBroadcasts(status?: string) {
  return useQuery<Broadcast[]>({
    queryKey: ['broadcasts', status],
    queryFn: async () => {
      const { data } = await api.get('/broadcast', { params: status ? { status } : undefined });
      return Array.isArray(data) ? data : data.data ?? [];
    },
  });
}

export function useCreateBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; message: string; audience: string; channel: string; isUrgent?: boolean }) =>
      api.post('/broadcast', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['broadcasts'] }),
  });
}

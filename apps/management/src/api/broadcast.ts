import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { Broadcast } from '@/types/models';
import type { PaginatedResponse, PaginationParams, BroadcastDeliverySummary } from '@/types/api';

export type BroadcastListParams = PaginationParams & { channel?: string; audience?: string };

export type BroadcastCreateResult = {
  broadcast: Broadcast;
  delivery?: BroadcastDeliverySummary;
};

function parseBroadcastCreateResponse(payload: unknown): BroadcastCreateResult {
  if (payload && typeof payload === 'object' && 'meta' in payload && 'data' in payload) {
    const p = payload as { data: Broadcast; meta?: { delivery?: BroadcastDeliverySummary } };
    return { broadcast: p.data, delivery: p.meta?.delivery };
  }
  if (payload && typeof payload === 'object' && 'id' in payload && 'title' in payload) {
    return { broadcast: payload as Broadcast };
  }
  throw new Error('Unexpected broadcast create response');
}

export function useBroadcasts(params?: BroadcastListParams) {
  return useQuery<PaginatedResponse<Broadcast>>({
    queryKey: ['broadcasts', params],
    queryFn: async () => {
      const { data } = await api.get('/broadcast', { params });
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const meta = (data as { meta?: PaginatedResponse<Broadcast>['meta'] })?.meta;
      const limit = params?.limit ?? 20;
      const page = params?.page ?? 1;
      return {
        data: rows as Broadcast[],
        meta: meta ?? {
          total: rows.length,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(rows.length / limit)),
        },
      };
    },
  });
}

export function useCreateBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      title: string;
      message: string;
      audience: string;
      channel: string;
      isUrgent?: boolean;
    }) => {
      const res = await api.post('/broadcast', body);
      return parseBroadcastCreateResponse(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['broadcasts'] }),
  });
}

export function useDeleteBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/broadcast/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['broadcasts'] }),
  });
}

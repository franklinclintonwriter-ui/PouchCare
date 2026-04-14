import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './client';

export type VigiIntegrationDto = {
  id: string;
  branchId: string;
  host: string;
  port: number;
  username: string;
  hasPassword: boolean;
  tlsAllowInsecure: boolean;
  enabled: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  updatedAt: string;
};

export function useVigiIntegration(branchId: string | undefined) {
  return useQuery<VigiIntegrationDto | null>({
    queryKey: ['vigi-integration', branchId],
    enabled: !!branchId,
    queryFn: async () => {
      const { data } = await api.get<VigiIntegrationDto | null>(`/assets/vigi/branches/${branchId}`);
      return data ?? null;
    },
  });
}

export function useVigiUpsert(branchId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      host: string;
      port?: number;
      username?: string;
      password?: string;
      tlsAllowInsecure?: boolean;
      enabled?: boolean;
    }) => {
      const { data } = await api.put(`/assets/vigi/branches/${branchId}`, body);
      return data as VigiIntegrationDto;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vigi-integration', branchId] });
    },
  });
}

export function useVigiTest() {
  return useMutation({
    mutationFn: async (body: {
      host: string;
      port?: number;
      username?: string;
      password: string;
      tlsAllowInsecure?: boolean;
    }) => {
      const { data } = await api.post<{ deviceCount?: number; sample?: unknown[] }>(
        '/assets/vigi/test',
        body,
      );
      return data;
    },
  });
}

/** Test using stored credentials (after integration is saved). */
export function useVigiTestSaved(branchId: string | undefined) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ deviceCount?: number; sample?: unknown[] }>(
        `/assets/vigi/branches/${branchId}/test`,
      );
      return data;
    },
  });
}

export function useVigiSync(branchId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{
        created: number;
        updated: number;
        totalFromNvr: number;
        branchId: string;
      }>(`/assets/vigi/branches/${branchId}/sync`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cameras'] });
      qc.invalidateQueries({ queryKey: ['monitor-summary'] });
      qc.invalidateQueries({ queryKey: ['vigi-integration', branchId] });
    },
  });
}

export function useVigiDelete(branchId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/assets/vigi/branches/${branchId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vigi-integration', branchId] });
      qc.invalidateQueries({ queryKey: ['cameras'] });
      qc.invalidateQueries({ queryKey: ['monitor-summary'] });
    },
  });
}

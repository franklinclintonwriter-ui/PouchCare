import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import { getAccessToken } from '@/utils/storage';
import type { BacklinkRow, KeywordMetric, SerpResultRow } from '@/features/tools/types';

export interface ToolsStatus {
  serpApi: boolean;
  openPageRank: boolean;
  dataForSeo: boolean;
}

export function useToolsStatus() {
  return useQuery({
    queryKey: ['tools', 'status'],
    queryFn: async () => {
      const { data } = await api.get<ToolsStatus>('/tools/status');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useToolRuns(limit = 30) {
  return useQuery({
    queryKey: ['tools', 'runs', limit],
    queryFn: async () => {
      const { data } = await api.get<
        Array<{ id: string; toolType: string; queryLabel: string; createdAt: string }>
      >(`/tools/runs?limit=${limit}`);
      return data;
    },
  });
}

export function useSerpTop100() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { keyword: string; hl: string; gl: string; num?: number }) => {
      const { data } = await api.post<{ results: SerpResultRow[]; provider: string }>(
        '/tools/serp',
        payload,
        { timeout: 120_000 },
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tools', 'runs'] });
    },
  });
}

export function useDomainMetrics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { domainA: string; domainB?: string }) => {
      const { data } = await api.post<{
        domains: Array<{ domain: string; rank: number; rankInteger: number }>;
        provider: string;
        label: string;
      }>('/tools/domain-metrics', payload, { timeout: 60_000 });
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tools', 'runs'] });
    },
  });
}

export function useBacklinksCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targetUrl: string) => {
      const { data } = await api.post<{ rows: BacklinkRow[]; provider: string }>(
        '/tools/backlinks',
        { targetUrl },
        { timeout: 120_000 },
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tools', 'runs'] });
    },
  });
}

export function useKeywordsResearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (seed: string) => {
      const { data } = await api.post<{ rows: KeywordMetric[]; provider: string }>(
        '/tools/keywords',
        { seed },
        { timeout: 120_000 },
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tools', 'runs'] });
    },
  });
}

/** Upload image and download favicon ZIP (binary). Uses fetch so axios JSON unwrap does not apply. */
export async function downloadFaviconZip(file: File): Promise<Blob> {
  const token = getAccessToken();
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch(`${window.location.origin}/v1/tools/favicon-zip`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { error?: string }).error || res.statusText || 'Favicon export failed';
    throw new Error(msg);
  }
  return res.blob();
}

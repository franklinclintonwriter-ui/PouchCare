import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';

export type ServiceHealth = 'healthy' | 'degraded' | 'down';

export interface SystemStatusPayload {
  collectedAt: string;
  host: {
    uptimeSec: number;
    platform: string;
    hostname: string;
    timezone: string;
    cpuCores: number;
    loadAvg: [number, number, number];
    memoryTotalBytes: number;
    memoryUsedBytes: number;
    memoryUsedPercent: number;
    disk: {
      available: boolean;
      totalBytes?: number;
      usedBytes?: number;
      usedPercent?: number;
      mount?: string;
      reason?: string;
    };
  };
  process: {
    uptimeSec: number;
    pid: number;
    nodeVersion: string;
    memoryRssBytes: number;
    memoryHeapUsedBytes: number;
    memoryHeapTotalBytes: number;
  };
  services: {
    api: { status: ServiceHealth; port: number; nodeEnv: string; version: string };
    postgres: { status: ServiceHealth; latencyMs: number | null; error?: string };
    redis: { status: ServiceHealth; latencyMs: number | null; error?: string };
    storage: { status: ServiceHealth; mode: 'r2' | 'local' | 'unconfigured'; bucket?: string };
    websocket: { status: ServiceHealth; path: string };
  };
  jobs: Array<{ id: string; schedule: string; label: string }>;
  runtime: { allowedOriginsCount: number; inDocker: boolean };
  build: { version: string; gitSha: string; buildTime: string };
}

export function useSystemStatus() {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      const res = await api.get<SystemStatusPayload>('/v1/admin/system-status');
      return res.data;
    },
    refetchInterval: 30_000,
  });
}

export function useClearSystemCache() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/v1/admin/system-status/clear-cache');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-status'] });
      qc.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
}

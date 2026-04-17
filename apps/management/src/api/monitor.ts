/**
 * Camera / monitor devices (staff). Not the portal customer “websites” product surface.
 */
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { PaginatedResponse, QueryParams } from '@/types/api';

// ── Types ──────────────────────────────────────────────────

export interface CameraDevice {
  id: string;
  branchId: string;
  branchName?: string | null;
  label: string;
  location?: string | null;
  ipAddress?: string | null;
  streamUrl?: string | null;
  rtspUrl?: string | null;
  status: 'online' | 'offline' | 'recording';
  resolution?: string | null;
  fps?: number | null;
  angle?: string | null;
  hasAudio: boolean;
  hasMotionDetect: boolean;
  nvrDevice?: string | null;
  /** manual | vigi */
  source?: string | null;
  vigiChannel?: number | null;
  lastPingAt?: string | null;
  lastMotionAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonitorBranchRow {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  address: string | null;
  totalCameras: number;
  onlineCameras: number;
  offlineCameras: number;
  recordingCameras: number;
  status: 'online' | 'partial' | 'offline';
}

export interface MonitorSummaryInsights {
  manualCameras: number;
  vigiCameras: number;
  vigiNvrIntegrations: number;
  motionEventsLast24h: number;
  lastMotionAt: string | null;
  lastPingAt: string | null;
  /** Non-offline cameras with no ping or ping older than 7 days */
  onlineButStalePing: number;
}

export interface MonitorSummaryAlerts {
  branchesNeedingAttention: Array<{
    branchId: string;
    name: string;
    offlineCount: number;
    totalCameras: number;
  }>;
  alertCount: number;
}

export interface MonitorSummaryPayload {
  totals: {
    totalCameras: number;
    onlineCameras: number;
    recordingCameras: number;
    offlineCameras: number;
    totalBranches: number;
    onlineBranches: number;
  };
  branches: MonitorBranchRow[];
  insights?: MonitorSummaryInsights;
  alerts?: MonitorSummaryAlerts;
}

export type CreateCameraPayload = {
  branchId: string;
  branchName?: string;
  label: string;
  location?: string;
  ipAddress?: string;
  streamUrl?: string;
  rtspUrl?: string;
  status?: string;
  resolution?: string;
  fps?: number;
  angle?: string;
  hasAudio?: boolean;
  hasMotionDetect?: boolean;
  nvrDevice?: string;
  notes?: string;
};

// ── Query hooks ────────────────────────────────────────────

export function useMonitorSummary(options?: { refetchInterval?: number | false }) {
  return useQuery<MonitorSummaryPayload>({
    queryKey: ['monitor-summary'],
    queryFn: async () => {
      const res = await api.get<MonitorSummaryPayload>('/assets/cameras/summary');
      return res.data as MonitorSummaryPayload;
    },
    refetchInterval: options?.refetchInterval ?? false,
    staleTime: options?.refetchInterval ? 20_000 : 60_000,
  });
}

export function useCameras(params?: QueryParams & { branchId?: string }) {
  return useQuery<PaginatedResponse<CameraDevice>>({
    queryKey: ['cameras', params],
    queryFn: async () => {
      const { data } = await api.get('/assets/cameras', { params });
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const meta = data?.meta ?? { total: rows.length, page: 1, limit: 100, totalPages: 1 };
      return { data: rows as CameraDevice[], meta };
    },
  });
}

export function useCamera(id: string | undefined) {
  return useQuery<CameraDevice>({
    queryKey: ['camera', id],
    queryFn: async () => {
      const { data } = await api.get(`/assets/cameras/${id}`);
      return data as CameraDevice;
    },
    enabled: !!id,
  });
}

export type CamerasByBranchParams = {
  q?: string;
  source?: 'manual' | 'vigi';
  sort?: 'label_asc' | 'label_desc' | 'status' | 'updated_desc' | 'updated_asc';
  /** Exact status match (ignored if excludeOffline is true). */
  status?: 'online' | 'recording' | 'offline';
  /** When true, returns only cameras that are not offline (online + recording). */
  excludeOffline?: boolean;
  limit?: number;
};

export function useCamerasByBranch(
  branchId: string | undefined,
  params?: CamerasByBranchParams,
) {
  return useQuery<PaginatedResponse<CameraDevice>>({
    queryKey: ['cameras', { branchId, ...params }],
    queryFn: async () => {
      const lim = params?.limit ?? 500;
      const { data } = await api.get('/assets/cameras', {
        params: {
          branchId,
          limit: lim,
          page: 1,
          ...(params?.q?.trim() ? { q: params.q.trim() } : {}),
          ...(params?.source ? { source: params.source } : {}),
          ...(params?.sort ? { sort: params.sort } : {}),
          ...(params?.excludeOffline ? { excludeOffline: 'true' } : {}),
          ...(params?.status && !params?.excludeOffline ? { status: params.status } : {}),
        },
      });
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const meta = data?.meta ?? { total: rows.length, page: 1, limit: lim, totalPages: 1 };
      return { data: rows as CameraDevice[], meta };
    },
    enabled: !!branchId,
  });
}

// ── Mutation hooks ─────────────────────────────────────────

function invalidateCameraQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['cameras'] });
  qc.invalidateQueries({ queryKey: ['monitor-summary'] });
  qc.invalidateQueries({ queryKey: ['camera-stream-urls'] });
}

export function useCreateCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCameraPayload) => api.post('/assets/cameras', body),
    onSuccess: () => invalidateCameraQueries(qc),
  });
}

export function useUpdateCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<CreateCameraPayload> & { id: string }) =>
      api.put(`/assets/cameras/${id}`, body),
    onSuccess: (_, v) => {
      invalidateCameraQueries(qc);
      qc.invalidateQueries({ queryKey: ['camera', v.id] });
    },
  });
}

export function useDeleteCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/assets/cameras/${id}`),
    onSuccess: (_, id) => {
      invalidateCameraQueries(qc);
      qc.removeQueries({ queryKey: ['camera', id] });
    },
  });
}

export function useUpdateCameraStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/assets/cameras/${id}/status`, { status }),
    onSuccess: (_, v) => {
      invalidateCameraQueries(qc);
      qc.invalidateQueries({ queryKey: ['camera', v.id] });
    },
  });
}

/** Updates `lastPingAt` — use after verifying a feed is reachable. */
export function useCameraPing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/assets/cameras/${id}/ping`),
    onSuccess: (_, id) => {
      invalidateCameraQueries(qc);
      qc.invalidateQueries({ queryKey: ['camera', id] });
    },
  });
}

/** Download CSV using the same filters as the camera list (server-side, up to API cap). */
export async function downloadCamerasExport(
  params: { branchId: string } & Omit<CamerasByBranchParams, 'limit'>,
) {
  const sp = new URLSearchParams({ branchId: params.branchId });
  if (params.q?.trim()) sp.set('q', params.q.trim());
  if (params.source) sp.set('source', params.source);
  if (params.sort) sp.set('sort', params.sort);
  if (params.excludeOffline) sp.set('excludeOffline', 'true');
  if (params.status && !params.excludeOffline) sp.set('status', params.status);
  const res = await api.get(`/assets/cameras/export?${sp.toString()}`, {
    responseType: 'blob',
  });
  const blob = res.data as Blob;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cameras-${params.branchId.slice(0, 8)}.csv`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── VIGI / NVR stream URLs (RTSP templates + optional HLS on camera) ──

export type CameraStreamUrlsVigi = {
  mode: 'vigi';
  branchId: string;
  channel: number;
  nvrHost: string;
  openApiPort: number;
  /** https://host:port/ — NVR web UI (same TLS as OpenAPI; often self-signed on LAN) */
  nvrHttpsUrl: string;
  rtspPort: number;
  liveMain: string;
  liveSub: string;
  nvrWebUiHint: string;
  storedRtspUrl: string | null;
  storedStreamUrl: string | null;
  playbackNote: string;
};

export type CameraStreamUrlsManual = {
  mode: 'manual';
  branchId: string;
  liveRtsp: string | null;
  streamUrl: string | null;
  hint: string;
};

export type CameraStreamUrls = CameraStreamUrlsVigi | CameraStreamUrlsManual;

export function useCameraStreamUrls(cameraId: string | undefined) {
  return useQuery<CameraStreamUrls>({
    queryKey: ['camera-stream-urls', cameraId],
    queryFn: async () => {
      const { data } = await api.get<CameraStreamUrls>(`/assets/cameras/${cameraId}/stream-urls`);
      return data as CameraStreamUrls;
    },
    enabled: !!cameraId,
    refetchInterval: 12_000,
    staleTime: 8_000,
    retry: 2,
  });
}

/**
 * Polls the API snapshot proxy (VIGI NVR JPEG over HTTPS). Disabled when `enabled` is false.
 * Revokes object URLs on cleanup.
 */
export function useCameraVigiSnapshotPreview(enabled: boolean, cameraId: string | undefined) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [snapshotErr, setSnapshotErr] = useState<string | null>(null);
  /** true once we stop polling because too many consecutive failures */
  const [snapshotGaveUp, setSnapshotGaveUp] = useState(false);

  useEffect(() => {
    if (!enabled || !cameraId) {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setSnapshotErr(null);
      setSnapshotGaveUp(false);
      return;
    }

    let cancelled = false;
    let consecutiveFails = 0;
    const MAX_CONSECUTIVE_FAILS = 5;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      try {
        const { data } = await api.get(`/assets/cameras/${cameraId}/snapshot`, {
          responseType: 'blob',
          timeout: 20_000,
        });
        if (cancelled) return;
        consecutiveFails = 0;
        const url = URL.createObjectURL(data as Blob);
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setSnapshotErr(null);
        setSnapshotGaveUp(false);
      } catch (e: unknown) {
        if (cancelled) return;
        consecutiveFails++;
        const errMsg = e instanceof Error ? e.message : 'Snapshot unavailable';
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        if (consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
          setSnapshotErr(
            `Snapshot unreachable after ${MAX_CONSECUTIVE_FAILS} attempts. The API server may not be able to reach the NVR on ports 443/8443. ` + errMsg,
          );
          setSnapshotGaveUp(true);
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        } else {
          setSnapshotErr(errMsg);
        }
      }
    };

    tick();
    intervalId = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [enabled, cameraId]);

  return { blobUrl, snapshotErr, snapshotGaveUp };
}

export type CameraExportWindowResult = {
  replayRtsp: string;
  channel: number;
  nvrHost: string;
  start: string;
  end: string;
  durationMinutes: number;
  stream: 1 | 2;
  filenameSuggestion: string;
  exportHint: string;
};

export function useCameraExportWindow() {
  return useMutation({
    mutationFn: async (p: {
      cameraId: string;
      start: string;
      end: string;
      stream?: 1 | 2;
    }) => {
      const { data } = await api.post<CameraExportWindowResult>(
        `/assets/cameras/${p.cameraId}/export-window`,
        { start: p.start, end: p.end, stream: p.stream ?? 1 },
      );
      return data;
    },
  });
}

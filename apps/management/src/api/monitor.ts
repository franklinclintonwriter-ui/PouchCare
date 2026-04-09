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

export function useMonitorSummary() {
  return useQuery<MonitorSummaryPayload>({
    queryKey: ['monitor-summary'],
    queryFn: async () => {
      const res = await api.get<MonitorSummaryPayload>('/assets/cameras/summary');
      return res.data as MonitorSummaryPayload;
    },
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

export function useCamerasByBranch(branchId: string | undefined) {
  return useQuery<PaginatedResponse<CameraDevice>>({
    queryKey: ['cameras', { branchId }],
    queryFn: async () => {
      const { data } = await api.get('/assets/cameras', { params: { branchId, limit: 100 } });
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const meta = data?.meta ?? { total: rows.length, page: 1, limit: 100, totalPages: 1 };
      return { data: rows as CameraDevice[], meta };
    },
    enabled: !!branchId,
  });
}

// ── Mutation hooks ─────────────────────────────────────────

function invalidateCameraQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['cameras'] });
  qc.invalidateQueries({ queryKey: ['monitor-summary'] });
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

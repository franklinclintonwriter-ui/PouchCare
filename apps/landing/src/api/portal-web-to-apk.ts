import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";

export type ApkJobStatus =
  | "queued"
  | "processing"
  | "ready"
  | "failed"
  | "expired";

export interface ApkJob {
  id: string;
  appName: string;
  url: string;
  plan: string;
  status: ApkJobStatus;
  createdAt: string;
  completedAt: string | null;
  apkSizeMb: number | null;
  downloadUrl: string | null;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function unwrapPaginated<T>(res: {
  data: { data: T[]; meta: PaginatedMeta };
}): {
  items: T[];
  meta: PaginatedMeta;
} {
  const d = res.data as { data: T[]; meta: PaginatedMeta };
  return { items: d.data, meta: d.meta };
}

export function useApkJobs(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["portal", "web-to-apk", "jobs", page, limit],
    queryFn: async () => {
      const res = await api.get(
        `/portal/web-to-apk/jobs?page=${page}&limit=${limit}`,
      );
      return unwrapPaginated<ApkJob>(res as never);
    },
  });
}

export function useCreateApkJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      appName: string;
      url: string;
      plan: string;
    }) => {
      const res = await api.post("/portal/web-to-apk/jobs", body);
      return res.data as unknown as ApkJob;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal", "web-to-apk", "jobs"] });
    },
  });
}

export function useApkJob(id: string | undefined) {
  return useQuery({
    queryKey: ["portal", "web-to-apk", "job", id],
    queryFn: async () => {
      const res = await api.get<ApkJob>(`/portal/web-to-apk/jobs/${id}`);
      return res.data as unknown as ApkJob;
    },
    enabled: !!id,
    // Poll every 5 seconds while queued or processing
    refetchInterval: (query) => {
      const data = query.state.data as ApkJob | undefined;
      if (data && (data.status === "queued" || data.status === "processing")) {
        return 5000;
      }
      return false;
    },
  });
}

export function useDeleteApkJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/portal/web-to-apk/jobs/${id}`);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["portal", "web-to-apk", "jobs"],
      });
    },
  });
}

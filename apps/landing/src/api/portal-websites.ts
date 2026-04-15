import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import type { PaginatedMeta } from "@/types/portalDashboard";

export type WebsiteStatus = "online" | "degraded" | "offline" | "maintenance";

export interface WebsiteAnalytics {
  visitorsMonth: number;
  pageviewsMonth: number;
  bounceRate: number;
  avgSessionSec: number;
}

export interface PortalWebsite {
  id: string;
  name: string;
  url: string;
  fqdn: string;
  status: WebsiteStatus;
  seoScore: number;
  uptimePct: number;
  sslValid: boolean;
  sslExpiresAt: string;
  techStack: string[];
  analytics: WebsiteAnalytics;
  lastChecked: string;
  hostingPlan: string | null;
  linkedDomainId: string | null;
  type?: string;
  platform?: string;
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

export function usePortalWebsites(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["portal", "websites", page, limit],
    queryFn: async () => {
      const res = await api.get(`/portal/websites?page=${page}&limit=${limit}`);
      return unwrapPaginated<PortalWebsite>(res as never);
    },
  });
}

export function usePortalWebsite(id: string | undefined) {
  return useQuery({
    queryKey: ["portal", "websites", id],
    queryFn: async () => {
      const res = await api.get<PortalWebsite>(`/portal/websites/${id}`);
      return res.data as unknown as PortalWebsite;
    },
    enabled: !!id,
  });
}

export function useCreateWebsite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      url: string;
      type?: string;
      platform?: string;
    }) => {
      const res = await api.post("/portal/websites", data);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal", "websites"] });
    },
  });
}

export function useUpdateWebsite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      url?: string;
      type?: string;
      platform?: string;
    }) => {
      const res = await api.patch(`/portal/websites/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal", "websites"] });
    },
  });
}

export function useDeleteWebsite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/portal/websites/${id}`);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal", "websites"] });
    },
  });
}

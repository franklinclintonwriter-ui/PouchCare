import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";

export interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  ip: string;
  lastSeen: string;
  isCurrent: boolean;
}

export interface LoginEntry {
  id: string;
  timestamp: string;
  ip: string;
  device: string;
  browser: string;
  location: string;
  status: "success" | "failed" | "blocked";
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  orderUpdates: boolean;
  billingAlerts: boolean;
  systemAlerts: boolean;
  newFeatures: boolean;
  marketingEmails: boolean;
  smsAlerts: boolean;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function unwrapPaginated<T>(res: { data: { data: T[]; meta: PaginatedMeta } }): {
  items: T[];
  meta: PaginatedMeta;
} {
  const d = res.data as { data: T[]; meta: PaginatedMeta };
  return { items: d.data, meta: d.meta };
}

export function useSessions() {
  return useQuery({
    queryKey: ["portal", "sessions"],
    queryFn: async () => {
      const res = await api.get<Session[]>("/v1/portal/sessions");
      return (res.data as unknown) as Session[];
    },
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await api.delete(`/v1/portal/sessions/${sessionId}`);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal", "sessions"] });
    },
  });
}

export function useRevokeAllSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.delete("/v1/portal/sessions");
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal", "sessions"] });
    },
  });
}

export function useLoginHistory(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["portal", "login-history", page, limit],
    queryFn: async () => {
      const res = await api.get(
        `/v1/portal/login-history?page=${page}&limit=${limit}`,
      );
      return unwrapPaginated<LoginEntry>(res as never);
    },
  });
}

export function useSecuritySettings() {
  return useQuery({
    queryKey: ["portal", "security-settings"],
    queryFn: async () => {
      const res = await api.get<SecuritySettings>("/v1/portal/settings");
      return res.data as unknown as SecuritySettings;
    },
  });
}

export function useUpdateSecuritySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<SecuritySettings>) => {
      const res = await api.patch<SecuritySettings>("/v1/portal/settings", body);
      return res.data as unknown as SecuritySettings;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal", "security-settings"] });
    },
  });
}

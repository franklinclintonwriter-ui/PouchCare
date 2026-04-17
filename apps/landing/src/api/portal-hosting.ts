/**
 * Client portal (landing app): customer **"My domains" / hosting** — `/v1/portal/hosting/*`.
 * Not the staff Management assets screen (`/v1/assets/domains`).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import type { PaginatedMeta } from "@/types/portalDashboard";

export type DomainStatus = "active" | "pending" | "expired" | "suspended";

export interface DnsRecord {
  id: string;
  type: string;
  name: string;
  value: string;
  ttl: number;
}

export interface HostingDomain {
  id: string;
  fqdn: string;
  status: DomainStatus;
  planName: string;
  registrar: string;
  registeredAt: string;
  expiresAt: string;
  sslIssuer: string;
  sslExpiresAt: string;
  autoRenew: boolean;
  nameservers: string[];
  dnsRecords: DnsRecord[];
  monthlyPriceUsd: number;
  bandwidthGb: { used: number; limit: number };
  storageGb: { used: number; limit: number };
  uptimePct: number;
  notes?: string;
}

export interface DomainSearchResult {
  fqdn: string;
  available: boolean;
  pricePerYearUsd: number;
  tld: string;
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

export function usePortalDomains(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["portal", "hosting", "domains", page, limit],
    queryFn: async () => {
      const res = await api.get(
        `/portal/hosting/domains?page=${page}&limit=${limit}`,
      );
      return unwrapPaginated<HostingDomain>(res as never);
    },
    staleTime: 60_000,
  });
}

export function usePortalDomain(id: string | undefined) {
  return useQuery({
    queryKey: ["portal", "hosting", "domains", id],
    queryFn: async () => {
      const res = await api.get<HostingDomain>(`/portal/hosting/domains/${id}`);
      return res.data as unknown as HostingDomain;
    },
    enabled: !!id,
  });
}

export function useSearchDomains(query: string) {
  return useQuery({
    queryKey: ["portal", "hosting", "search", query],
    queryFn: async () => {
      const res = await api.get<DomainSearchResult[]>(
        `/portal/hosting/search?q=${encodeURIComponent(query)}`,
      );
      return res.data as unknown as DomainSearchResult[];
    },
    enabled: query.length >= 2,
  });
}

/**
 * Public domain search — works without authentication.
 * Uses the same backend endpoint (now public) but through the shared api client.
 */
export function usePublicDomainSearch(query: string) {
  return useQuery({
    queryKey: ["public", "hosting", "search", query],
    queryFn: async () => {
      const res = await api.get<DomainSearchResult[]>(
        `/portal/hosting/search?q=${encodeURIComponent(query)}`,
      );
      return res.data as unknown as DomainSearchResult[];
    },
    enabled: query.length >= 2,
    staleTime: 60_000,
  });
}

export function useRegisterDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      fqdn: string;
      planId: string;
      planName: string;
      monthlyUsd: number;
    }) => {
      const res = await api.post("/portal/hosting/domains", body);
      return res.data as unknown as HostingDomain;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["portal", "hosting", "domains"],
      });
    },
  });
}

export function useUpdateDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      id: string;
      autoRenew?: boolean;
      notes?: string;
      nameservers?: string[];
    }) => {
      const { id, ...patch } = body;
      const res = await api.patch(`/portal/hosting/domains/${id}`, patch);
      return res.data as unknown as HostingDomain;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({
        queryKey: ["portal", "hosting", "domains"],
      });
      void qc.invalidateQueries({
        queryKey: ["portal", "hosting", "domains", data.id],
      });
    },
  });
}

export function useDeleteDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/portal/hosting/domains/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["portal", "hosting", "domains"],
      });
    },
  });
}

export function useAddDnsRecord(domainId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      type: string;
      name: string;
      value: string;
      ttl: number;
    }) => {
      const res = await api.post(
        `/portal/hosting/domains/${domainId}/dns`,
        body,
      );
      return res.data as unknown as DnsRecord;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["portal", "hosting", "domains", domainId],
      });
    },
  });
}

export function useUpdateDnsRecord(domainId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      recordId: string;
      type: string;
      name: string;
      value: string;
      ttl: number;
    }) => {
      const { recordId, ...patch } = body;
      const res = await api.patch(
        `/portal/hosting/domains/${domainId}/dns/${recordId}`,
        patch,
      );
      return res.data as unknown as DnsRecord;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["portal", "hosting", "domains", domainId],
      });
    },
  });
}

export function useDeleteDnsRecord(domainId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recordId: string) => {
      await api.delete(`/portal/hosting/domains/${domainId}/dns/${recordId}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["portal", "hosting", "domains", domainId],
      });
    },
  });
}

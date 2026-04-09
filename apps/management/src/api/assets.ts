import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { QueryParams, PaginatedResponse } from '@/types/api';
import type { Domain, ServerAsset, WebsiteAsset } from '@/types/models';

type RawDomain = {
  id: string;
  domainName?: string;
  registrar?: string | null;
  expiryDate?: string | null;
  status?: string | null;
  annualRenewalCost?: number | null;
  hostingServer?: string | null;
};

type RawServer = {
  id: string;
  name: string;
  provider?: string | null;
  type?: string | null;
  status?: string | null;
  ipAddress?: string | null;
  ramGb?: number | null;
  storageGb?: number | null;
  monthlyCostUsd?: number | null;
};

type RawWebsite = {
  id: string;
  name: string;
  url?: string | null;
  hostedOn?: string | null;
  domainLinked?: string | null;
  status?: string | null;
  monthlyTraffic?: number | null;
  lastUpdated?: string | null;
};

function normalizeDomainStatus(value?: string | null): Domain['status'] {
  const s = (value ?? '').toLowerCase();
  if (s === 'expired') return 'expired';
  if (s === 'transferred') return 'transferred';
  return 'active';
}

function mapDomain(raw: RawDomain): Domain {
  return {
    id: raw.id,
    domain: raw.domainName ?? '',
    registrar: raw.registrar ?? 'Unknown',
    expiryDate: raw.expiryDate ?? new Date().toISOString(),
    autoRenew: true,
    status: normalizeDomainStatus(raw.status),
    dnsProvider: raw.hostingServer ?? 'Unknown',
    annualCost: raw.annualRenewalCost ?? 0,
  };
}

function normalizeServerStatus(value?: string | null): ServerAsset['status'] {
  const s = (value ?? '').toLowerCase();
  if (s === 'offline' || s === 'down') return 'offline';
  if (s === 'maintenance') return 'maintenance';
  return 'online';
}

function mapServer(raw: RawServer): ServerAsset {
  return {
    id: raw.id,
    name: raw.name,
    provider: raw.provider ?? 'Unknown',
    ip: raw.ipAddress ?? '-',
    specs: {
      cpu: raw.type ?? 'N/A',
      ram: `${raw.ramGb ?? 0} GB`,
      disk: `${raw.storageGb ?? 0} GB`,
    },
    usage: { cpu: 0, ram: 0, disk: 0 },
    status: normalizeServerStatus(raw.status),
    uptime: 99.9,
    monthlyCost: raw.monthlyCostUsd ?? 0,
    websiteCount: 0,
  };
}

function normalizeWebsiteStatus(value?: string | null): WebsiteAsset['status'] {
  const s = (value ?? '').toLowerCase();
  if (s === 'staging') return 'staging';
  if (s === 'down' || s === 'offline') return 'down';
  if (s === 'maintenance') return 'maintenance';
  return 'live';
}

function mapWebsite(raw: RawWebsite): WebsiteAsset {
  return {
    id: raw.id,
    name: raw.name,
    url: raw.url ?? '#',
    serverId: raw.hostedOn ?? '',
    serverName: raw.hostedOn ?? '-',
    domainId: raw.domainLinked ?? '',
    domainName: raw.domainLinked ?? '-',
    status: normalizeWebsiteStatus(raw.status),
    monthlyTraffic: raw.monthlyTraffic ?? 0,
    lastDeploy: raw.lastUpdated ?? '-',
  };
}

export function useDomains(params?: QueryParams) {
  return useQuery<PaginatedResponse<Domain>>({
    queryKey: ['domains', params],
    queryFn: async () => {
      const { data } = await api.get('/assets/domains', { params });
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const meta = data?.meta ?? { total: rows.length, page: 1, limit: 100, totalPages: 1 };
      return { data: rows.map((item: RawDomain) => mapDomain(item)), meta };
    },
  });
}

export function useDomain(id: string | undefined) {
  return useQuery<Domain>({
    queryKey: ['domain', id],
    queryFn: async () => {
      const { data } = await api.get(`/assets/domains/${id}`);
      return mapDomain(data as RawDomain);
    },
    enabled: !!id,
  });
}

export function useCreateDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/assets/domains', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['domains'] }),
  });
}

export function useUpdateDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id: string }) => api.put(`/assets/domains/${id}`, body),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['domains'] });
      qc.invalidateQueries({ queryKey: ['domain', v.id] });
    },
  });
}

export function useDeleteDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/assets/domains/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['domains'] });
      qc.removeQueries({ queryKey: ['domain', id] });
    },
  });
}

export function useServers() {
  return useQuery<ServerAsset[]>({
    queryKey: ['servers'],
    queryFn: async () => {
      const { data } = await api.get('/assets/servers');
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      return rows.map((item: RawServer) => mapServer(item));
    },
  });
}

export function useServer(id: string | undefined) {
  return useQuery<ServerAsset>({
    queryKey: ['server', id],
    queryFn: async () => {
      const { data } = await api.get(`/assets/servers/${id}`);
      return mapServer(data as RawServer);
    },
    enabled: !!id,
  });
}

export function useCreateServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/assets/servers', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}

export function useUpdateServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id: string }) => api.put(`/assets/servers/${id}`, body),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['servers'] });
      qc.invalidateQueries({ queryKey: ['server', v.id] });
    },
  });
}

export function useDeleteServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/assets/servers/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['servers'] });
      qc.removeQueries({ queryKey: ['server', id] });
    },
  });
}

export function useWebsites(params?: QueryParams) {
  return useQuery<PaginatedResponse<WebsiteAsset>>({
    queryKey: ['websites', params],
    queryFn: async () => {
      const { data } = await api.get('/assets/websites', { params });
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const meta = data?.meta ?? { total: rows.length, page: 1, limit: 100, totalPages: 1 };
      return { data: rows.map((item: RawWebsite) => mapWebsite(item)), meta };
    },
  });
}

export function useWebsite(id: string | undefined) {
  return useQuery<WebsiteAsset>({
    queryKey: ['website', id],
    queryFn: async () => {
      const { data } = await api.get(`/assets/websites/${id}`);
      return mapWebsite(data as RawWebsite);
    },
    enabled: !!id,
  });
}

export function useCreateWebsite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/assets/websites', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['websites'] }),
  });
}

export function useUpdateWebsite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id: string }) => api.put(`/assets/websites/${id}`, body),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['websites'] });
      qc.invalidateQueries({ queryKey: ['website', v.id] });
    },
  });
}

export function useDeleteWebsite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/assets/websites/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['websites'] });
      qc.removeQueries({ queryKey: ['website', id] });
    },
  });
}

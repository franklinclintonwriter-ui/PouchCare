/**
 * Staff-only asset APIs (`GET/POST /v1/assets/...`): PouchCare internal operations inventory.
 *
 * This module is for the Management app (`m.pouchcare.com`): domains, servers, and websites
 * the **company** tracks as its own infrastructure / internal projects — NOT the client-facing
 * portal product. End customers use `/v1/portal/hosting/*` and `/v1/portal/websites` (see
 * `apps/landing` portal API clients) which are scoped to `portalMemberId`.
 *
 * Do not conflate these routes with client portal hosting; UX and authorization differ
 * (`requireStaff` / senior roles here vs `requirePortal` there).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { QueryParams, PaginatedResponse } from '@/types/api';
import type { Domain, ServerAsset, WebsiteAsset } from '@/types/models';

type RawDomain = Record<string, unknown> & {
  id: string;
  domainName?: string;
  registrar?: string | null;
  expiryDate?: string | null;
  status?: string | null;
  lifecycleStatus?: string | null;
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

type RawWebsite = Record<string, unknown> & {
  id: string;
  name: string;
  url?: string | null;
  hostedOn?: string | null;
  domainLinked?: string | null;
  domainId?: string | null;
  serverId?: string | null;
  status?: string | null;
  platform?: string | null;
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
    domainName: raw.domainName,
    registrar: raw.registrar ?? 'Unknown',
    expiryDate: raw.expiryDate ?? new Date().toISOString(),
    registrationDate: raw.registrationDate as string | undefined,
    autoRenew: true,
    status: raw.status ?? 'Active',
    lifecycleStatus: (raw.lifecycleStatus as Domain['lifecycleStatus']) ?? 'INCOMPLETE',
    dnsProvider: raw.hostingServer ?? 'Unknown',
    annualCost: raw.annualRenewalCost ?? 0,
    assignedTo: raw.assignedTo as string | undefined,
    assignedStaffId: raw.assignedStaffId as string | undefined,
    daScore: raw.daScore as number | null | undefined,
    drScore: raw.drScore as number | null | undefined,
    backlinksCount: raw.backlinksCount as number | null | undefined,
    indexedPages: raw.indexedPages as number | null | undefined,
    monthlyTraffic: raw.monthlyTraffic as number | null | undefined,
    niche: raw.niche as string | null | undefined,
    sslStatus: raw.sslStatus as string | null | undefined,
    nameservers: raw.nameservers as string | null | undefined,
    whoisPrivacy: raw.whoisPrivacy as boolean | undefined,
    adsenseConnected: raw.adsenseConnected as boolean | undefined,
    adsensePublisherId: raw.adsensePublisherId as string | null | undefined,
    analyticsId: raw.analyticsId as string | null | undefined,
    searchConsoleVerified: raw.searchConsoleVerified as boolean | undefined,
    notes: raw.notes as string | null | undefined,
    linkedWebsite: raw.linkedWebsite as Domain['linkedWebsite'],
    linkedServer: raw.linkedServer as Domain['linkedServer'],
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
    serverId: raw.serverId ?? raw.hostedOn ?? '',
    serverName: raw.hostedOn ?? '-',
    domainId: raw.domainId ?? raw.domainLinked ?? '',
    domainName: raw.domainLinked ?? '-',
    status: raw.status ?? 'Live',
    platform: raw.platform,
    cms: raw.cms as string | null | undefined,
    programmingLang: raw.programmingLang as string | null | undefined,
    framework: raw.framework as string | null | undefined,
    monthlyTraffic: raw.monthlyTraffic ?? 0,
    lastDeploy: raw.lastUpdated ?? '-',
    assignedStaffId: raw.assignedStaffId as string | null | undefined,
    adsenseConnected: raw.adsenseConnected as boolean | undefined,
    adsenseEarnings: raw.adsenseEarnings as number | null | undefined,
    analyticsId: raw.analyticsId as string | null | undefined,
    uptimePercent: raw.uptimePercent as number | null | undefined,
    avgLoadTime: raw.avgLoadTime as number | null | undefined,
    daScore: raw.daScore as number | null | undefined,
    sslStatus: raw.sslStatus as string | null | undefined,
    notes: raw.notes as string | null | undefined,
    linkedDomain: raw.linkedDomain as WebsiteAsset['linkedDomain'],
    linkedServer: raw.linkedServer as WebsiteAsset['linkedServer'],
  };
}

export function useDomainStats() {
  return useQuery<DomainStats>({
    queryKey: ['domain-stats'],
    queryFn: async () => {
      const { data } = await api.get('/assets/domains/stats');
      return (data?.data ?? data) as DomainStats;
    },
    staleTime: 30 * 1000,
  });
}

export function useWebsiteStats() {
  return useQuery<{ total: number; live: number; staging: number; down: number; maintenance: number; platforms: { platform: string; count: number }[] }>({
    queryKey: ['website-stats'],
    queryFn: async () => {
      const { data } = await api.get('/assets/websites/stats');
      return data as any;
    },
  });
}

export interface DomainFilters {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  niche?: string;
  tag?: string;
  sortBy?: 'expiry' | 'name' | 'status' | 'niche' | 'da' | 'dr' | 'traffic' | 'backlinks' | 'age';
  sortDir?: 'asc' | 'desc';
}

export interface DomainStats {
  total: number;
  completed: number;
  inProgress: number;
  incomplete: number;
  expiringSoon: number;
  expiringIn90: number;
  expired: number;
  totalWebsites: number;
  liveWebsites: number;
}

export function useDomains(filters?: DomainFilters) {
  return useQuery<PaginatedResponse<Domain>>({
    queryKey: ['domains', filters],
    queryFn: async () => {
      const { data } = await api.get('/assets/domains', { params: { limit: 25, ...filters } });
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const meta = data?.meta ?? { total: rows.length, page: 1, limit: 25, totalPages: 1 };
      return { data: rows.map((item: RawDomain) => mapDomain(item)), meta };
    },
    placeholderData: (prev) => prev,
  });
}

export function useDomainNiches() {
  return useQuery<{ niche: string; count: number }[]>({
    queryKey: ['domain-niches'],
    queryFn: async () => {
      const { data } = await api.get('/assets/domains/niches');
      return (data?.data ?? data) as { niche: string; count: number }[];
    },
    staleTime: 5 * 60 * 1000,
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

export type CreateDomainInput = {
  domainName: string;
  registrar?: string;
  expiryDate?: string;
  hostingServer?: string;
  annualRenewalCost?: number;
  status?: string;
};

export type UpdateDomainInput = {
  id: string;
  domainName?: string;
  registrar?: string;
  expiryDate?: string;
  hostingServer?: string;
  annualRenewalCost?: number;
  status?: string;
};

export function useCreateDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDomainInput) => api.post('/assets/domains', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['domains'] }),
  });
}

export function useUpdateDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateDomainInput) => api.put(`/assets/domains/${id}`, body),
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

export type CreateServerInput = {
  name: string;
  provider?: string;
  ipAddress?: string;
  type?: string;
  ramGb?: number;
  storageGb?: number;
  monthlyCostUsd?: number;
  status?: string;
};

export type UpdateServerInput = {
  id: string;
  name?: string;
  provider?: string;
  ipAddress?: string;
  type?: string;
  ramGb?: number;
  storageGb?: number;
  monthlyCostUsd?: number;
  status?: string;
};

export function useCreateServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateServerInput) => api.post('/assets/servers', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}

export function useUpdateServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateServerInput) => api.put(`/assets/servers/${id}`, body),
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

export type CreateWebsiteInput = {
  name: string;
  url?: string;
  hostedOn?: string;
  domainLinked?: string;
  status?: string;
  monthlyTraffic?: number;
};

export type UpdateWebsiteInput = {
  id: string;
  name?: string;
  url?: string;
  hostedOn?: string;
  domainLinked?: string;
  status?: string;
  monthlyTraffic?: number;
};

export function useCreateWebsite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWebsiteInput) => api.post('/assets/websites', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['websites'] }),
  });
}

export function useUpdateWebsite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateWebsiteInput) => api.put(`/assets/websites/${id}`, body),
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

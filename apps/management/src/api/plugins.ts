import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';

// ── Types ──────────────────────────────────────────────────────────────────

export interface Plugin {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  currentVersion: string;
  versionCount?: number;
  activationCount?: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface PluginVersion {
  id: string;
  pluginId: string;
  version: string;
  changelog: string | null;
  phpFileContent: string;
  isLatest: boolean;
  publishedAt: string;
  publishedById: string;
}

export interface PluginActivation {
  id: string;
  pluginId: string;
  activatedByType: 'staff' | 'portal';
  activatedById: string;
  activatedByName: string | null;
  siteUrl: string;
  siteTitle: string | null;
  activatedAt: string;
  lastPingAt: string | null;
  isActive: boolean;
}

export interface PluginDetail extends Plugin {
  versions: PluginVersion[];
  activationCount: number;
}

function mapPlugin(raw: Record<string, unknown>): Plugin {
  return {
    id: String(raw.id ?? ''),
    slug: String(raw.slug ?? ''),
    name: String(raw.name ?? ''),
    description: raw.description != null ? String(raw.description) : null,
    status: raw.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    currentVersion: String(raw.currentVersion ?? ''),
    versionCount: typeof raw.versionCount === 'number' ? raw.versionCount : undefined,
    activationCount: typeof raw.activationCount === 'number' ? raw.activationCount : undefined,
    createdById: String(raw.createdById ?? ''),
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

// ── Hooks ─────────────────────────────────────────────────────────────────

export function usePlugins() {
  return useQuery({
    queryKey: ['plugins'],
    queryFn: async () => {
      const res = await api.get('/plugins');
      const data = res.data;
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      return rows.map(mapPlugin);
    },
  });
}

export function usePlugin(id: string) {
  return useQuery<PluginDetail>({
    queryKey: ['plugins', id],
    queryFn: async () => {
      const res = await api.get(`/plugins/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function usePluginActivations(pluginId: string, page = 1) {
  return useQuery<{ data: PluginActivation[]; meta: { total: number; page: number; totalPages: number } }>({
    queryKey: ['plugins', pluginId, 'activations', page],
    queryFn: async () => {
      const res = await api.get(`/plugins/${pluginId}/activations`, { params: { page, limit: 20 } });
      return { data: res.data.data, meta: res.data.meta };
    },
    enabled: !!pluginId,
  });
}

export function useCreatePlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { slug: string; name: string; description?: string }) => {
      const res = await api.post('/plugins', data);
      return res.data.data as Plugin;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plugins'] }); },
  });
}

export function useUpdatePlugin(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; description?: string; status?: 'DRAFT' | 'PUBLISHED' }) => {
      const res = await api.patch(`/plugins/${id}`, data);
      return res.data.data as Plugin;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plugins'] });
      qc.invalidateQueries({ queryKey: ['plugins', id] });
    },
  });
}

export function usePublishVersion(pluginId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { version: string; phpFileContent: string; changelog?: string }) => {
      const res = await api.post(`/plugins/${pluginId}/versions`, data);
      return res.data.data as PluginVersion;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plugins', pluginId] }); },
  });
}

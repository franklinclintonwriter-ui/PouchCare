import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'boolean' | 'number' | 'json';
  group: string;
  label: string | null;
  description: string | null;
  isPublic: boolean;
  updatedAt: string;
}

export interface SystemAuditLog {
  id: string;
  action: string;
  module: string;
  actorName: string;
  actorRole: string;
  ipAddress: string | null;
  details: string | null;
  createdAt: string;
}

export function useSystemSettings(group?: string) {
  return useQuery({
    queryKey: ['system-settings', group],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (group) params.append('group', group);
      const res = await api.get<{ settings: SystemSetting[] }>(`/v1/admin/system-config?${params.toString()}`);
      return res.data.settings;
    },
  });
}

export function useUpdateSystemSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { key: string; value: any; type?: string; group?: string; label?: string; description?: string }[]) => {
      const res = await api.put('/v1/admin/system-config', { updates });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
}

export function useSystemAuditLogs() {
  return useQuery({
    queryKey: ['system-audit-logs'],
    queryFn: async () => {
      const res = await api.get<{ logs: SystemAuditLog[] }>('/v1/admin/system-config/audit');
      return res.data.logs;
    },
  });
}

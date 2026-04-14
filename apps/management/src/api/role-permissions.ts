import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { PermissionKey } from '@/constants/permissionKeys';
import { useAuthStore } from '@/store/authStore';
import { normalizeStaffUser } from '@/api/auth';
import type { StaffUser } from '@/types/auth';

export interface RolePermissionsPayload {
  keys: PermissionKey[];
  matrix: Record<string, Record<string, boolean>>;
  overrides: { id: string; role: string; key: string; allowed: boolean }[];
}

export function useRolePermissionsMatrix() {
  return useQuery({
    queryKey: ['admin', 'role-permissions'],
    queryFn: async () => {
      const res = await api.get<RolePermissionsPayload>('/admin/role-permissions');
      return res.data;
    },
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { role: string; key: PermissionKey; allowed: boolean }[]) => {
      const res = await api.put<{ matrix: Record<string, Record<string, boolean>> }>('/admin/role-permissions', {
        updates,
      });
      return res.data;
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ['admin', 'role-permissions'] });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      try {
        const me = await api.get<StaffUser>('/staff/me');
        useAuthStore.getState().setUser(normalizeStaffUser(me.data));
      } catch {
        /* ignore */
      }
    },
  });
}

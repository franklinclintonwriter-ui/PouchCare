import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { QueryParams, PaginatedResponse } from '@/types/api';
import type { StaffMember } from '@/types/models';

type RawStaffMember = {
  id: string;
  memberId?: number | string;
  name: string;
  email: string;
  systemRole: StaffMember['systemRole'];
  status?: string | null;
  branch?: string | null;
  phone?: string | null;
  jobRole?: string | null;
  joinDate?: string | null;
  salary?: number | null;
};

function mapStaff(raw: RawStaffMember): StaffMember {
  return {
    id: raw.id,
    memberId: String(raw.memberId ?? raw.id.slice(0, 8)),
    name: raw.name,
    email: raw.email,
    systemRole: raw.systemRole,
    branch: raw.branch ?? '-',
    phone: raw.phone ?? '-',
    department: raw.jobRole ?? '-',
    joinDate: raw.joinDate ?? new Date().toISOString(),
    salary: raw.salary ?? 0,
    isActive: (raw.status ?? '').toLowerCase() === 'active',
  };
}

export function useStaffList(params?: QueryParams) {
  return useQuery<PaginatedResponse<StaffMember>>({
    queryKey: ['staff-list', params],
    queryFn: async () => {
      const { data } = await api.get('/staff/members', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows.map((item: RawStaffMember) => mapStaff(item)) };
    },
  });
}

export function useStaffMember(id: string) {
  return useQuery<StaffMember>({
    queryKey: ['staff-member', id],
    queryFn: async () => {
      const { data } = await api.get(`/staff/members/${id}`);
      return mapStaff(data as RawStaffMember);
    },
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/staff/members', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-list'] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id: string }) => api.put(`/staff/members/${id}`, body),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['staff-list'] }); qc.invalidateQueries({ queryKey: ['staff-member', v.id] }); },
  });
}

export function useRateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating, note }: { id: string; rating: number; note?: string }) => api.post(`/staff/members/${id}/rate`, { rating, note }),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['staff-list'] }); qc.invalidateQueries({ queryKey: ['staff-member', v.id] }); },
  });
}

export type StaffLeaderboardEntry = {
  id: string;
  name: string;
  branch: string | null;
  primarySkill: string | null;
  averageTaskRating: number | null;
  tasksCompleted: number;
  systemRole: string;
};

export function useStaffLeaderboard() {
  return useQuery<StaffLeaderboardEntry[]>({
    queryKey: ['staff-leaderboard'],
    queryFn: async () => {
      const { data } = await api.get('/staff/leaderboard');
      return Array.isArray(data) ? data : data.data ?? [];
    },
  });
}

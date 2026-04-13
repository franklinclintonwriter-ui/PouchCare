import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import api from './client';
import type { QueryParams, PaginatedResponse } from '@/types/api';
import type { StaffMember, StaffProfileDetail } from '@/types/models';
import { useAuthStore } from '@/store/authStore';

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
  avatarUrl?: string | null;
};

type RawStaffDetail = RawStaffMember & {
  profileScope?: 'full' | 'limited';
  profileAdmin?: boolean;
  rolePermissions?: Record<string, boolean> | null;
  email2?: string | null;
  whatsapp?: string | null;
  primarySkill?: string | null;
  skillLevel?: string | null;
  secondarySkills?: string | null;
  toolsKnown?: string | null;
  yearsExperience?: number | null;
  employmentType?: string | null;
  country?: string | null;
  address?: string | null;
  nidPassport?: string | null;
  emergencyContact?: string | null;
  terminationDate?: string | null;
  exitReason?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  certifications?: string | null;
  averageTaskRating?: number | null;
  ceoPerformanceRating?: number | null;
  ceoRatingNote?: string | null;
  ceoLastRatedDate?: string | null;
  tasksAssigned?: number;
  tasksCompleted?: number;
  totalTasksRated?: number;
  performanceScore?: number | null;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
};

function mapStaff(raw: RawStaffMember): StaffMember {
  const statusStr = (raw.status ?? '').toLowerCase();
  const isActive = ['active', 'enabled'].includes(statusStr);
  const row: StaffMember = {
    id: raw.id,
    memberId: String(raw.memberId ?? raw.id.slice(0, 8)),
    name: raw.name,
    email: raw.email,
    systemRole: raw.systemRole,
    branch: raw.branch ?? '-',
    phone: raw.phone ?? '-',
    department: raw.jobRole ?? '-',
    joinDate: raw.joinDate ?? '',
    isActive,
  };
  if (typeof raw.salary === 'number') row.salary = raw.salary;
  if (raw.avatarUrl) row.avatarUrl = raw.avatarUrl;
  return row;
}

function mapStaffDetail(raw: RawStaffDetail): StaffProfileDetail {
  const base = mapStaff(raw);
  return {
    ...base,
    profileScope: raw.profileScope,
    profileAdmin: raw.profileAdmin,
    rolePermissions: raw.rolePermissions ?? null,
    email2: raw.email2,
    whatsapp: raw.whatsapp,
    primarySkill: raw.primarySkill,
    status: raw.status ?? undefined,
    skillLevel: raw.skillLevel,
    secondarySkills: raw.secondarySkills,
    toolsKnown: raw.toolsKnown,
    yearsExperience: raw.yearsExperience,
    employmentType: raw.employmentType,
    country: raw.country,
    address: raw.address,
    nidPassport: raw.nidPassport,
    emergencyContact: raw.emergencyContact,
    terminationDate: raw.terminationDate,
    exitReason: raw.exitReason,
    portfolioUrl: raw.portfolioUrl,
    linkedinUrl: raw.linkedinUrl,
    githubUrl: raw.githubUrl,
    certifications: raw.certifications,
    averageTaskRating: raw.averageTaskRating,
    ceoPerformanceRating: raw.ceoPerformanceRating,
    ceoRatingNote: raw.ceoRatingNote,
    ceoLastRatedDate: raw.ceoLastRatedDate,
    tasksAssigned: raw.tasksAssigned,
    tasksCompleted: raw.tasksCompleted,
    totalTasksRated: raw.totalTasksRated,
    performanceScore: raw.performanceScore,
    twoFactorEnabled: raw.twoFactorEnabled,
    lastLoginAt: raw.lastLoginAt,
    lastLoginIp: raw.lastLoginIp,
  };
}

export type StaffDirectoryStats = {
  total: number;
  active: number;
  inactive: number;
  branchCount: number;
};

/** Aggregate counts for the staff directory (aligned with list filters, no pagination). */
export function useStaffStats(
  filters: { q?: string; status?: string; role?: string; branch?: string },
  options?: Omit<UseQueryOptions<StaffDirectoryStats>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<StaffDirectoryStats>({
    queryKey: ['staff-stats', filters],
    queryFn: async () => {
      const { data } = await api.get('/staff/members/stats', { params: filters });
      return data as StaffDirectoryStats;
    },
    ...options,
  });
}

export function useStaffList(
  params?: QueryParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<StaffMember>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<PaginatedResponse<StaffMember>>({
    queryKey: ['staff-list', params],
    queryFn: async () => {
      const { data } = await api.get('/staff/members', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows.map((item: RawStaffMember) => mapStaff(item)) };
    },
    ...options,
  });
}

export function useStaffMember(id: string | undefined) {
  return useQuery<StaffProfileDetail>({
    queryKey: ['staff-member', id],
    queryFn: async () => {
      const { data } = await api.get(`/staff/members/${id}`);
      return mapStaffDetail(data as RawStaffDetail);
    },
    enabled: !!id,
  });
}

export type CreateStaffInput = {
  name: string;
  email: string;
  password: string;
  systemRole: string;
  branch?: string;
};

export type UpdateStaffInput = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  branch?: string;
  jobRole?: string;
  salary?: number;
};

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateStaffInput) => api.post('/staff/members', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-list'] });
      qc.invalidateQueries({ queryKey: ['staff-stats'] });
    },
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateStaffInput) => api.put(`/staff/members/${id}`, body),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['staff-list'] });
      qc.invalidateQueries({ queryKey: ['staff-stats'] });
      qc.invalidateQueries({ queryKey: ['staff-member', v.id] });
      qc.invalidateQueries({ queryKey: ['staff-leaderboard'] });
    },
  });
}

export function useUploadStaffMemberAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<{ id: string; avatarUrl: string | null }>(`/staff/members/${id}/avatar`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['staff-list'] });
      qc.invalidateQueries({ queryKey: ['staff-member', variables.id] });
      qc.invalidateQueries({ queryKey: ['staff-leaderboard'] });
      if (useAuthStore.getState().user?.id === variables.id) {
        useAuthStore.getState().updateUser({ avatarUrl: data.avatarUrl ?? undefined });
      }
    },
  });
}

export function useDeleteStaffMemberAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ avatarUrl: null }>(`/staff/members/${id}/avatar`);
      return data;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['staff-list'] });
      qc.invalidateQueries({ queryKey: ['staff-member', id] });
      qc.invalidateQueries({ queryKey: ['staff-leaderboard'] });
      if (useAuthStore.getState().user?.id === id) {
        useAuthStore.getState().updateUser({ avatarUrl: undefined });
      }
    },
  });
}

export function useRateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating, note }: { id: string; rating: number; note?: string }) => api.post(`/staff/members/${id}/rate`, { rating, note }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['staff-list'] });
      qc.invalidateQueries({ queryKey: ['staff-member', v.id] });
    },
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

export function useDeactivateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/staff/members/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['staff-list'] });
      qc.invalidateQueries({ queryKey: ['staff-stats'] });
      qc.invalidateQueries({ queryKey: ['staff-member', id] });
      qc.invalidateQueries({ queryKey: ['staff-leaderboard'] });
    },
  });
}

export function useRestoreStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/staff/members/${id}`, { status: 'Active', terminationDate: null }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['staff-list'] });
      qc.invalidateQueries({ queryKey: ['staff-stats'] });
      qc.invalidateQueries({ queryKey: ['staff-member', id] });
      qc.invalidateQueries({ queryKey: ['staff-leaderboard'] });
    },
  });
}

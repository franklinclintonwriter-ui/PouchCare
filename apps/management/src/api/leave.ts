import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { QueryParams, PaginatedResponse } from '@/types/api';
import type { LeaveRequest } from '@/types/models';

type RawLeave = {
  id: string;
  staffMemberId: string;
  staffName: string;
  leaveType?: string | null;
  status?: string | null;
  startDate: string;
  endDate: string;
  totalDays?: number | null;
  reason?: string | null;
  approvedBy?: string | null;
  createdAt: string;
};

function mapLeave(raw: RawLeave): LeaveRequest {
  return {
    id: raw.id,
    staffId: raw.staffMemberId,
    staffName: raw.staffName,
    type: (raw.leaveType ?? 'ANNUAL') as LeaveRequest['type'],
    status: (raw.status ?? 'PENDING') as LeaveRequest['status'],
    startDate: raw.startDate,
    endDate: raw.endDate,
    days: raw.totalDays ?? 0,
    reason: raw.reason ?? '',
    approvedBy: raw.approvedBy ?? undefined,
    createdAt: raw.createdAt,
  };
}

export function useLeaveRequests(params?: QueryParams) {
  return useQuery<PaginatedResponse<LeaveRequest>>({
    queryKey: ['leave', params],
    queryFn: async () => {
      const { data } = await api.get('/leave', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows.map((item: RawLeave) => mapLeave(item)) };
    },
  });
}

export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { leaveType: string; startDate: string; endDate: string; reason?: string }) => api.post('/leave/apply', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }),
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/leave/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }),
  });
}

export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => api.put(`/leave/${id}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }),
  });
}

export function useCancelLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/leave/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }),
  });
}

export function useLeaveRequest(id: string | undefined) {
  return useQuery<LeaveRequest | null>({
    queryKey: ['leave-request', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/leave/${id}`);
      return mapLeave(data as RawLeave);
    },
    enabled: !!id,
  });
}

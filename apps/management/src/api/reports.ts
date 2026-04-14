import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { QueryParams, PaginatedResponse } from '@/types/api';
import type { DailyReport } from '@/types/models';

type RawDailyReport = {
  id: string;
  staffMemberId: string;
  submitterName: string;
  reportDate: string;
  tasksCompleted?: string | null;
  hoursWorked?: number | null;
  notes?: string | null;
  mood?: string | null;
  status?: string | null;
};

function normalizeMood(mood?: string | null): DailyReport['mood'] {
  const value = (mood ?? '').trim().toLowerCase();
  if (value === 'great' || value === 'good' || value === 'okay' || value === 'bad') return value;
  return 'okay';
}

function normalizeApprovalStatus(status?: string | null): DailyReport['status'] {
  const value = (status ?? '').trim().toUpperCase();
  if (
    value === 'WAITING' ||
    value === 'SUBMITTED' ||
    value === 'APPROVED_MGR' ||
    value === 'REJECTED_MGR' ||
    value === 'ESCALATED' ||
    value === 'VERIFIED'
  ) {
    return value;
  }
  if (value === 'REVIEWED' || value === 'APPROVED') return 'APPROVED_MGR';
  if (value === 'REJECTED') return 'REJECTED_MGR';
  return 'SUBMITTED';
}

function parseTaskCount(tasksCompleted?: string | null): number {
  const text = (tasksCompleted ?? '').trim();
  if (!text) return 0;
  const number = Number(text);
  if (!Number.isNaN(number)) return number;
  return text
    .split(/\r?\n|,/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function mapDailyReport(raw: RawDailyReport): DailyReport {
  return {
    id: raw.id,
    staffId: raw.staffMemberId,
    staffName: raw.submitterName,
    date: raw.reportDate,
    tasksCompleted: parseTaskCount(raw.tasksCompleted),
    hoursWorked: raw.hoursWorked ?? 0,
    notes: raw.notes ?? '',
    mood: normalizeMood(raw.mood),
    status: normalizeApprovalStatus(raw.status),
  };
}

export function useDailyReports(params?: QueryParams) {
  return useQuery<PaginatedResponse<DailyReport>>({
    queryKey: ['daily-reports', params],
    queryFn: async () => {
      const { data } = await api.get('/reports/daily', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawDailyReport) => mapDailyReport(item)),
      };
    },
  });
}

export function useSubmitReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { tasksCompleted: string; plannedTomorrow: string; blockers?: string; hoursWorked: number; mood?: string }) =>
      api.post('/reports/daily', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-reports'] }),
  });
}

export function useReviewReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => api.put(`/reports/daily/${id}/review`, { note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-reports'] }),
  });
}

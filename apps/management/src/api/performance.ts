import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { PerformanceReview } from '@/types/models';

type RawPerformanceReview = {
  id: string;
  staffMemberId: string;
  staffName: string;
  reviewPeriod?: string | null;
  reviewQuarter?: string | null;
  reviewYear?: number | null;
  overallRating: number;
  taskQuality?: number | null;
  communication?: number | null;
  punctuality?: number | null;
  teamwork?: number | null;
  notes?: string | null;
};

function toScore(value?: number | null, fallback = 0): number {
  const v = value ?? fallback;
  return Math.max(0, Math.min(100, Math.round(v * 10)));
}

function mapPerformanceReview(raw: RawPerformanceReview): PerformanceReview {
  const period =
    raw.reviewPeriod ??
    (raw.reviewQuarter && raw.reviewYear ? `${raw.reviewQuarter} ${raw.reviewYear}` : raw.reviewYear ? String(raw.reviewYear) : 'Current');
  const overallScore = toScore(raw.overallRating);
  const tasks = toScore(raw.taskQuality, raw.overallRating);
  const attendance = toScore(raw.punctuality, raw.overallRating);
  const quality = toScore(raw.communication, raw.overallRating);
  const initiative = toScore(raw.teamwork, raw.overallRating);
  return {
    id: raw.id,
    staffId: raw.staffMemberId,
    staffName: raw.staffName,
    period,
    scores: { tasks, attendance, quality, initiative },
    overallScore,
    trend: 0,
    comments: raw.notes ?? '',
  };
}

export function usePerformanceReviews(period?: string) {
  return useQuery<PerformanceReview[]>({
    queryKey: ['performance', period],
    queryFn: async () => {
      const { data } = await api.get('/performance', { params: period ? { period } : undefined });
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      return rows.map((item: RawPerformanceReview) => mapPerformanceReview(item));
    },
  });
}

export type CreatePerformanceReviewInput = {
  staffMemberId: string;
  staffName?: string;
  reviewQuarter?: string;
  reviewYear?: number;
  overallRating: number;
  taskQuality?: number;
  communication?: number;
  punctuality?: number;
  teamwork?: number;
  notes?: string;
};

export type UpdatePerformanceReviewInput = {
  id: string;
  overallRating?: number;
  taskQuality?: number;
  communication?: number;
  punctuality?: number;
  teamwork?: number;
  notes?: string;
};

export function useCreatePerformanceReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePerformanceReviewInput) => {
      const memberId = body.staffMemberId.trim();
      const reviewQuarter = body.reviewQuarter ?? 'Q1';
      const reviewYear = body.reviewYear ?? new Date().getFullYear();
      const reviewPeriod = `${reviewQuarter} ${reviewYear}`;
      return api.post('/performance', {
        memberId,
        reviewPeriod,
        reviewQuarter,
        reviewYear,
        overallRating: body.overallRating,
        taskQuality: body.taskQuality,
        communication: body.communication,
        punctuality: body.punctuality,
        teamwork: body.teamwork,
        notes: body.notes,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['performance'] }),
  });
}

export function useUpdatePerformanceReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdatePerformanceReviewInput) =>
      api.put(`/performance/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['performance'] }),
  });
}

export function useDeletePerformanceReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/performance/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['performance'] }),
  });
}

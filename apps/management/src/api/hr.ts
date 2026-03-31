import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { QueryParams, PaginatedResponse } from '@/types/api';
import type { Position, JobApplication } from '@/types/models';

type RawPosition = {
  id: string;
  title: string;
  department?: string | null;
  branch?: string | null;
  status?: string | null;
  employmentType?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  applications?: number | null;
  postedDate?: string | null;
  createdAt?: string;
  _count?: { jobApplications?: number };
};

type RawApplication = {
  id: string;
  applicantName: string;
  email: string;
  positionId: string;
  status?: string | null;
  cvUrl?: string | null;
  experienceYears?: number | null;
  appliedDate?: string;
  notes?: string | null;
  position?: { title?: string | null };
};

function normalizeEmploymentType(value?: string | null): Position['type'] {
  const t = (value ?? '').toLowerCase();
  if (t === 'full_time' || t === 'part_time' || t === 'contract' || t === 'internship') return t;
  if (t === 'full time') return 'full_time';
  if (t === 'part time') return 'part_time';
  return 'full_time';
}

function normalizePositionStatus(value?: string | null): Position['status'] {
  const s = (value ?? '').toLowerCase();
  if (s === 'open') return 'open';
  if (s === 'closed') return 'closed';
  if (s === 'paused' || s === 'on_hold') return 'paused';
  return 'open';
}

function mapPosition(raw: RawPosition): Position {
  return {
    id: raw.id,
    title: raw.title,
    department: raw.department ?? 'General',
    location: raw.branch ?? 'N/A',
    type: normalizeEmploymentType(raw.employmentType),
    salaryRange: {
      min: raw.salaryMin ?? 0,
      max: raw.salaryMax ?? 0,
    },
    applicationsCount: raw._count?.jobApplications ?? raw.applications ?? 0,
    status: normalizePositionStatus(raw.status),
    postedDate: raw.postedDate ?? raw.createdAt ?? new Date().toISOString(),
  };
}

function normalizeApplicationStage(value?: string | null): JobApplication['stage'] {
  const s = (value ?? '').toLowerCase();
  if (s === 'new') return 'new';
  if (s === 'screening') return 'screening';
  if (s === 'interview') return 'interview';
  if (s === 'offer') return 'offer';
  if (s === 'hired') return 'hired';
  if (s === 'rejected') return 'rejected';
  return 'new';
}

function mapApplication(raw: RawApplication): JobApplication {
  const inferredRating = Math.max(1, Math.min(5, Math.round((raw.experienceYears ?? 0) / 2) || 3));
  return {
    id: raw.id,
    applicantName: raw.applicantName,
    applicantEmail: raw.email,
    positionId: raw.positionId,
    positionTitle: raw.position?.title ?? 'Unknown Position',
    stage: normalizeApplicationStage(raw.status),
    resumeUrl: raw.cvUrl ?? undefined,
    rating: inferredRating,
    appliedDate: raw.appliedDate ?? new Date().toISOString(),
    notes: raw.notes ?? '',
  };
}

export function usePositions(params?: QueryParams) {
  return useQuery<Position[]>({
    queryKey: ['positions', params],
    queryFn: async () => {
      const { data } = await api.get('/hr/positions', { params });
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      return rows.map((item: RawPosition) => mapPosition(item));
    },
  });
}

export function useCreatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/hr/positions', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['positions'] }),
  });
}

export function useUpdatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id: string }) => api.put(`/hr/positions/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['positions'] }),
  });
}

export function useApplications(params?: QueryParams) {
  return useQuery<PaginatedResponse<JobApplication>>({
    queryKey: ['applications', params],
    queryFn: async () => {
      const { data } = await api.get('/hr/applications', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawApplication) => mapApplication(item)),
      };
    },
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/hr/applications', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id: string }) => api.put(`/hr/applications/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

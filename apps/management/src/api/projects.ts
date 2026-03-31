import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { QueryParams, PaginatedResponse } from '@/types/api';
import type { Project } from '@/types/models';

type RawProject = {
  id: string;
  name: string;
  clientName?: string | null;
  notes?: string | null;
  status?: string | null;
  progress?: number | null;
  price?: number | null;
  paidAmount?: number | null;
  assignedTo?: string | null;
  startDate?: string | null;
  deadline?: string | null;
  createdAt?: string;
};

function mapProject(raw: RawProject): Project {
  const assignee = raw.assignedTo?.trim();
  const teamMembers = assignee ? [{ id: `assigned:${raw.id}`, name: assignee }] : [];
  return {
    id: raw.id,
    name: raw.name,
    clientName: raw.clientName ?? 'N/A',
    description: raw.notes ?? '',
    status: (raw.status ?? 'PENDING') as Project['status'],
    progress: raw.progress ?? 0,
    budget: raw.price ?? 0,
    spent: raw.paidAmount ?? 0,
    teamIds: teamMembers.map((m) => m.id),
    teamMembers,
    startDate: raw.startDate ?? raw.createdAt ?? new Date().toISOString(),
    dueDate: raw.deadline ?? raw.createdAt ?? new Date().toISOString(),
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

export function useProjects(params?: QueryParams) {
  return useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects', params],
    queryFn: async () => {
      const { data } = await api.get('/projects', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows.map((item: RawProject) => mapProject(item)) };
    },
  });
}

export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${id}`);
      return mapProject(data as RawProject);
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/projects', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id: string }) => api.put(`/projects/${id}`, body),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['projects'] }); qc.invalidateQueries({ queryKey: ['project', v.id] }); },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

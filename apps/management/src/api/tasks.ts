import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { QueryParams, PaginatedResponse } from '@/types/api';
import type { Task } from '@/types/models';

type RawTaskComment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
};

type RawTask = {
  id: string;
  title: string;
  notes?: string | null;
  relatedProject?: string | null;
  assignedMemberId?: string | null;
  assignedMember?: { id?: string; name?: string } | null;
  status?: string | null;
  approvalStatus?: string | null;
  priority?: string | null;
  deadline?: string | null;
  category?: string | null;
  createdAt: string;
  comments?: RawTaskComment[];
};

function mapTask(raw: RawTask): Task {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.notes ?? '',
    projectName: raw.relatedProject ?? undefined,
    assigneeId: raw.assignedMemberId ?? raw.assignedMember?.id ?? '',
    assigneeName: raw.assignedMember?.name ?? 'Unassigned',
    status: (raw.status ?? 'NOT_STARTED') as Task['status'],
    approvalStatus: (raw.approvalStatus ?? 'WAITING') as Task['approvalStatus'],
    priority: (raw.priority ?? 'MEDIUM') as Task['priority'],
    dueDate: raw.deadline ?? raw.createdAt,
    tags: raw.category ? [raw.category] : [],
    createdAt: raw.createdAt,
    // Extra runtime field consumed by TaskDetail activity tab.
    ...(raw.comments ? { comments: raw.comments } : {}),
  } as Task;
}

export function useTasks(params?: QueryParams) {
  return useQuery<PaginatedResponse<Task>>({
    queryKey: ['tasks', params],
    queryFn: async () => {
      const { data } = await api.get('/tasks', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows.map((item: RawTask) => mapTask(item)) };
    },
  });
}

export function useTask(id: string) {
  return useQuery<Task>({
    queryKey: ['task', id],
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${id}`);
      return mapTask(data as RawTask);
    },
    enabled: !!id,
  });
}

export function useMyTasks() {
  return useQuery<Task[]>({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks', { params: { mine: true, limit: 100 } });
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      return rows.map((item: RawTask) => mapTask(item));
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/tasks', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['my-tasks'] }); },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id: string }) => api.put(`/tasks/${id}`, body),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['task', v.id] }); },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useSubmitTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.post(`/tasks/${id}/submit`, { note }),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['task', v.id] }); },
  });
}

export function useApproveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.post(`/tasks/${id}/approve`, { note }),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['task', v.id] }); },
  });
}

export function useRejectTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.post(`/tasks/${id}/reject`, { note }),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['task', v.id] }); },
  });
}

export function useVerifyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/tasks/${id}/verify`),
    onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['task', id] }); },
  });
}

export function useRateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating, note }: { id: string; rating: number; note?: string }) => api.post(`/tasks/${id}/rate`, { rating, note }),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['task', v.id] }); },
  });
}

export function useAddTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) => api.post(`/tasks/${taskId}/comments`, { content }),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['task', v.taskId] }),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { QueryParams, PaginatedResponse } from '@/types/api';
import type { Task, TaskAttachmentItem } from '@/types/models';
import { taskKeys } from '@/constants/queryKeys';

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
  assignedManagerId?: string | null;
  assignedManager?: { id?: string; name?: string } | null;
  assignedBranch?: string | null;
  status?: string | null;
  approvalStatus?: string | null;
  priority?: string | null;
  deadline?: string | null;
  category?: string | null;
  createdAt: string;
  progress?: number | null;
  progressUpdatedAt?: string | null;
  actualHours?: number | null;
  taskAttachments?: unknown;
  comments?: RawTaskComment[];
  managerApprovedDate?: string | null;
  managerApprovalNote?: string | null;
  ceoVerifiedDate?: string | null;
  completedDate?: string | null;
};

function parseAttachments(raw: unknown): TaskAttachmentItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: TaskAttachmentItem[] = [];
  for (const x of raw) {
    if (x && typeof x === 'object' && 'url' in x && 'name' in x) {
      out.push({
        url: String((x as TaskAttachmentItem).url),
        name: String((x as TaskAttachmentItem).name),
        uploadedAt: 'uploadedAt' in x ? String((x as TaskAttachmentItem).uploadedAt) : '',
      });
    }
  }
  return out.length ? out : undefined;
}

function mapTask(raw: RawTask): Task {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.notes ?? '',
    projectName: raw.relatedProject ?? undefined,
    assigneeId: raw.assignedMemberId ?? raw.assignedMember?.id ?? '',
    assigneeName: raw.assignedMember?.name ?? 'Unassigned',
    assignedBranch: raw.assignedBranch,
    assignedManagerId: raw.assignedManagerId,
    assignedManagerName: raw.assignedManager?.name,
    status: (raw.status ?? 'NOT_STARTED') as Task['status'],
    approvalStatus: (raw.approvalStatus ?? 'WAITING') as Task['approvalStatus'],
    priority: (raw.priority ?? 'MEDIUM') as Task['priority'],
    dueDate: raw.deadline ?? raw.createdAt,
    tags: raw.category ? [raw.category] : [],
    createdAt: raw.createdAt,
    progress: raw.progress ?? undefined,
    progressUpdatedAt: raw.progressUpdatedAt ?? undefined,
    actualHours: raw.actualHours ?? undefined,
    taskAttachments: parseAttachments(raw.taskAttachments),
    managerApprovedDate: raw.managerApprovedDate ?? undefined,
    managerApprovalNote: raw.managerApprovalNote ?? undefined,
    ceoVerifiedDate: raw.ceoVerifiedDate ?? undefined,
    completedDate: raw.completedDate ?? undefined,
    ...(raw.comments ? { comments: raw.comments } : {}),
  } as Task;
}

type UseTasksOptions = {
  /** When false, the query does not run (e.g. wait for route params). */
  enabled?: boolean;
};

export function useTasks(params?: QueryParams, options?: UseTasksOptions) {
  return useQuery<PaginatedResponse<Task>>({
    queryKey: [...taskKeys.root, params],
    queryFn: async () => {
      const { data } = await api.get('/tasks', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows.map((item: RawTask) => mapTask(item)) };
    },
    enabled: options?.enabled !== false,
  });
}

export function useTask(id: string) {
  return useQuery<Task>({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${id}`);
      return mapTask(data as RawTask);
    },
    enabled: !!id,
  });
}

export type TaskMeta = {
  categories: string[];
  branches: { id: string; name: string; city: string | null }[];
};

export function useTaskMeta(options?: { enabled?: boolean }) {
  return useQuery<TaskMeta>({
    queryKey: [...taskKeys.root, 'meta'],
    queryFn: async () => {
      const { data } = await api.get('/tasks/meta');
      return data as TaskMeta;
    },
    enabled: options?.enabled !== false,
  });
}

export function useMyTasks(params?: QueryParams) {
  return useQuery<Task[]>({
    queryKey: [...taskKeys.my, params],
    queryFn: async () => {
      const { data } = await api.get('/tasks/mine', { params: { limit: 100, ...params } });
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      return rows.map((item: RawTask) => mapTask(item));
    },
  });
}

export type CreateTaskInput = {
  title: string;
  priority?: string;
  notes?: string;
  deadline?: string;
  category?: string;
  assignedBranch?: string;
  assignedManagerId?: string;
  assignedMemberId?: string;
};

export type UpdateTaskInput = { id: string } & Partial<
  Omit<CreateTaskInput, 'assignedMemberId'> & {
    progress?: number;
    assignedMemberId?: string | null;
  }
>;

export type BulkAssignTasksInput = {
  ids: string[];
  assignedMemberId?: string | null;
  assignedManagerId?: string | null;
};

export type BulkAssignTasksResult = {
  okCount: number;
  total: number;
  results: Array<{ id: string; ok: boolean; error?: string }>;
};

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateTaskInput) => {
      const res = await api.post<{ id: string }>('/tasks', body);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.root });
      qc.invalidateQueries({ queryKey: taskKeys.my });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateTaskInput) => api.put(`/tasks/${id}`, body),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: taskKeys.root });
      qc.invalidateQueries({ queryKey: taskKeys.my });
      qc.invalidateQueries({ queryKey: taskKeys.detail(v.id) });
    },
  });
}

export function useBulkAssignTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BulkAssignTasksInput) => {
      const res = await api.post('/tasks/bulk/assign', input);
      return res.data as BulkAssignTasksResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.root });
      qc.invalidateQueries({ queryKey: taskKeys.my });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: taskKeys.detail(id) });
      qc.invalidateQueries({ queryKey: taskKeys.root });
      qc.invalidateQueries({ queryKey: taskKeys.my });
    },
  });
}

export function useUploadTaskAttachments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, files }: { taskId: string; files: File[] }) => {
      const form = new FormData();
      for (const f of files) form.append('files', f);
      const { data } = await api.post(`/tasks/${taskId}/attachments`, form);
      return data;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(v.taskId) });
      qc.invalidateQueries({ queryKey: taskKeys.root });
    },
  });
}

export function useSubmitTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.post(`/tasks/${id}/submit`, { note }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: taskKeys.root });
      qc.invalidateQueries({ queryKey: taskKeys.my });
      qc.invalidateQueries({ queryKey: taskKeys.detail(v.id) });
    },
  });
}

export function useApproveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.post(`/tasks/${id}/approve`, { note }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: taskKeys.root });
      qc.invalidateQueries({ queryKey: taskKeys.my });
      qc.invalidateQueries({ queryKey: taskKeys.detail(v.id) });
    },
  });
}

export function useRejectTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.post(`/tasks/${id}/reject`, { note }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: taskKeys.root });
      qc.invalidateQueries({ queryKey: taskKeys.my });
      qc.invalidateQueries({ queryKey: taskKeys.detail(v.id) });
    },
  });
}

export function useEscalateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.post(`/tasks/${id}/escalate`, { note }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: taskKeys.root });
      qc.invalidateQueries({ queryKey: taskKeys.my });
      qc.invalidateQueries({ queryKey: taskKeys.detail(v.id) });
    },
  });
}

export function useVerifyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/tasks/${id}/verify`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: taskKeys.root });
      qc.invalidateQueries({ queryKey: taskKeys.my });
      qc.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}

export function useRateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating, note }: { id: string; rating: number; note?: string }) => api.post(`/tasks/${id}/rate`, { rating, note }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: taskKeys.root });
      qc.invalidateQueries({ queryKey: taskKeys.my });
      qc.invalidateQueries({ queryKey: taskKeys.detail(v.id) });
    },
  });
}

export function useAddTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) => api.post(`/tasks/${taskId}/comments`, { content }),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: taskKeys.detail(v.taskId) }),
  });
}

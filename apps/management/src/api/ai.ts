import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'
import type { AiConversation, AiStatus, AiUsageSummary } from '@/features/ai/types'

export function useAiStatus() {
  return useQuery<AiStatus>({
    queryKey: ['ai', 'status'],
    queryFn: async () => {
      const { data } = await api.get('/ai/status')
      return data as AiStatus
    },
    staleTime: 60_000,
  })
}

export function useAiUsage() {
  return useQuery<AiUsageSummary>({
    queryKey: ['ai', 'usage'],
    queryFn: async () => {
      const { data } = await api.get('/ai/usage')
      return data as AiUsageSummary
    },
    staleTime: 30_000,
  })
}

export function useAiConversations(limit = 20) {
  return useQuery<{ data: AiConversation[]; meta: { total: number } }>({
    queryKey: ['ai', 'conversations', limit],
    queryFn: async () => {
      const { data } = await api.get('/ai/conversations', { params: { limit } })
      return data as { data: AiConversation[]; meta: { total: number } }
    },
    staleTime: 15_000,
  })
}

export function useAiConversation(id: string | undefined) {
  return useQuery<AiConversation>({
    queryKey: ['ai', 'conversations', id],
    queryFn: async () => {
      const { data } = await api.get(`/ai/conversations/${id}`)
      return data as AiConversation
    },
    enabled: Boolean(id),
  })
}

export function useDeleteAiConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/ai/conversations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', 'conversations'] }),
  })
}

export function useAiChatSync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      message: string
      useCase?: string
      provider?: string
      model?: string
      context?: string
    }) => {
      const { data } = await api.post('/ai/chat/sync', body)
      return data as { content: string; provider: string; model: string; usage: { input: number; output: number } }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai'] }),
  })
}

export function useAiSeoBrief() {
  return useMutation({
    mutationFn: async (body: {
      primaryKeyword: string
      secondaryKeywords?: string
      competitorUrls?: string
      serpContext?: string
      provider?: string
      model?: string
    }) => {
      const { data } = await api.post('/ai/seo/brief', body)
      return data as { brief: Record<string, unknown>; provider: string; model: string; usage: { input: number; output: number } }
    },
  })
}

export function useAiTaskPlan() {
  return useMutation({
    mutationFn: async (body: {
      taskTitle: string
      taskDescription?: string
      taskNotes?: string
      provider?: string
      model?: string
    }) => {
      const { data } = await api.post('/ai/task/plan', body)
      return data as { subtasks: unknown; usage: { input: number; output: number } }
    },
  })
}

export function useAiTaskSummarize() {
  return useMutation({
    mutationFn: async (body: {
      taskTitle: string
      taskDescription?: string
      comments?: string
      provider?: string
      model?: string
    }) => {
      const { data } = await api.post('/ai/task/summarize', body)
      return data as { summary: string; usage: { input: number; output: number } }
    },
  })
}

export function useAiTaskInsights() {
  return useMutation({
    mutationFn: async (body: { taskId: string; provider?: string; model?: string }) => {
      const { data } = await api.post('/ai/task/insights', body)
      return data as { insights: Record<string, unknown>; provider: string; model: string; usage: { input: number; output: number } }
    },
  })
}

export function useAiMyPendingPlan() {
  return useMutation({
    mutationFn: async (body?: { provider?: string; model?: string }) => {
      const { data } = await api.post('/ai/task/my-pending', body ?? {})
      return data as { plan: Record<string, unknown> | null; tasks: number; message?: string; usage?: { input: number; output: number } }
    },
  })
}

export function useAiReportDraft() {
  return useMutation({
    mutationFn: async (body: {
      date?: string
      additionalContext?: string
      provider?: string
      model?: string
    }) => {
      const { data } = await api.post('/ai/report/draft', body)
      return data as { draft: Record<string, unknown>; tasksUsed: number; usage: { input: number; output: number } }
    },
  })
}

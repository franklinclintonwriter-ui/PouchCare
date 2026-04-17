import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'

export interface WsFile {
  id: string
  path: string
  name: string
  isDirectory: boolean
  mimeType: string | null
  size: number
  content?: string | null
  createdAt: string
  updatedAt: string
}

export interface WsDetail {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  files: WsFile[]
  _count: { files: number }
}

export interface WsSummary {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  _count: { files: number }
}

export function useWorkspaces() {
  return useQuery<WsSummary[]>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data } = await api.get('/ai/workspace')
      return data as WsSummary[]
    },
  })
}

export function useWorkspace(id: string | undefined) {
  return useQuery<WsDetail>({
    queryKey: ['workspace', id],
    queryFn: async () => {
      const { data } = await api.get(`/ai/workspace/${id}`)
      return data as WsDetail
    },
    enabled: Boolean(id),
  })
}

export function useCreateWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; description?: string }) => {
      const { data } = await api.post('/ai/workspace', body)
      return data as WsSummary
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export function useDeleteWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/ai/workspace/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export function useCreateFile(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { path: string; content?: string; isDirectory?: boolean }) => {
      const { data } = await api.post(`/ai/workspace/${wsId}/files`, body)
      return data as WsFile
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', wsId] }),
  })
}

export function useUpdateFile(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ fileId, content }: { fileId: string; content: string }) => {
      const { data } = await api.put(`/ai/workspace/${wsId}/files/${fileId}`, { content })
      return data as WsFile
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', wsId] }),
  })
}

export function useDeleteFile(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fileId: string) => api.delete(`/ai/workspace/${wsId}/files/${fileId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', wsId] }),
  })
}

export function useWorkspaceCli(wsId: string) {
  return useMutation({
    mutationFn: async (command: string) => {
      const { data } = await api.post(`/ai/workspace/${wsId}/cli`, { command })
      return data as { output: string; operations: string[]; filesChanged: number }
    },
  })
}

export function useUpdateWorkspaceContext(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { contextNotes?: string; todos?: string }) => {
      const { data } = await api.put(`/ai/workspace/${wsId}/context`, body)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', wsId] }),
  })
}

export function useLinkConversation(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (conversationId: string) => {
      await api.put(`/ai/workspace/${wsId}/conversation`, { conversationId })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', wsId] }),
  })
}

// GitHub
export function useGitHubStatus() {
  return useQuery<{ connected: boolean; username?: string; avatarUrl?: string }>({
    queryKey: ['github-status'],
    queryFn: async () => { const { data } = await api.get('/ai/github/status'); return data as any },
    staleTime: 60_000,
  })
}

export function useGitHubAuthUrl() {
  return useMutation({
    mutationFn: async () => { const { data } = await api.get('/ai/github/auth-url'); return data as { url: string } },
  })
}

export function useGitHubCallback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (code: string) => { const { data } = await api.post('/ai/github/callback', { code }); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['github-status'] }),
  })
}

export function useGitHubRepos() {
  return useQuery<{ id: number; name: string; fullName: string; private: boolean; description: string | null; defaultBranch: string; url: string }[]>({
    queryKey: ['github-repos'],
    queryFn: async () => { const { data } = await api.get('/ai/github/repos'); return data as any },
    enabled: false,
  })
}

export function useGitHubClone(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { repoFullName: string; branch?: string }) => {
      const { data } = await api.post(`/ai/github/workspace/${wsId}/clone`, body)
      return data as { message: string; files: number }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', wsId] }),
  })
}

export function useGitHubPush(wsId: string) {
  return useMutation({
    mutationFn: async (message?: string) => {
      const { data } = await api.post(`/ai/github/workspace/${wsId}/push`, { message })
      return data as { message: string; sha: string }
    },
  })
}

export function useGitHubPull(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => { const { data } = await api.post(`/ai/github/workspace/${wsId}/pull`); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', wsId] }),
  })
}

// Integrations
export interface IntegrationProvider {
  id: string; name: string; description: string; icon: string; color: string
  category: string; authType: string; configured: boolean; docsUrl: string
  connected: boolean; displayName: string | null; avatarUrl: string | null; connectedAt: string | null
}

export function useIntegrations() {
  return useQuery<IntegrationProvider[]>({
    queryKey: ['integrations'],
    queryFn: async () => { const { data } = await api.get('/ai/integrations'); return data as IntegrationProvider[] },
    staleTime: 30_000,
  })
}

export function useConnectIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ provider, token, displayName }: { provider: string; token: string; displayName?: string }) => {
      const { data } = await api.post(`/ai/integrations/${provider}/connect`, { token, displayName })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  })
}

export function useDisconnectIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (provider: string) => api.delete(`/ai/integrations/${provider}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  })
}

// Supabase
export function useSupabaseStatus() {
  return useQuery<{ configured: boolean; url: string | null; hasStorage: boolean; hasRealtime: boolean }>({
    queryKey: ['supabase-status'],
    queryFn: async () => { const { data } = await api.get('/ai/supabase/status'); return data as any },
    staleTime: 60_000,
  })
}

export function useSupabasePresence(wsId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/ai/supabase/presence/${wsId}`)
      return data as { supabaseUrl: string; supabaseAnonKey: string; channel: string; user: { id: string; name: string; avatarUrl: string | null } }
    },
  })
}

export function useSupabaseDbQuery() {
  return useMutation({
    mutationFn: async (body: { query: string; autoExecute?: boolean }) => {
      const { data } = await api.post('/ai/supabase/db-query', body)
      return data as { sql: string | null; explanation: string; executed: boolean; rows?: unknown[]; error?: string }
    },
  })
}

export function useSupabaseAiAnalytics() {
  return useQuery<{ source: string; data: { provider: string; model: string; useCase: string; inputTokens: number; outputTokens: number; count: number }[] }>({
    queryKey: ['supabase-ai-analytics'],
    queryFn: async () => { const { data } = await api.get('/ai/supabase/analytics/ai-usage'); return data as any },
    staleTime: 30_000,
  })
}

export function useSupabaseToolAnalytics() {
  return useQuery<{ source: string; data: { toolType: string; count: number }[] }>({
    queryKey: ['supabase-tool-analytics'],
    queryFn: async () => { const { data } = await api.get('/ai/supabase/analytics/tool-usage'); return data as any },
    staleTime: 30_000,
  })
}

// SEO Research
export function useWorkspaceResearch(wsId: string) {
  return useMutation({
    mutationFn: async (body: { query: string; tools?: string[] }) => {
      const { data } = await api.post(`/ai/workspace/${wsId}/research`, body)
      return data as {
        summary: string
        steps: { tool: string; reason: string; success: boolean; error?: string }[]
        analysis: string
        rawData: unknown[]
      }
    },
  })
}

// Skills
export interface WorkspaceSkill {
  id: string; name: string; description: string | null; content: string
  category: string; enabled: boolean; priority: number; createdAt: string
}

export function useWorkspaceSkills(wsId: string | undefined) {
  return useQuery<WorkspaceSkill[]>({
    queryKey: ['workspace-skills', wsId],
    queryFn: async () => { const { data } = await api.get(`/ai/workspace/${wsId}/skills`); return data as WorkspaceSkill[] },
    enabled: Boolean(wsId),
  })
}

export function useCreateSkill(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; description?: string; content: string; category?: string }) => {
      const { data } = await api.post(`/ai/workspace/${wsId}/skills`, body)
      return data as WorkspaceSkill
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace-skills', wsId] }),
  })
}

export function useUpdateSkill(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ skillId, ...body }: { skillId: string; name?: string; content?: string; enabled?: boolean; priority?: number }) => {
      const { data } = await api.put(`/ai/workspace/${wsId}/skills/${skillId}`, body)
      return data as WorkspaceSkill
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace-skills', wsId] }),
  })
}

export function useDeleteSkill(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (skillId: string) => api.delete(`/ai/workspace/${wsId}/skills/${skillId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace-skills', wsId] }),
  })
}

// Settings
export function useWorkspaceSettings(wsId: string | undefined) {
  return useQuery<Record<string, unknown>>({
    queryKey: ['workspace-settings', wsId],
    queryFn: async () => { const { data } = await api.get(`/ai/workspace/${wsId}/settings`); return data as Record<string, unknown> },
    enabled: Boolean(wsId),
  })
}

export function useSaveWorkspaceSettings(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (settings: Record<string, unknown>) => { await api.put(`/ai/workspace/${wsId}/settings`, settings) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace-settings', wsId] }),
  })
}

// SSH
export function useSshStatus() {
  return useQuery<{ configured: boolean; connected: boolean; host?: string; info?: string }>({
    queryKey: ['ssh-status'],
    queryFn: async () => { const { data } = await api.get('/ai/ssh/status'); return data as any },
    staleTime: 60_000,
  })
}

export function useSshToggle(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => { const { data } = await api.post(`/ai/ssh/toggle/${wsId}`); return data as { sshEnabled: boolean } },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workspace', wsId] }); qc.invalidateQueries({ queryKey: ['ssh-status'] }) },
  })
}

export function useSshExec(wsId: string) {
  return useMutation({
    mutationFn: async (command: string) => {
      const { data } = await api.post(`/ai/ssh/exec/${wsId}`, { command })
      return data as { stdout: string; stderr: string; exitCode: number }
    },
  })
}

export function useSshSyncToServer(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => { const { data } = await api.post(`/ai/ssh/sync-to-server/${wsId}`); return data as { message: string; files: number } },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', wsId] }),
  })
}

export function useSshSyncFromServer(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => { const { data } = await api.post(`/ai/ssh/sync-from-server/${wsId}`); return data as { message: string; files: number } },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', wsId] }),
  })
}

export function useSshAgent(wsId: string) {
  return useMutation({
    mutationFn: async (body: { message: string; autoExecute?: boolean }) => {
      const { data } = await api.post('/ai/ssh/agent', { ...body, workspaceId: wsId })
      return data as {
        plan?: string[]; commands?: { cmd: string; reason: string; dangerous?: boolean }[]; summary?: string
        executed: boolean; results?: { cmd: string; reason: string; stdout: string; stderr: string; exitCode: number; success: boolean }[]
        succeeded?: number; total?: number
      }
    },
  })
}

// Copilot
export function useCopilotSuggest(wsId: string) {
  return useMutation({
    mutationFn: async (body: { filePath: string; content: string; cursorLine: number; cursorCol: number }) => {
      const { data } = await api.post(`/ai/workspace/${wsId}/copilot/suggest`, body)
      return data as { suggestion: string }
    },
  })
}

export function useCopilotAction(wsId: string) {
  return useMutation({
    mutationFn: async (body: { action: 'explain' | 'fix' | 'docs' | 'refactor'; code: string; filePath: string }) => {
      const { data } = await api.post(`/ai/workspace/${wsId}/copilot/action`, body)
      return data as { result: string; action: string }
    },
  })
}

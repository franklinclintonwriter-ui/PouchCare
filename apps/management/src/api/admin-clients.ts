/**
 * Typed client for /v1/admin/clients (unified PortalMember + ClientAccount).
 * Pattern matches the existing api/* files: react-query hooks over the shared `client.ts` axios instance.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'

export type UnifiedClientStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'CHURNED'

export interface UnifiedClient {
  id: string
  portalMemberId?: string
  clientAccountId?: string
  fullName: string
  email: string
  phone?: string
  whatsapp?: string
  country?: string
  avatarUrl?: string
  status: UnifiedClientStatus
  assignedManager?: string
  tags: string[]
  source?: string
  walletBalance: number
  totalSpentUsd: number
  totalOrders: number
  firstOrderDate?: string
  lastOrderDate?: string
  referralCode?: string
  createdAt: string
  updatedAt: string
}

export interface UnifiedClientDetail extends UnifiedClient {
  orders?: any[]
  walletTx?: any[]
  tickets?: any[]
}

export interface ListClientsQuery {
  page?: number
  limit?: number
  q?: string
  status?: UnifiedClientStatus | ''
  country?: string
  manager?: string
}

export function useAdminClients(params: ListClientsQuery = {}) {
  return useQuery({
    queryKey: ['admin', 'clients', params],
    queryFn: async () => {
      const res = await api.get('/admin/clients', { params })
      return res.data as { data: UnifiedClient[]; meta: { total: number; page: number; limit: number; totalPages: number } }
    },
    placeholderData: (prev) => prev,
  })
}

export function useAdminClient(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'clients', id],
    queryFn: async () => {
      const res = await api.get(`/admin/clients/${id}`)
      return res.data as UnifiedClientDetail
    },
    enabled: Boolean(id),
  })
}

export function useUpdateAdminClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; patch: Partial<Pick<UnifiedClient, 'fullName' | 'phone' | 'whatsapp' | 'country' | 'status' | 'assignedManager'>> }) => {
      const res = await api.patch(`/admin/clients/${input.id}`, input.patch)
      return res.data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'clients'] })
      qc.invalidateQueries({ queryKey: ['admin', 'clients', vars.id] })
    },
  })
}

export function useAdjustWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; deltaUsd: number; reason: string; note?: string; idempotencyKey: string }) => {
      const res = await api.post(`/admin/clients/${input.id}/adjust-wallet`, {
        deltaUsd: input.deltaUsd,
        reason: input.reason,
        note: input.note,
        idempotencyKey: input.idempotencyKey,
      })
      return res.data as { walletBalance: number; transactionId: string }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'clients'] })
      qc.invalidateQueries({ queryKey: ['admin', 'clients', vars.id] })
    },
  })
}

// ── ClientSegment (saved filter presets) ──────────────────────

export interface ClientSegmentParams {
  status?: string
  country?: string
  manager?: string
  q?: string
}

export interface ClientSegment {
  id: string
  name: string
  params: ClientSegmentParams
  createdById?: string | null
  createdAt: string
  updatedAt: string
}

export function useClientSegments() {
  return useQuery({
    queryKey: ['admin', 'clients', 'segments'],
    queryFn: async () => {
      const res = await api.get('/admin/clients/segments')
      return res.data as ClientSegment[]
    },
    // Segments are shared + rarely change — cache aggressively.
    staleTime: 60_000,
  })
}

export function useSaveClientSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; params: ClientSegmentParams }) => {
      const res = await api.post('/admin/clients/segments', input)
      return res.data as ClientSegment
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'clients', 'segments'] }),
  })
}

export function useDeleteClientSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/clients/segments/${id}`)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'clients', 'segments'] }),
  })
}

export function useMergeClients() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { sourceId: string; intoId: string }) => {
      const res = await api.post(`/admin/clients/${input.sourceId}/merge`, { intoId: input.intoId })
      return res.data as { sourceId: string; targetId: string; revertibleUntil: string }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'clients'] })
    },
  })
}

export function useClientActivity(id: string | undefined, params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['admin', 'clients', id, 'activity', params],
    queryFn: async () => {
      const res = await api.get(`/admin/clients/${id}/activity`, { params })
      return res.data as { data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }
    },
    enabled: Boolean(id),
  })
}

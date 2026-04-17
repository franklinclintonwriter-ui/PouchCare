/**
 * Typed client for /v1/admin/orders (unified PortalOrder + SalesOrder + ApkJob).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'

export type AdminOrderStatus =
  | 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'DELIVERED'
  | 'IN_REVISION' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'DISPUTED'
export type OrderKind = 'portal' | 'sales' | 'apk'
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED'

export interface AdminOrder {
  id: string
  kind: OrderKind
  displayId: string
  client: { id: string; fullName: string; email: string; avatarUrl?: string }
  service: { id?: string; name: string; kind: OrderKind }
  status: AdminOrderStatus
  paymentStatus: PaymentStatus
  amountUsd: number
  amountBdt?: number
  quantity: number
  requirements?: string
  deliveryLink?: string
  deadline?: string
  assigneeId?: string
  revisionCount: number
  rating?: number
  reviewNote?: string
  orderedAt: string
  deliveredAt?: string
}

export interface ListOrdersQuery {
  page?: number
  limit?: number
  q?: string
  kind?: OrderKind | ''
  status?: AdminOrderStatus | ''
}

export const ORDER_STATUS_DAG: Record<AdminOrderStatus, AdminOrderStatus[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['IN_REVISION', 'COMPLETED', 'DISPUTED'],
  IN_REVISION: ['DELIVERED', 'CANCELLED'],
  COMPLETED: ['REFUNDED', 'DISPUTED'],
  CANCELLED: [],
  REFUNDED: [],
  DISPUTED: ['REFUNDED', 'COMPLETED'],
}

export function canTransition(from: AdminOrderStatus, to: AdminOrderStatus) {
  return (ORDER_STATUS_DAG[from] ?? []).includes(to)
}

export function useAdminOrders(params: ListOrdersQuery = {}) {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: async () => {
      const res = await api.get('/admin/orders', { params })
      return res.data as { data: AdminOrder[]; meta: { total: number; page: number; limit: number; totalPages: number } }
    },
    placeholderData: (prev) => prev,
  })
}

function splitId(id: string): { kind: OrderKind; rawId: string } {
  const [k, ...rest] = id.split(':')
  return { kind: (k as OrderKind) ?? 'portal', rawId: rest.join(':') }
}

export function useAdminOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'orders', id],
    queryFn: async () => {
      const { kind, rawId } = splitId(id!)
      const res = await api.get(`/admin/orders/${kind}/${rawId}`)
      return res.data as AdminOrder
    },
    enabled: Boolean(id),
  })
}

export function useAdvanceOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; to: AdminOrderStatus; note?: string; deliveryLink?: string }) => {
      const { kind, rawId } = splitId(input.id)
      const res = await api.post(`/admin/orders/${kind}/${rawId}/advance`, {
        to: input.to,
        note: input.note,
        deliveryLink: input.deliveryLink,
      })
      return res.data as AdminOrder
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
      qc.invalidateQueries({ queryKey: ['admin', 'orders', vars.id] })
    },
  })
}

export interface CreateOrderInput {
  memberId: string
  serviceName: string
  amountUsd: number
  quantity?: number
  requirements?: string
  deadline?: string
  paymentMethod?: 'WALLET' | 'INVOICE'
}

export function useCreateAdminOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const res = await api.post('/admin/orders', input)
      return res.data as AdminOrder
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
  })
}

export interface BulkOrdersInput {
  ids: string[]
  action: 'advance' | 'cancel'
  to?: AdminOrderStatus
}

export interface BulkOrdersResult {
  okCount: number
  total: number
  results: Array<{ id: string; ok: boolean; error?: string }>
}

export function useBulkOrders() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: BulkOrdersInput) => {
      const res = await api.post('/admin/orders/bulk', input)
      return res.data as BulkOrdersResult
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
  })
}

export function useRefundOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; amountUsd: number; method: 'WALLET' | 'INVOICE_VOID' | 'EXTERNAL'; reason: string; idempotencyKey: string }) => {
      const { kind, rawId } = splitId(input.id)
      const res = await api.post(`/admin/orders/${kind}/${rawId}/refund`, {
        amountUsd: input.amountUsd,
        method: input.method,
        reason: input.reason,
        idempotencyKey: input.idempotencyKey,
      })
      return res.data as { orderStatus: AdminOrderStatus; refundId: string; walletDelta?: number }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
      qc.invalidateQueries({ queryKey: ['admin', 'orders', vars.id] })
    },
  })
}

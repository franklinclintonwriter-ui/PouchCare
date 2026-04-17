/**
 * Typed client for /v1/admin/audit — read-only audit log surface.
 */
import { useQuery } from '@tanstack/react-query'
import api from './client'

export interface AuditEntry {
  id: string
  createdAt: string
  actorId?: string
  actorRole?: string
  action: string
  resourceKind: string
  resourceId: string
  ip?: string
  userAgent?: string
  metadata?: any
}

export interface AuditQuery {
  page?: number
  limit?: number
  action?: string
  resourceKind?: string
  actorId?: string
  since?: string
  until?: string
}

export function useAdminAudit(params: AuditQuery = {}) {
  return useQuery({
    queryKey: ['admin', 'audit', params],
    queryFn: async () => {
      const res = await api.get('/admin/audit', { params })
      return res.data as { data: AuditEntry[]; meta: { total: number; page: number; limit: number; totalPages: number } }
    },
    placeholderData: (prev) => prev,
  })
}

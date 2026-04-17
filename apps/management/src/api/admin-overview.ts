/**
 * Typed client for /v1/admin/overview — KPI dashboard for admin home.
 */
import { useQuery } from '@tanstack/react-query'
import api from './client'

export interface AdminOverview {
  clients: { total: number; newThisWeek: number; activePct: number }
  orders: {
    total: number
    byStatus: Record<string, number>
    overdue: number
    unassigned: number
  }
  revenue: { mtdUsd: number; mtdBdt?: number }
  support: { open: number; overdueSla: number }
  generatedAt: string
}

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const res = await api.get('/admin/overview')
      return res.data as AdminOverview
    },
    staleTime: 60_000,
  })
}

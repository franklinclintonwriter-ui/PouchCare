/**
 * Typed client for /v1/services (backend already exists).
 * The Notion plan calls for these to be moved under /v1/admin/services with
 * a ServicePlan model in Phase 3 — keeping the path stable for now means no
 * server-side migration is required to ship the catalog UI.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'

export type ServiceStatus = 'Active' | 'Inactive' | 'Draft' | 'Archived'

export interface AdminServiceRow {
  id: string
  name: string
  slug?: string
  category?: string | null
  status?: ServiceStatus | string | null
  basePriceUsd?: number | null
  priceBdt?: number | null
  turnaroundDays?: number | null
  shortDescription?: string | null
  fullDescription?: string | null
  icon?: string | null
  featured?: boolean | null
  displayOrder?: number | null
  metaTitle?: string | null
  metaDescription?: string | null
}

export interface ListServicesQuery {
  category?: string
  status?: ServiceStatus | string
}

export function useAdminServices(params: ListServicesQuery = {}) {
  return useQuery({
    queryKey: ['admin', 'services', params],
    queryFn: async () => {
      // Use the admin endpoint so Inactive/Draft are visible too.
      const res = await api.get('/admin/services', { params })
      return res.data as AdminServiceRow[]
    },
    placeholderData: (prev) => prev,
  })
}

export function useAdminService(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'services', id],
    queryFn: async () => {
      const res = await api.get(`/admin/services/${id}`)
      return res.data as AdminServiceRow
    },
    enabled: Boolean(id),
  })
}

export interface ServicePerformance {
  serviceId: string
  serviceName: string
  orders30d: number
  orders90d: number
  revenue30dUsd: number
  revenue90dUsd: number
  avgRating: number | null
  byStatus: Record<string, number>
  generatedAt: string
}

// ── ServicePlan ───────────────────────────────────────────────

export interface ServicePlan {
  id: string
  serviceId: string
  name: string
  priceUsd: number
  priceBdt?: number | null
  deliveryDays?: number | null
  features: string[]
  isPopular: boolean
  displayOrder: number
  createdAt?: string
  updatedAt?: string
}

export function useServicePlans(serviceId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'services', serviceId, 'plans'],
    queryFn: async () => {
      const res = await api.get(`/admin/services/${serviceId}/plans`)
      return res.data as ServicePlan[]
    },
    enabled: Boolean(serviceId),
  })
}

export function useCreateServicePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { serviceId: string; plan: Omit<ServicePlan, 'id' | 'serviceId' | 'createdAt' | 'updatedAt'> }) => {
      const res = await api.post(`/admin/services/${input.serviceId}/plans`, input.plan)
      return res.data as ServicePlan
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['admin', 'services', vars.serviceId, 'plans'] }),
  })
}

export function useUpdateServicePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { serviceId: string; planId: string; patch: Partial<ServicePlan> }) => {
      const res = await api.patch(`/admin/services/${input.serviceId}/plans/${input.planId}`, input.patch)
      return res.data as ServicePlan
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['admin', 'services', vars.serviceId, 'plans'] }),
  })
}

export function useDeleteServicePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { serviceId: string; planId: string }) => {
      const res = await api.delete(`/admin/services/${input.serviceId}/plans/${input.planId}`)
      return res.data
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['admin', 'services', vars.serviceId, 'plans'] }),
  })
}

export function useServicePerformance(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'services', id, 'performance'],
    queryFn: async () => {
      const res = await api.get(`/admin/services/${id}/performance`)
      return res.data as ServicePerformance
    },
    enabled: Boolean(id),
    staleTime: 60_000,
  })
}

export function useCreateAdminService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<AdminServiceRow> & { name: string; slug: string }) => {
      const res = await api.post('/services', input)
      return res.data as AdminServiceRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'services'] }),
  })
}

export function useUpdateAdminService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; patch: Partial<AdminServiceRow> }) => {
      const res = await api.patch(`/services/${input.id}`, input.patch)
      return res.data as AdminServiceRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'services'] }),
  })
}

export function useDeleteAdminService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/services/${id}`)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'services'] }),
  })
}

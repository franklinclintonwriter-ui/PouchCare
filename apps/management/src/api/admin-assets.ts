/**
 * Typed client for /v1/admin/assets/client/:clientId — client-scoped asset aggregator.
 */
import { useQuery } from '@tanstack/react-query'
import api from './client'

export interface ClientAssets {
  websites: any[]
  domains: any[]
  servers: any[]
}

export function useClientAssets(clientId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'assets', 'client', clientId],
    queryFn: async () => {
      const res = await api.get(`/admin/assets/client/${clientId}`)
      return res.data as ClientAssets
    },
    enabled: Boolean(clientId),
  })
}

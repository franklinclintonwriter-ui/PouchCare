/**
 * Staff global search (`/v1/search`). Domain results are management discovery, not portal “my domains”.
 */
import { useQuery } from '@tanstack/react-query';
import api from './client';

export type SearchType = 'staff' | 'task' | 'project' | 'lead' | 'client' | 'domain';

export type GlobalSearchResults = {
  staff?: Array<{ id: string; name: string; email: string; systemRole: string; branch?: string }>;
  tasks?: Array<{ id: string; taskId: number; title: string; status: string; priority: string }>;
  projects?: Array<{ id: string; projectId: number; name: string; status: string }>;
  leads?: Array<{ id: string; leadId: number; company: string; stage: string }>;
  clients?: Array<{ id: string; fullName: string; email: string; status: string }>;
  domains?: Array<{ id: string; domainName: string; status: string }>;
};

export type GlobalSearchResponse = {
  query: string;
  results: GlobalSearchResults;
};

export function useGlobalSearch(query: string, type?: SearchType) {
  const q = query.trim();
  return useQuery<GlobalSearchResponse>({
    queryKey: ['global-search', q, type],
    queryFn: async () => {
      const { data } = await api.get('/search', { params: { q, type } });
      return {
        query: data?.query ?? q,
        results: data?.results ?? {},
      };
    },
    enabled: q.length >= 2,
    staleTime: 30_000,
  });
}

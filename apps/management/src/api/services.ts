import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { Service, BacklinkPackage } from '@/types/models';

type RawService = {
  id: string;
  name: string;
  category?: string | null;
  status?: string | null;
  basePriceUsd?: number | null;
  shortDescription?: string | null;
  icon?: string | null;
};

type RawBacklinkPackage = {
  id: string;
  name: string;
  type?: string | null;
  daRange?: string | null;
  status?: string | null;
  pricePerLink?: number | null;
  priceX10?: number | null;
  priceX50?: number | null;
  priceX100?: number | null;
  priceX1000?: number | null;
  turnaroundDays?: number | null;
  featured?: boolean | null;
  notes?: string | null;
};

function mapService(raw: RawService): Service {
  const base = raw.basePriceUsd ?? 0;
  return {
    id: raw.id,
    name: raw.name,
    description: raw.shortDescription ?? '',
    category: raw.category ?? 'General',
    priceRange: { min: base, max: base },
    isActive: (raw.status ?? '').toLowerCase() === 'active',
    orderCount: 0,
    icon: raw.icon ?? 'circle',
  };
}

function mapBacklinkPackage(raw: RawBacklinkPackage): BacklinkPackage {
  let quantity = 1;
  if (raw.priceX100 != null) quantity = 100;
  else if (raw.priceX50 != null) quantity = 50;
  else if (raw.priceX10 != null) quantity = 10;
  const totalPrice =
    (quantity === 100 ? raw.priceX100 : quantity === 50 ? raw.priceX50 : quantity === 10 ? raw.priceX10 : null)
    ?? (raw.pricePerLink ?? 0);
  return {
    id: raw.id,
    name: raw.name,
    tier: 'standard',
    daRange: raw.daRange ?? '-',
    linkType: raw.type ?? 'General',
    quantity,
    price: totalPrice,
    turnaround: raw.turnaroundDays ? `${raw.turnaroundDays} days` : '-',
    isPopular: !!raw.featured,
  };
}

export function useServices(category?: string) {
  return useQuery<Service[]>({
    queryKey: ['services', category],
    queryFn: async () => {
      const { data } = await api.get('/services', { params: category ? { category } : undefined });
      const rows = Array.isArray(data) ? data : data.data ?? [];
      return rows.map((item: RawService) => mapService(item));
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/services/admin', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id: string }) => api.put(`/services/admin/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/services/admin/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useBacklinkPackages() {
  return useQuery<BacklinkPackage[]>({
    queryKey: ['backlink-packages'],
    queryFn: async () => {
      const { data } = await api.get('/backlink-packages');
      const rows = Array.isArray(data) ? data : data.data ?? [];
      return rows.map((item: RawBacklinkPackage) => mapBacklinkPackage(item));
    },
  });
}

export type BacklinkPackageRecord = {
  id: string;
  name: string;
  type?: string | null;
  daRange?: string | null;
  status?: string | null;
  pricePerLink: number;
  priceX10?: number | null;
  priceX50?: number | null;
  priceX100?: number | null;
  priceX1000?: number | null;
  turnaroundDays?: number | null;
  featured?: boolean | null;
  notes?: string | null;
};

export function useBacklinkPackageRecords() {
  return useQuery<BacklinkPackageRecord[]>({
    queryKey: ['backlink-package-records'],
    queryFn: async () => {
      const { data } = await api.get('/backlink-packages', { params: { limit: 500 } });
      const rows = Array.isArray(data) ? data : data.data ?? [];
      return rows as BacklinkPackageRecord[];
    },
  });
}

export type BacklinkPackageUpsert = {
  name: string;
  type?: string;
  daRange?: string;
  status?: string;
  pricePerLink: number;
  priceX10?: number;
  priceX50?: number;
  priceX100?: number;
  priceX1000?: number;
  turnaroundDays?: number;
  featured?: boolean;
  notes?: string;
};

export function useCreateBacklinkPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BacklinkPackageUpsert) => api.post('/backlink-packages', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backlink-packages'] });
      qc.invalidateQueries({ queryKey: ['backlink-package-records'] });
    },
  });
}

export function useUpdateBacklinkPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<BacklinkPackageUpsert> }) => api.put(`/backlink-packages/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backlink-packages'] });
      qc.invalidateQueries({ queryKey: ['backlink-package-records'] });
    },
  });
}

export function useArchiveBacklinkPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/backlink-packages/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backlink-packages'] });
      qc.invalidateQueries({ queryKey: ['backlink-package-records'] });
    },
  });
}

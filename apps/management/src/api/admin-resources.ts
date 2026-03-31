import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { PaginatedResponse, QueryParams } from '@/types/api';

type RawBranch = {
  id: string;
  name: string;
  country?: string | null;
  city?: string | null;
  type?: string | null;
  status?: string | null;
  branchManager?: string | null;
  staffCount?: number | null;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
};

type RawDevice = {
  id: string;
  staffMemberId: string;
  deviceName: string;
  deviceType?: string | null;
  ipAddress?: string | null;
  status?: string | null;
  branch?: string | null;
  createdAt: string;
};

type RawClientAccount = {
  id: string;
  clientName?: string | null;
  email?: string | null;
  country?: string | null;
  status?: string | null;
  totalSpentUsd?: number | null;
  totalOrders?: number | null;
  createdAt: string;
};

type RawExchangeRate = {
  id: string;
  usdToBdt: number;
  usdToAed?: number | null;
  bdtToAed?: number | null;
  effectiveDate: string;
  createdAt: string;
};

export interface Branch {
  id: string;
  name: string;
  country?: string;
  city?: string;
  type?: string;
  status: string;
  branchManager?: string;
  staffCount?: number;
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface Device {
  id: string;
  staffMemberId: string;
  deviceName: string;
  deviceType?: string;
  ipAddress?: string;
  status: string;
  branch?: string;
  createdAt: string;
}

export interface ClientAccount {
  id: string;
  clientName: string;
  email: string;
  country?: string;
  status: string;
  totalSpentUsd: number;
  totalOrders: number;
  createdAt: string;
}

export interface ExchangeRate {
  id: string;
  usdToBdt: number;
  usdToAed?: number;
  bdtToAed?: number;
  effectiveDate: string;
  createdAt: string;
}

function normalizeStatus(status?: string | null): string {
  const value = (status ?? '').trim().toLowerCase();
  if (!value) return 'Active';
  if (value === 'active') return 'Active';
  if (value === 'inactive') return 'Inactive';
  if (value === 'suspended') return 'Suspended';
  if (value === 'pending') return 'Pending';
  return status ?? 'Active';
}

function mapBranch(raw: RawBranch): Branch {
  return {
    id: raw.id,
    name: raw.name,
    country: raw.country ?? undefined,
    city: raw.city ?? undefined,
    type: raw.type ?? undefined,
    status: normalizeStatus(raw.status),
    branchManager: raw.branchManager ?? undefined,
    staffCount: raw.staffCount ?? 0,
    email: raw.email ?? undefined,
    phone: raw.phone ?? undefined,
    createdAt: raw.createdAt,
  };
}

function mapDevice(raw: RawDevice): Device {
  return {
    id: raw.id,
    staffMemberId: raw.staffMemberId,
    deviceName: raw.deviceName,
    deviceType: raw.deviceType ?? undefined,
    ipAddress: raw.ipAddress ?? undefined,
    status: normalizeStatus(raw.status),
    branch: raw.branch ?? undefined,
    createdAt: raw.createdAt,
  };
}

function mapClientAccount(raw: RawClientAccount): ClientAccount {
  return {
    id: raw.id,
    clientName: raw.clientName ?? 'Client',
    email: raw.email ?? '-',
    country: raw.country ?? undefined,
    status: normalizeStatus(raw.status),
    totalSpentUsd: raw.totalSpentUsd ?? 0,
    totalOrders: raw.totalOrders ?? 0,
    createdAt: raw.createdAt,
  };
}

function mapExchangeRate(raw: RawExchangeRate): ExchangeRate {
  return {
    id: raw.id,
    usdToBdt: raw.usdToBdt,
    usdToAed: raw.usdToAed ?? undefined,
    bdtToAed: raw.bdtToAed ?? undefined,
    effectiveDate: raw.effectiveDate,
    createdAt: raw.createdAt,
  };
}

export function useBranches(params?: QueryParams) {
  return useQuery<PaginatedResponse<Branch>>({
    queryKey: ['admin-branches', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/branches', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows.map((item: RawBranch) => mapBranch(item)) };
    },
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Branch>) => api.post('/admin/branches', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-branches'] }),
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Branch> & { id: string }) => api.put(`/admin/branches/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-branches'] }),
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/branches/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-branches'] }),
  });
}

export function useDevices(params?: QueryParams) {
  return useQuery<PaginatedResponse<Device>>({
    queryKey: ['admin-devices', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/devices', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows.map((item: RawDevice) => mapDevice(item)) };
    },
  });
}

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Device>) => api.post('/admin/devices', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-devices'] }),
  });
}

export function useClientAccounts(params?: QueryParams) {
  return useQuery<PaginatedResponse<ClientAccount>>({
    queryKey: ['admin-client-accounts', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/client-accounts', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows.map((item: RawClientAccount) => mapClientAccount(item)) };
    },
  });
}

export function useCreateClientAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ClientAccount>) => api.post('/admin/client-accounts', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-client-accounts'] }),
  });
}

export function useExchangeRates(params?: QueryParams) {
  return useQuery<PaginatedResponse<ExchangeRate>>({
    queryKey: ['admin-exchange-rates', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/exchange-rates', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows.map((item: RawExchangeRate) => mapExchangeRate(item)) };
    },
  });
}

export function useCreateExchangeRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ExchangeRate>) => api.post('/admin/exchange-rates', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-exchange-rates'] }),
  });
}

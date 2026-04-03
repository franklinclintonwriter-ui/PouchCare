import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { QueryParams, PaginatedResponse } from '@/types/api';
import type { Lead, SalesOrder } from '@/types/models';

type RawLead = {
  id: string;
  company: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  stage?: string | null;
  source?: string | null;
  estimatedValue?: number | null;
  budgetUsd?: number | null;
  assignedTo?: string | null;
  owner?: string | null;
  lastContactDate?: string | null;
  notes?: string | null;
  createdAt: string;
};

type RawSalesOrder = {
  id: string;
  orderId?: number;
  clientName: string;
  service?: string | null;
  amountUsd?: number | null;
  paymentStatus?: string | null;
  orderDate?: string;
  assignedTo?: string | null;
};

function mapLead(raw: RawLead): Lead {
  return {
    id: raw.id,
    name: raw.contactName?.trim() || raw.company,
    email: raw.email ?? '',
    company: raw.company,
    phone: raw.phone ?? '',
    stage: (raw.stage ?? 'NEW') as Lead['stage'],
    value: raw.estimatedValue ?? raw.budgetUsd ?? 0,
    assigneeId: raw.assignedTo ?? raw.owner ?? '',
    assigneeName: raw.assignedTo ?? raw.owner ?? 'Unassigned',
    source: raw.source ?? 'Unknown',
    lastContactDate: raw.lastContactDate ?? '-',
    notes: raw.notes ?? '',
    createdAt: raw.createdAt,
  };
}

function mapSalesOrder(raw: RawSalesOrder): SalesOrder {
  return {
    id: raw.id,
    number: raw.orderId ? `SO-${String(raw.orderId).padStart(4, '0')}` : `SO-${raw.id.slice(0, 8).toUpperCase()}`,
    clientName: raw.clientName,
    items: raw.service ? [{ name: raw.service, qty: 1, price: raw.amountUsd ?? 0 }] : [],
    total: raw.amountUsd ?? 0,
    status: (raw.paymentStatus ?? 'UNPAID') as SalesOrder['status'],
    date: raw.orderDate ?? '-',
    assigneeName: raw.assignedTo ?? 'Unassigned',
  };
}

export function useLeads(params?: QueryParams) {
  return useQuery<PaginatedResponse<Lead>>({
    queryKey: ['leads', params],
    queryFn: async () => {
      const apiParams = { ...(params ?? {}) } as Record<string, unknown>;
      // UI filter uses "status" key for stage selector.
      if (typeof apiParams.status === 'string' && !apiParams.stage) {
        apiParams.stage = apiParams.status;
      }
      delete apiParams.status;
      const { data } = await api.get('/crm/leads', { params: apiParams });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows.map((item: RawLead) => mapLead(item)) };
    },
  });
}

export function useLead(id: string) {
  return useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn: async () => {
      const { data } = await api.get(`/crm/leads/${id}`);
      return mapLead(data as RawLead);
    },
    enabled: !!id,
  });
}

export function useLeadsByStage() {
  return useQuery<Record<string, Lead[]>>({
    queryKey: ['leads-by-stage'],
    queryFn: async () => {
      const { data } = await api.get('/crm/leads', { params: { limit: 200 } });
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const list = rows.map((item: RawLead) => mapLead(item));
      const grouped: Record<string, Lead[]> = {};
      list.forEach((l: Lead) => { (grouped[l.stage] ??= []).push(l); });
      return grouped;
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/crm/leads', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); qc.invalidateQueries({ queryKey: ['leads-by-stage'] }); },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id: string }) => api.put(`/crm/leads/${id}`, body),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['leads'] }); qc.invalidateQueries({ queryKey: ['lead', v.id] }); qc.invalidateQueries({ queryKey: ['leads-by-stage'] }); },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/crm/leads/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); qc.invalidateQueries({ queryKey: ['leads-by-stage'] }); },
  });
}

export function useSalesOrders(params?: QueryParams) {
  return useQuery<PaginatedResponse<SalesOrder>>({
    queryKey: ['sales-orders', params],
    queryFn: async () => {
      const { data } = await api.get('/crm/orders', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows.map((item: RawSalesOrder) => mapSalesOrder(item)) };
    },
  });
}

export function useCreateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/crm/orders', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales-orders'] }),
  });
}

export function useUpdateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id: string }) => api.put(`/crm/orders/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales-orders'] }),
  });
}

export function useDeleteSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/crm/orders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales-orders'] }),
  });
}

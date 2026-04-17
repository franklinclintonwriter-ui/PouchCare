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

type PipelineColumnApi = {
  stage: string;
  count: number;
  totalValue: number;
  leads: RawLead[];
};

/** Server-built pipeline (accurate counts / sums per stage; up to 20 cards per column). */
export function usePipeline() {
  return useQuery({
    queryKey: ['crm-pipeline'],
    queryFn: async () => {
      const res = await api.get('/crm/pipeline');
      const raw = res.data as {
        data: PipelineColumnApi[];
        meta?: { crmView?: 'full' | 'branch_manager' };
      };
      const columns = raw.data ?? [];
      const grouped: Record<string, Lead[]> = {};
      const columnStats: Record<string, { count: number; totalValue: number }> = {};
      for (const col of columns) {
        grouped[col.stage] = col.leads.map((r) => mapLead(r));
        columnStats[col.stage] = { count: col.count, totalValue: col.totalValue };
      }
      return {
        grouped,
        columnStats,
        crmView: raw.meta?.crmView,
      };
    },
  });
}

export type CreateLeadInput = {
  company: string;
  contactName?: string;
  email?: string;
  phone?: string;
  source?: string;
  estimatedValue?: number;
  stage?: string;
};

export type UpdateLeadInput = {
  id: string;
  company?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  stage?: string;
  source?: string;
  estimatedValue?: number;
  notes?: string;
};

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateLeadInput) => api.post('/crm/leads', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); qc.invalidateQueries({ queryKey: ['leads-by-stage'] }); },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateLeadInput) => api.put(`/crm/leads/${id}`, body),
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

export function useSalesOrder(id: string | undefined) {
  return useQuery<SalesOrder>({
    queryKey: ['sales-order', id],
    queryFn: async () => {
      const { data } = await api.get(`/crm/orders/${id}`);
      return mapSalesOrder(data as RawSalesOrder);
    },
    enabled: !!id,
  });
}

/** Full API row for staff order detail (matches Prisma SalesOrder). */
export type SalesOrderRecord = {
  id: string;
  orderId: number;
  clientName: string;
  service?: string | null;
  status?: string | null;
  paymentStatus: string;
  amountUsd: number;
  assignedTo?: string | null;
  branch?: string | null;
  orderDate: string;
  deadline?: string | null;
  deliveryDate?: string | null;
  deliveryLink?: string | null;
  invoiceReference?: string | null;
  revisionCount?: number;
  notes?: string | null;
};

export function useSalesOrderRecord(id: string | undefined) {
  return useQuery<SalesOrderRecord>({
    queryKey: ['sales-order-record', id],
    queryFn: async () => {
      const { data } = await api.get(`/crm/orders/${id}`);
      return data as SalesOrderRecord;
    },
    enabled: !!id,
  });
}

export type CreateSalesOrderInput = {
  clientName: string;
  service?: string;
  amountUsd: number;
  paymentStatus?: string;
  status?: string;
  assignedTo?: string;
  branch?: string;
  deadline?: string;
  invoiceReference?: string;
  notes?: string;
};

export type UpdateSalesOrderInput = {
  id: string;
  clientName?: string;
  service?: string;
  amountUsd?: number;
  paymentStatus?: string;
  status?: string;
  assignedTo?: string;
  branch?: string;
  deadline?: string;
  deliveryLink?: string;
  invoiceReference?: string;
  notes?: string;
};

export function useCreateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSalesOrderInput) => api.post('/crm/orders', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales-orders'] }),
  });
}

export function useUpdateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateSalesOrderInput) => api.put(`/crm/orders/${id}`, body),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['sales-orders'] });
      qc.invalidateQueries({ queryKey: ['sales-order', v.id] });
      qc.invalidateQueries({ queryKey: ['sales-order-record', v.id] });
    },
  });
}

export function useDeleteSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/crm/orders/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['sales-orders'] });
      qc.removeQueries({ queryKey: ['sales-order', id] });
      qc.removeQueries({ queryKey: ['sales-order-record', id] });
    },
  });
}

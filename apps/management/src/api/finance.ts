import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { QueryParams, PaginatedResponse } from '@/types/api';
import type { Invoice, Expense, MonthlyRevenue } from '@/types/models';

type RawInvoice = {
  id: string;
  invoiceNumber?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  amountUsd: number;
  status?: string | null;
  issueDate: string;
  dueDate?: string | null;
  paidDate?: string | null;
};

type RawExpense = {
  id: string;
  title?: string | null;
  category?: string | null;
  amountUsd: number;
  paidBy?: string | null;
  expenseDate: string;
  receiptUrl?: string | null;
  status?: string | null;
};

type RawMonthlyRevenue = {
  month: string;
  totalRevenueUsd?: number | null;
  totalExpensesUsd?: number | null;
  netProfitUsd?: number | null;
};

function normalizePaymentStatus(status?: string | null): Invoice['status'] {
  const value = (status ?? '').trim().toUpperCase();
  if (value === 'PAID' || value === 'UNPAID' || value === 'PARTIAL' || value === 'OVERDUE' || value === 'REFUNDED') {
    return value;
  }
  if (value === 'DRAFT' || value === 'PENDING') return 'UNPAID';
  return 'UNPAID';
}

function normalizeApprovalStatus(status?: string | null): Expense['status'] {
  const value = (status ?? '').trim().toUpperCase();
  if (
    value === 'WAITING' ||
    value === 'SUBMITTED' ||
    value === 'APPROVED_MGR' ||
    value === 'REJECTED_MGR' ||
    value === 'ESCALATED' ||
    value === 'VERIFIED'
  ) {
    return value;
  }
  if (value === 'PENDING') return 'WAITING';
  if (value === 'APPROVED') return 'APPROVED_MGR';
  if (value === 'REJECTED') return 'REJECTED_MGR';
  return 'SUBMITTED';
}

function mapInvoice(raw: RawInvoice): Invoice {
  const status = normalizePaymentStatus(raw.status);
  const total = raw.amountUsd ?? 0;
  return {
    id: raw.id,
    number: raw.invoiceNumber ?? raw.id.slice(0, 8).toUpperCase(),
    clientName: raw.clientName ?? 'Client',
    clientEmail: raw.clientEmail ?? '-',
    items: [],
    subtotal: total,
    tax: 0,
    total,
    paidAmount: status === 'PAID' ? total : 0,
    status,
    issueDate: raw.issueDate,
    dueDate: raw.dueDate ?? raw.issueDate,
  };
}

function mapExpense(raw: RawExpense): Expense {
  return {
    id: raw.id,
    description: raw.title ?? 'Expense',
    category: raw.category ?? 'General',
    amount: raw.amountUsd ?? 0,
    staffId: raw.paidBy ?? '',
    staffName: raw.paidBy ?? 'Staff',
    date: raw.expenseDate,
    receiptUrl: raw.receiptUrl ?? undefined,
    status: normalizeApprovalStatus(raw.status),
  };
}

function mapMonthlyRevenue(raw: RawMonthlyRevenue): MonthlyRevenue {
  const revenue = raw.totalRevenueUsd ?? 0;
  const expenses = raw.totalExpensesUsd ?? 0;
  return {
    month: raw.month,
    revenue,
    expenses,
    profit: raw.netProfitUsd ?? revenue - expenses,
  };
}

export function useInvoices(params?: QueryParams) {
  return useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const { data } = await api.get('/finance/invoices', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawInvoice) => mapInvoice(item)),
      };
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/finance/invoices', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id: string }) => api.put(`/finance/invoices/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useExpenses(params?: QueryParams) {
  return useQuery<PaginatedResponse<Expense>>({
    queryKey: ['expenses', params],
    queryFn: async () => {
      const { data } = await api.get('/finance/expenses', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawExpense) => mapExpense(item)),
      };
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/finance/expenses', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id: string }) => api.put(`/finance/expenses/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useRevenue(year?: number) {
  return useQuery<MonthlyRevenue[]>({
    queryKey: ['revenue', year],
    queryFn: async () => {
      const { data } = await api.get('/finance/revenue/monthly', { params: year ? { year } : undefined });
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      return rows.map((item: RawMonthlyRevenue) => mapMonthlyRevenue(item));
    },
  });
}

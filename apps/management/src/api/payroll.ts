import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { PaginatedResponse } from '@/types/api';
import type { PayrollEntry } from '@/types/models';
import { normalizeRole } from '@/utils/permissions';

type RawPayrollEntry = {
  id: string;
  staffMemberId: string;
  staffName: string;
  systemRole?: string | null;
  branch?: string | null;
  month: string;
  year: number;
  baseSalary: number;
  bonus?: number | null;
  deductions?: number | null;
  netSalary: number;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
};

const MONTH_NAME_TO_NUM: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const MONTH_NUM_TO_NAME = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function normalizePaymentStatus(status?: string | null): PayrollEntry['status'] {
  const value = (status ?? '').trim().toLowerCase();
  if (value === 'paid') return 'PAID';
  if (value === 'partial') return 'PARTIAL';
  if (value === 'overdue') return 'OVERDUE';
  if (value === 'refunded') return 'REFUNDED';
  return 'UNPAID';
}

function toMonthNumber(month: string): number {
  const parsed = Number(month);
  if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 12) return parsed;
  return MONTH_NAME_TO_NUM[month.trim().toLowerCase()] ?? new Date().getMonth() + 1;
}

function mapPayrollEntry(raw: RawPayrollEntry): PayrollEntry {
  return {
    id: raw.id,
    staffId: raw.staffMemberId,
    staffName: raw.staffName,
    role: normalizeRole(raw.systemRole) ?? 'STAFF',
    branch: raw.branch ?? '-',
    month: toMonthNumber(raw.month),
    year: raw.year,
    baseSalary: raw.baseSalary,
    bonus: raw.bonus ?? 0,
    deductions: raw.deductions ?? 0,
    netPay: raw.netSalary,
    status: normalizePaymentStatus(raw.paymentStatus),
    paymentMethod: raw.paymentMethod ?? undefined,
    notes: raw.notes ?? undefined,
  };
}

interface PayrollFilters {
  month?: number;
  year?: number;
  staffMemberId?: string;
  page?: number;
  limit?: number;
}

export function usePayroll(filters: PayrollFilters = {}) {
  const { month, year, staffMemberId, page = 1, limit = 20 } = filters;
  return useQuery<PaginatedResponse<PayrollEntry>>({
    queryKey: ['payroll', month, year, staffMemberId, page, limit],
    queryFn: async () => {
      const monthName = typeof month === 'number' && month >= 1 && month <= 12 ? MONTH_NUM_TO_NAME[month - 1] : undefined;
      const { data } = await api.get('/payroll', { params: { month: monthName, year, staffMemberId, page, limit } });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawPayrollEntry) => mapPayrollEntry(item)),
      };
    },
  });
}

interface CreatePayrollInput {
  staffMemberId: string;
  month: string;
  year: number;
  baseSalary: number;
  bonus?: number;
  deductions?: number;
  paymentMethod?: string;
  notes?: string;
}

export function useCreatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePayrollInput) => api.post('/payroll', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }),
  });
}

interface UpdatePayrollInput {
  baseSalary?: number;
  bonus?: number;
  deductions?: number;
  paymentMethod?: string;
  notes?: string;
}

export function useUpdatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdatePayrollInput & { id: string }) =>
      api.put(`/payroll/${id}`, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['payroll'] });
      qc.invalidateQueries({ queryKey: ['payroll-entry', variables.id] });
    },
  });
}

export function useDeletePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/payroll/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }),
  });
}

export function usePayrollEntry(id: string) {
  return useQuery<PayrollEntry>({
    queryKey: ['payroll-entry', id],
    queryFn: async () => {
      const { data } = await api.get(`/payroll/${id}`);
      return mapPayrollEntry(data as RawPayrollEntry);
    },
    enabled: !!id,
  });
}

export function useMarkPayrollPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentMethod }: { id: string; paymentMethod?: string }) =>
      api.put(`/payroll/${id}/mark-paid`, { paymentMethod }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['payroll'] });
      qc.invalidateQueries({ queryKey: ['payroll-entry', variables.id] });
    },
  });
}

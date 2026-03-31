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
  };
}

export function usePayroll(month?: number, year?: number, page = 1, limit = 20) {
  return useQuery<PaginatedResponse<PayrollEntry>>({
    queryKey: ['payroll', month, year, page, limit],
    queryFn: async () => {
      const monthName = typeof month === 'number' && month >= 1 && month <= 12 ? MONTH_NUM_TO_NAME[month - 1] : undefined;
      const { data } = await api.get('/payroll', { params: { month: monthName, year, page, limit } });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawPayrollEntry) => mapPayrollEntry(item)),
      };
    },
  });
}

export function useCreatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/payroll', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }),
  });
}

export function useMarkPayrollPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/payroll/${id}/mark-paid`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { QueryParams, PaginatedResponse } from '@/types/api';
import type { PortalMember, PortalOrder, CommissionRecord, PayoutRecord } from '@/types/models';

type RawPortalMember = {
  id: string;
  fullName: string;
  email: string;
  country?: string | null;
  phone?: string | null;
  status?: string | null;
  walletBalance?: number | null;
  referralCode?: string | null;
  totalOrders?: number | null;
  totalSpent?: number | null;
  totalReferrals?: number | null;
  registrationDate?: string | null;
  avatarUrl?: string | null;
};

type PortalMemberDetail = PortalMember & {
  orders?: unknown[];
  walletTx?: unknown[];
  commissionsEarned?: unknown[];
};

type RawPortalOrder = {
  id: string;
  orderId?: number;
  memberId: string;
  memberEmail?: string;
  service?: string;
  serviceName?: string;
  amountUsd?: number;
  status: PortalOrder['status'];
  orderDate?: string;
  deliveryDate?: string | null;
  assignedTo?: string | null;
  requirements?: string | null;
};

type RawCommission = {
  id: string;
  earnerId: string;
  referredMemberName?: string | null;
  orderId: string;
  commissionAmountUsd: number;
  status: CommissionRecord['status'];
  createdAt: string;
  holdReleaseDate?: string | null;
  payoutDate?: string | null;
};

type RawPayout = {
  id: string;
  memberId: string;
  memberEmail?: string;
  amountUsd: number;
  paymentMethod: PayoutRecord['method'];
  paymentDetails?: string | null;
  status: PayoutRecord['status'];
  requestedDate?: string;
  createdAt?: string;
  processedDate?: string | null;
};

function normalizePortalMemberStatus(status?: string | null): PortalMember['status'] {
  const value = (status ?? '').trim().toUpperCase();
  if (value === 'ACTIVE' || value === 'PENDING_VERIFICATION' || value === 'SUSPENDED' || value === 'INACTIVE') {
    return value;
  }
  if (value === 'PENDING VERIFICATION') return 'PENDING_VERIFICATION';
  return 'ACTIVE';
}

function mapPortalMember(raw: RawPortalMember): PortalMember {
  return {
    id: raw.id,
    fullName: raw.fullName,
    email: raw.email,
    country: raw.country ?? '-',
    phone: raw.phone ?? '-',
    status: normalizePortalMemberStatus(raw.status),
    walletBalance: raw.walletBalance ?? 0,
    referralCode: raw.referralCode ?? '-',
    totalOrders: raw.totalOrders ?? 0,
    totalSpent: raw.totalSpent ?? 0,
    referralsCount: raw.totalReferrals ?? 0,
    joinDate: raw.registrationDate ?? new Date().toISOString(),
    avatarUrl: raw.avatarUrl ?? undefined,
  };
}

function mapPortalOrder(raw: RawPortalOrder): PortalOrder {
  return {
    id: raw.id,
    number: typeof raw.orderId === 'number' ? `#${raw.orderId}` : raw.id.slice(0, 8).toUpperCase(),
    memberId: raw.memberId,
    memberName: raw.memberEmail?.split('@')[0] ?? 'Member',
    serviceName: raw.serviceName ?? raw.service ?? 'Service',
    serviceId: '',
    amount: raw.amountUsd ?? 0,
    status: raw.status,
    placedDate: raw.orderDate ?? new Date().toISOString(),
    deliveryDate: raw.deliveryDate ?? undefined,
    assignedStaff: raw.assignedTo ?? undefined,
    progress: raw.status === 'COMPLETED' ? 100 : raw.status === 'DELIVERED' ? 90 : raw.status === 'PROCESSING' ? 50 : raw.status === 'PENDING' ? 20 : 0,
    specifications: raw.requirements ? { requirements: raw.requirements } : {},
  };
}

function mapCommission(raw: RawCommission): CommissionRecord {
  return {
    id: raw.id,
    memberId: raw.earnerId,
    memberName: raw.referredMemberName ?? 'Referred Member',
    orderRef: raw.orderId,
    amount: raw.commissionAmountUsd,
    status: raw.status,
    earnedDate: raw.createdAt,
    availableDate: raw.holdReleaseDate ?? undefined,
    paidDate: raw.payoutDate ?? undefined,
  };
}

function mapPayout(raw: RawPayout): PayoutRecord {
  return {
    id: raw.id,
    memberId: raw.memberId,
    memberName: raw.memberEmail?.split('@')[0] ?? 'Member',
    amount: raw.amountUsd,
    method: raw.paymentMethod,
    accountDetails: raw.paymentDetails ?? '-',
    status: raw.status,
    requestedDate: raw.requestedDate ?? raw.createdAt ?? new Date().toISOString(),
    processedDate: raw.processedDate ?? undefined,
  };
}

export function usePortalMembers(params?: QueryParams) {
  return useQuery<PaginatedResponse<PortalMember>>({
    queryKey: ['admin-portal-members', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/portal/members', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawPortalMember) => mapPortalMember(item)),
      };
    },
  });
}

export function usePortalMember(id: string) {
  return useQuery<PortalMemberDetail>({
    queryKey: ['admin-portal-member', id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/portal/members/${id}`);
      const raw = data as RawPortalMember & Pick<PortalMemberDetail, 'orders' | 'walletTx' | 'commissionsEarned'>;
      return {
        ...mapPortalMember(raw),
        orders: raw.orders ?? [],
        walletTx: raw.walletTx ?? [],
        commissionsEarned: raw.commissionsEarned ?? [],
      };
    },
    enabled: !!id,
  });
}

export function useAdminPortalOrders(params?: QueryParams) {
  return useQuery<PaginatedResponse<PortalOrder>>({
    queryKey: ['admin-portal-orders', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/portal/orders', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawPortalOrder) => mapPortalOrder(item)),
      };
    },
  });
}

export function useAdminCommissions(params?: QueryParams) {
  return useQuery<PaginatedResponse<CommissionRecord>>({
    queryKey: ['admin-commissions', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/portal/commissions', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawCommission) => mapCommission(item)),
      };
    },
  });
}

export function useAdminPayouts(params?: QueryParams) {
  return useQuery<PaginatedResponse<PayoutRecord>>({
    queryKey: ['admin-payouts', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/portal/payouts', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawPayout) => mapPayout(item)),
      };
    },
  });
}

export function useUpdateMemberStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.put(`/admin/portal/members/${id}/status`, { status });
      return data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-portal-member', id] });
      qc.invalidateQueries({ queryKey: ['admin-portal-members'] });
    },
  });
}

export function useUploadPortalMemberAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<{ id: string; avatarUrl: string | null }>(`/admin/portal/members/${id}/avatar`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-portal-member', id] });
      qc.invalidateQueries({ queryKey: ['admin-portal-members'] });
    },
  });
}

export function useDeletePortalMemberAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ avatarUrl: null }>(`/admin/portal/members/${id}/avatar`);
      return data;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['admin-portal-member', id] });
      qc.invalidateQueries({ queryKey: ['admin-portal-members'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, deliveryLink }: { id: string; status: string; deliveryLink?: string }) => {
      const { data } = await api.put(`/admin/portal/orders/${id}/status`, { status, deliveryLink });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-portal-orders'] }),
  });
}

export function useProcessPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, transactionId }: { id: string; status: string; transactionId?: string }) => {
      const { data } = await api.put(`/admin/portal/payouts/${id}/process`, { status, transactionId });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-payouts'] }),
  });
}

export type DepositRecord = {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  amountUsd: number;
  paymentMethod: string;
  proofUrl?: string;
  status: string;
  transactionDate: string;
};

function mapDeposit(raw: any): DepositRecord {
  return {
    id: raw.id,
    memberId: raw.memberId,
    memberName: raw.member?.fullName ?? 'Member',
    memberEmail: raw.member?.email ?? '-',
    amountUsd: raw.amountUsd ?? 0,
    paymentMethod: raw.paymentMethod ?? '-',
    proofUrl: raw.proofUrl ?? undefined,
    status: raw.status ?? 'Pending',
    transactionDate: raw.transactionDate ?? raw.createdAt ?? new Date().toISOString(),
  };
}

export function useAdminDeposits(params?: QueryParams) {
  return useQuery<PaginatedResponse<DepositRecord>>({
    queryKey: ['admin-deposits', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/portal/deposits', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows.map(mapDeposit) };
    },
  });
}

export function useApproveDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/admin/portal/deposits/${id}/approve`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-deposits'] }),
  });
}

export function useRejectDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/admin/portal/deposits/${id}/reject`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-deposits'] }),
  });
}

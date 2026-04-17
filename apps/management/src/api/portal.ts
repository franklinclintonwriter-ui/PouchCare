import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { QueryParams, PaginatedResponse } from '@/types/api';
import type { PortalOrder, WalletTransaction, Referral, CommissionRecord, PayoutRecord } from '@/types/models';
import { useAuthStore } from '@/store/authStore';

type RawPortalOrder = {
  id: string;
  orderId?: number;
  memberId: string;
  memberEmail?: string;
  memberName?: string;
  service?: string;
  serviceName?: string;
  amountUsd?: number;
  amount?: number;
  status: PortalOrder['status'];
  orderDate?: string;
  placedDate?: string;
  deliveryDate?: string | null;
  requirements?: string | null;
  assignedTo?: string | null;
};

type RawWalletTransaction = {
  id: string;
  type: WalletTransaction['type'];
  amountUsd: number;
  balanceAfterUsd: number;
  reference?: string | null;
  notes?: string | null;
  createdAt?: string;
  transactionDate?: string;
};

type RawReferral = {
  id: string;
  referredName?: string;
  referredEmail?: string;
  totalOrders?: number;
  status?: string;
  registrationDate?: string;
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

function mapPortalOrder(raw: RawPortalOrder): PortalOrder {
  const number = typeof raw.orderId === 'number' ? `#${raw.orderId}` : raw.id.slice(0, 8).toUpperCase();
  const placedDate = raw.placedDate ?? raw.orderDate ?? new Date().toISOString();
  const amount = raw.amount ?? raw.amountUsd ?? 0;
  return {
    id: raw.id,
    number,
    memberId: raw.memberId,
    memberName: raw.memberName ?? raw.memberEmail?.split('@')[0] ?? 'Member',
    serviceName: raw.serviceName ?? raw.service ?? 'Service',
    serviceId: '',
    amount,
    status: raw.status,
    placedDate,
    deliveryDate: raw.deliveryDate ?? undefined,
    assignedStaff: raw.assignedTo ?? undefined,
    progress: raw.status === 'COMPLETED' ? 100 : raw.status === 'DELIVERED' ? 90 : raw.status === 'PROCESSING' ? 50 : raw.status === 'PENDING' ? 20 : 0,
    specifications: raw.requirements ? { requirements: raw.requirements } : {},
  };
}

function mapWalletTransaction(raw: RawWalletTransaction): WalletTransaction {
  return {
    id: raw.id,
    type: raw.type,
    description: raw.reference ?? raw.notes ?? raw.type.replace(/_/g, ' '),
    amount: raw.amountUsd,
    balanceAfter: raw.balanceAfterUsd,
    createdAt: raw.createdAt ?? raw.transactionDate ?? new Date().toISOString(),
  };
}

function mapReferral(raw: RawReferral): Referral {
  const normalizedStatus = (() => {
    const value = (raw.status ?? '').trim().toUpperCase();
    if (value === 'ACTIVE' || value === 'PENDING_VERIFICATION' || value === 'SUSPENDED' || value === 'INACTIVE') return value;
    if (value === 'PENDING VERIFICATION') return 'PENDING_VERIFICATION';
    return 'PENDING_VERIFICATION';
  })();
  return {
    id: raw.id,
    memberName: raw.referredName ?? 'Referral',
    email: raw.referredEmail ?? '-',
    status: normalizedStatus as Referral['status'],
    joinedDate: raw.registrationDate ?? new Date().toISOString(),
    ordersCount: raw.totalOrders ?? 0,
    earnings: 0,
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

export function usePortalOrders(params?: QueryParams) {
  return useQuery<PaginatedResponse<PortalOrder>>({
    queryKey: ['portal-orders', params],
    queryFn: async () => {
      const { data } = await api.get('/portal/orders', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawPortalOrder) => mapPortalOrder(item)),
      };
    },
  });
}

export function usePortalOrder(id: string) {
  return useQuery<PortalOrder>({
    queryKey: ['portal-order', id],
    queryFn: async () => {
      const { data } = await api.get(`/portal/orders/${id}`);
      return mapPortalOrder(data as RawPortalOrder);
    },
    enabled: !!id,
  });
}

export type PortalOrderMessage = {
  id: string;
  authorType: 'member' | 'staff';
  authorName: string;
  content: string;
  createdAt: string;
};

export function usePortalOrderMessages(orderId: string) {
  return useQuery<PortalOrderMessage[]>({
    queryKey: ['portal-order-messages', orderId],
    queryFn: async () => {
      const { data } = await api.get(`/portal/orders/${orderId}/messages`);
      return Array.isArray(data) ? data : data.data ?? [];
    },
    enabled: !!orderId,
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { serviceId: string; quantity?: number; requirements?: string }) =>
      api.post('/portal/orders', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portal-orders'] }); qc.invalidateQueries({ queryKey: ['wallet-transactions'] }); },
  });
}

export function useRequestRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => api.post(`/portal/orders/${id}/revision`, { note }),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['portal-orders'] }); qc.invalidateQueries({ queryKey: ['portal-order', v.id] }); },
  });
}

export function useSendPortalOrderMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, content }: { orderId: string; content: string }) => {
      const { data } = await api.post(`/portal/orders/${orderId}/messages`, { content });
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['portal-order-messages', vars.orderId] });
    },
  });
}

export function useWalletTransactions() {
  return useQuery<WalletTransaction[]>({
    queryKey: ['wallet-transactions'],
    queryFn: async () => {
      const { data } = await api.get('/portal/wallet/transactions');
      const rows = Array.isArray(data) ? data : data.data ?? [];
      return rows.map((item: RawWalletTransaction) => mapWalletTransaction(item));
    },
  });
}

export function useDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { amountUsd: number; paymentMethod?: string; proofUrl?: string }) =>
      api.post('/portal/wallet/deposit', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallet-transactions'] }); qc.invalidateQueries({ queryKey: ['portal', 'me'] }); },
  });
}

export function useReferrals() {
  return useQuery<Referral[]>({
    queryKey: ['referrals'],
    queryFn: async () => {
      const { data } = await api.get('/portal/referrals');
      const rows = Array.isArray(data) ? data : data.data ?? [];
      return rows.map((item: RawReferral) => mapReferral(item));
    },
  });
}

export type ReferralLeaderboardEntry = {
  rank: number;
  name: string;
  country: string;
  referrals: number;
  earned: number;
};

export type ReferralStats = {
  referralCode: string;
  totalReferrals: number;
  totalCommissionEarned: number;
};

export type CommissionSummary = {
  total: number;
  pending: number;
  available: number;
  paidOut: number;
};

export function useReferralLeaderboard() {
  return useQuery<ReferralLeaderboardEntry[]>({
    queryKey: ['referral-leaderboard'],
    queryFn: async () => {
      const { data } = await api.get('/portal/referrals/leaderboard');
      return Array.isArray(data) ? data : data.data ?? [];
    },
  });
}

export function useReferralStats() {
  return useQuery<ReferralStats>({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      const { data } = await api.get('/portal/referrals/stats');
      return {
        referralCode: data?.referralCode ?? '',
        totalReferrals: data?.totalReferrals ?? 0,
        totalCommissionEarned: data?.totalCommissionEarned ?? 0,
      };
    },
  });
}

export type FraudCommission = {
  id: string;
  fraudFlag: boolean;
  createdAt: string;
  commissionAmountUsd?: number | null;
  orderId?: string | null;
  earnerId?: string | null;
};

export function useReferralFraudFlags() {
  return useQuery<FraudCommission[]>({
    queryKey: ['referral-fraud'],
    queryFn: async () => {
      const { data } = await api.get('/portal/referrals/fraud');
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      return rows as FraudCommission[];
    },
  });
}

export function useCommissions(params?: QueryParams) {
  return useQuery<PaginatedResponse<CommissionRecord>>({
    queryKey: ['commissions', params],
    queryFn: async () => {
      const { data } = await api.get('/portal/commissions', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawCommission) => mapCommission(item)),
      };
    },
  });
}

export function useCommissionSummary() {
  return useQuery<CommissionSummary>({
    queryKey: ['commissions-summary'],
    queryFn: async () => {
      const { data } = await api.get('/portal/commissions/summary');
      return {
        total: data?.total ?? 0,
        pending: data?.pending ?? 0,
        available: data?.available ?? 0,
        paidOut: data?.paidOut ?? 0,
      };
    },
  });
}

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { amountUsd: number; paymentMethod: 'PAYONEER' | 'USDT_TRC20' | 'BINANCE'; paymentDetails?: string }) =>
      api.post('/portal/commissions/payout-request', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commissions'] }); qc.invalidateQueries({ queryKey: ['payouts'] }); },
  });
}

export function useUpdatePortalProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { fullName?: string; phone?: string; whatsapp?: string; country?: string }) =>
      api.put('/portal/me', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal', 'me'] });
    },
  });
}

export function useUploadPortalAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<{ id: string; avatarUrl: string | null }>('/portal/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['portal', 'me'] });
      if (data?.avatarUrl) {
        useAuthStore.getState().updateUser({ avatarUrl: data.avatarUrl });
      }
    },
  });
}

export function useDeletePortalAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<{ avatarUrl: null }>('/portal/me/avatar');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal', 'me'] });
      useAuthStore.getState().updateUser({ avatarUrl: undefined });
    },
  });
}

export function usePayoutsData(params?: QueryParams) {
  return useQuery<PaginatedResponse<PayoutRecord>>({
    queryKey: ['payouts', params],
    queryFn: async () => {
      const { data } = await api.get('/portal/commissions/payouts', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawPayout) => mapPayout(item)),
      };
    },
  });
}

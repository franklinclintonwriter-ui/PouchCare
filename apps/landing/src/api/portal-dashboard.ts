import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { usePortalAuthStore } from "@/stores/portalAuthStore";
import type {
  CommissionRow,
  PaginatedMeta,
  PortalOrderRow,
  PortalProfile,
  PayoutRow,
  ReferralRow,
  ServiceCatalogItem,
  SupportTicketRow,
  WalletSummary,
  WalletTxRow,
} from "@/types/portalDashboard";

function unwrapPaginated<T>(res: { data: { data: T[]; meta: PaginatedMeta } }): {
  items: T[];
  meta: PaginatedMeta;
} {
  const d = res.data as { data: T[]; meta: PaginatedMeta };
  return { items: d.data, meta: d.meta };
}

export function usePortalWallet() {
  return useQuery({
    queryKey: ["portal", "wallet"],
    queryFn: async () => {
      const res = await api.get<WalletSummary>("/portal/wallet");
      return res.data as unknown as WalletSummary;
    },
  });
}

export function usePortalWalletTransactions(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["portal", "wallet", "tx", page, limit],
    queryFn: async () => {
      const res = await api.get(
        `/portal/wallet/transactions?page=${page}&limit=${limit}`,
      );
      return unwrapPaginated<WalletTxRow>(res as never);
    },
  });
}

export function useDepositRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      amountUsd: number;
      paymentMethod: string;
      proofUrl?: string;
    }) => {
      const res = await api.post("/portal/wallet/deposit", body);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal", "wallet"] });
      void qc.invalidateQueries({ queryKey: ["portal", "wallet", "tx"] });
    },
  });
}

export function usePortalOrders(page = 1, limit = 20, status?: string) {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) q.set("status", status);
  return useQuery({
    queryKey: ["portal", "orders", page, limit, status ?? ""],
    queryFn: async () => {
      const res = await api.get(`/portal/orders?${q.toString()}`);
      return unwrapPaginated<PortalOrderRow>(res as never);
    },
  });
}

export function usePortalOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["portal", "orders", id],
    queryFn: async () => {
      const res = await api.get<PortalOrderRow & { notes?: string | null }>(
        `/portal/orders/${id}`,
      );
      return res.data as unknown as PortalOrderRow & { notes?: string | null };
    },
    enabled: !!id,
  });
}

export function useOrderMessages(orderId: string | undefined) {
  return useQuery({
    queryKey: ["portal", "orders", orderId, "messages"],
    queryFn: async () => {
      const res = await api.get<
        Array<{
          id: string;
          authorType: string;
          authorName: string;
          content: string;
          createdAt: string;
        }>
      >(`/portal/orders/${orderId}/messages`);
      return (res.data as unknown) as Array<{
        id: string;
        authorType: string;
        authorName: string;
        content: string;
        createdAt: string;
      }>;
    },
    enabled: !!orderId,
  });
}

export function usePostOrderMessage(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post(`/portal/orders/${orderId}/messages`, {
        content,
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["portal", "orders", orderId, "messages"],
      });
    },
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      serviceId: string;
      quantity?: number;
      requirements?: string;
    }) => {
      const res = await api.post("/portal/orders", body);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal", "orders"] });
      void qc.invalidateQueries({ queryKey: ["portal", "wallet"] });
      void qc.invalidateQueries({ queryKey: ["portal", "me"] });
    },
  });
}

export function usePublicServices() {
  return useQuery({
    queryKey: ["services", "catalog"],
    queryFn: async () => {
      const res = await api.get<ServiceCatalogItem[]>("/services");
      return (res.data as unknown) as ServiceCatalogItem[];
    },
  });
}

export function useReferralStats() {
  return useQuery({
    queryKey: ["portal", "referrals", "stats"],
    queryFn: async () => {
      const res = await api.get<{
        referralCode: string;
        totalReferrals: number;
        totalCommissionEarned: number;
      }>("/portal/referrals/stats");
      return res.data as unknown as {
        referralCode: string;
        totalReferrals: number;
        totalCommissionEarned: number;
      };
    },
  });
}

export function useReferralsList(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["portal", "referrals", "list", page],
    queryFn: async () => {
      const res = await api.get(
        `/portal/referrals?page=${page}&limit=${limit}`,
      );
      return unwrapPaginated<ReferralRow>(res as never);
    },
  });
}

export function useCommissionSummary() {
  return useQuery({
    queryKey: ["portal", "commissions", "summary"],
    queryFn: async () => {
      const res = await api.get<{
        total: number;
        pending: number;
        available: number;
        paidOut: number;
      }>("/portal/commissions/summary");
      return res.data as unknown as {
        total: number;
        pending: number;
        available: number;
        paidOut: number;
      };
    },
  });
}

export function useCommissions(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["portal", "commissions", page],
    queryFn: async () => {
      const res = await api.get(
        `/portal/commissions?page=${page}&limit=${limit}`,
      );
      return unwrapPaginated<CommissionRow>(res as never);
    },
  });
}

export function usePayoutHistory(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["portal", "commissions", "payouts", page],
    queryFn: async () => {
      const res = await api.get(
        `/portal/commissions/payouts?page=${page}&limit=${limit}`,
      );
      return unwrapPaginated<PayoutRow>(res as never);
    },
  });
}

export function usePayoutRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      amountUsd: number;
      paymentMethod: string;
      paymentDetails: string;
    }) => {
      const res = await api.post("/portal/commissions/payout-request", body);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal", "commissions"] });
    },
  });
}

export function useSupportTickets(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["portal", "support", "tickets", page],
    queryFn: async () => {
      const res = await api.get(`/support/tickets?page=${page}&limit=${limit}`);
      return unwrapPaginated<SupportTicketRow>(res as never);
    },
  });
}

export function useSupportTicket(id: string | undefined) {
  return useQuery({
    queryKey: ["portal", "support", "ticket", id],
    queryFn: async () => {
      const res = await api.get<SupportTicketRow>(`/support/tickets/${id}`);
      return res.data as unknown as SupportTicketRow;
    },
    enabled: !!id,
  });
}

export function useCreateSupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      subject: string;
      message: string;
      priority?: string;
    }) => {
      const res = await api.post("/support/tickets", body);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal", "support", "tickets"] });
    },
  });
}

export function useReplySupportTicket(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post(`/support/tickets/${ticketId}/reply`, {
        content,
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["portal", "support", "ticket", ticketId],
      });
      void qc.invalidateQueries({ queryKey: ["portal", "support", "tickets"] });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      fullName?: string;
      phone?: string;
      whatsapp?: string;
      country?: string;
    }) => {
      const res = await api.put<PortalProfile>("/portal/me", body);
      return res.data as unknown as PortalProfile;
    },
    onSuccess: (data) => {
      const { setUser, user } = usePortalAuthStore.getState();
      if (user) {
        setUser({
          ...user,
          fullName: (data.fullName as string) ?? user.fullName,
          phone: data.phone as string | null | undefined,
          whatsapp: data.whatsapp as string | null | undefined,
          country: data.country as string | null | undefined,
          avatarUrl: (data.avatarUrl as string | undefined) ?? user.avatarUrl,
        });
      }
      void qc.invalidateQueries({ queryKey: ["portal", "me"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (body: {
      current_password: string;
      new_password: string;
    }) => {
      const res = await api.post("/portal/change-password", body);
      return res.data;
    },
  });
}

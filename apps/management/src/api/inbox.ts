import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client";

// ── Types ────────────────────────────────────────────────────────

export interface EmailAccount {
  id: string;
  staffMemberId: string;
  address: string;
  displayName: string;
  signature: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailRecipientInfo {
  address: string;
  name: string | null;
  type: "to" | "cc" | "bcc";
}

export interface EmailAttachmentInfo {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface EmailMessage {
  id: string;
  accountId: string;
  subject: string;
  body: string;
  bodyText: string | null;
  threadId: string | null;
  inReplyToId: string | null;
  resendId: string | null;
  status: string;
  isRead: boolean;
  isStarred: boolean;
  isDraft: boolean;
  folder: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  recipients: EmailRecipientInfo[];
  attachments: EmailAttachmentInfo[];
  account?: { address: string; displayName: string };
  recipientId?: string;
}

export interface EmailStats {
  unreadInbox: number;
  totalSent: number;
  totalDrafts: number;
  totalTrash: number;
  totalStarred: number;
}

export interface ComposeData {
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyText?: string;
  inReplyToId?: string;
  isDraft?: boolean;
}

// ── Account hooks ────────────────────────────────────────────────

export function useEmailAccounts() {
  return useQuery<EmailAccount[]>({
    queryKey: ["emailAccounts"],
    queryFn: async () => {
      const { data } = await api.get("/inbox/accounts");
      return data as EmailAccount[];
    },
  });
}

export function useCreateEmailAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      address: string;
      displayName: string;
      signature?: string;
    }) => api.post("/inbox/accounts", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emailAccounts"] }),
  });
}

export function useUpdateEmailAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      displayName?: string;
      signature?: string;
      isPrimary?: boolean;
    }) => api.put(`/inbox/accounts/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emailAccounts"] }),
  });
}

export function useDeleteEmailAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/inbox/accounts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emailAccounts"] }),
  });
}

// ── Message hooks ────────────────────────────────────────────────

export function useEmailMessages(params: {
  accountId: string;
  folder?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<{
    data: EmailMessage[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>({
    queryKey: ["emailMessages", params],
    queryFn: async () => {
      const { data } = await api.get("/inbox/messages", { params });
      return data as any;
    },
    enabled: !!params.accountId,
  });
}

export function useEmailMessage(id: string) {
  return useQuery<EmailMessage>({
    queryKey: ["emailMessage", id],
    queryFn: async () => {
      const { data } = await api.get(`/inbox/messages/${id}`);
      return data as EmailMessage;
    },
    enabled: !!id,
  });
}

export function useEmailThread(id: string) {
  return useQuery<EmailMessage[]>({
    queryKey: ["emailThread", id],
    queryFn: async () => {
      const { data } = await api.get(`/inbox/messages/${id}/thread`);
      return data as EmailMessage[];
    },
    enabled: !!id,
  });
}

export function useSendEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      attachments,
      ...data
    }: ComposeData & { attachments?: File[] }) => {
      if (attachments && attachments.length > 0) {
        const formData = new FormData();
        formData.append("data", JSON.stringify(data));
        attachments.forEach((f) => formData.append("attachments", f));
        return api.post("/inbox/messages", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      return api.post("/inbox/messages", data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emailMessages"] });
      qc.invalidateQueries({ queryKey: ["emailStats"] });
    },
  });
}

export function useUpdateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      subject?: string;
      body?: string;
      bodyText?: string;
    }) => api.put(`/inbox/messages/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emailMessages"] }),
  });
}

// ── Action hooks ─────────────────────────────────────────────────

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) =>
      api.patch(`/inbox/messages/${id}/read`, { isRead }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emailMessages"] });
      qc.invalidateQueries({ queryKey: ["emailStats"] });
    },
  });
}

export function useToggleStar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isStarred }: { id: string; isStarred: boolean }) =>
      api.patch(`/inbox/messages/${id}/star`, { isStarred }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emailMessages"] }),
  });
}

export function useMoveMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, folder }: { id: string; folder: string }) =>
      api.patch(`/inbox/messages/${id}/move`, { folder }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emailMessages"] });
      qc.invalidateQueries({ queryKey: ["emailStats"] });
    },
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/inbox/messages/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emailMessages"] });
      qc.invalidateQueries({ queryKey: ["emailStats"] });
    },
  });
}

// ── Stats ────────────────────────────────────────────────────────

export function useEmailStats(accountId: string) {
  return useQuery<EmailStats>({
    queryKey: ["emailStats", accountId],
    queryFn: async () => {
      const { data } = await api.get("/inbox/stats", { params: { accountId } });
      return data as EmailStats;
    },
    enabled: !!accountId,
    refetchInterval: 30_000, // poll every 30s
  });
}

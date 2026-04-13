import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { QueryParams, PaginatedResponse } from '@/types/api';
import type { Ticket } from '@/types/models';

type RawTicketReply = {
  id: string;
  content: string;
  authorName: string;
  authorType: string;
  createdAt: string;
};

type RawTicket = {
  id: string;
  ticketNumber?: number;
  subject: string;
  memberEmail?: string;
  memberName?: string;
  priority?: string;
  status?: string;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt?: string;
  replies?: RawTicketReply[];
};

function normalizeStatus(value: string | undefined, fallback: Ticket['status']) {
  const input = (value ?? '').trim().toLowerCase();
  if (input === 'in progress' || input === 'in_progress') return 'in_progress' as const;
  if (input === 'waiting') return 'waiting' as const;
  if (input === 'resolved') return 'resolved' as const;
  if (input === 'closed') return 'closed' as const;
  if (input === 'open') return 'open' as const;
  return fallback;
}

function normalizePriority(value: string | undefined): Ticket['priority'] {
  const p = (value ?? '').trim().toUpperCase();
  if (p === 'LOW' || p === 'MEDIUM' || p === 'HIGH' || p === 'CRITICAL') return p;
  return 'MEDIUM';
}

function toTicket(raw: RawTicket): Ticket {
  const replies = Array.isArray(raw.replies) ? raw.replies : [];
  const lastReply = replies[replies.length - 1];
  const number = raw.ticketNumber ? `#${raw.ticketNumber}` : `#${raw.id.slice(0, 8).toUpperCase()}`;

  return {
    id: raw.id,
    number,
    subject: raw.subject,
    clientName: raw.memberName ?? raw.memberEmail ?? 'Unknown',
    clientEmail: raw.memberEmail ?? '',
    priority: normalizePriority(raw.priority),
    status: normalizeStatus(raw.status, 'open'),
    assigneeName: raw.assignedTo ?? undefined,
    category: 'General',
    messages: replies.map((reply) => ({
      id: reply.id,
      content: reply.content,
      authorName: reply.authorName,
      isStaff: reply.authorType === 'staff',
      createdAt: reply.createdAt,
    })),
    createdAt: raw.createdAt,
    lastReplyAt: lastReply?.createdAt ?? raw.updatedAt ?? raw.createdAt,
  };
}

export function useTickets(params?: QueryParams) {
  return useQuery<PaginatedResponse<Ticket>>({
    queryKey: ['tickets', params],
    queryFn: async () => {
      const { data } = await api.get('/support/tickets', { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawTicket) => toTicket(item)),
      };
    },
  });
}

export function useTicket(id: string) {
  return useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const { data } = await api.get(`/support/tickets/${id}`);
      return toTicket(data as RawTicket);
    },
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { subject: string; message: string; priority?: string }) => api.post('/support/tickets', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
}

export function useReplyToTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: string; content: string }) => api.post(`/support/tickets/${ticketId}/reply`, { content }),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['ticket', v.ticketId] }),
  });
}

export type UpdateTicketInput = {
  id: string;
  status?: string;
  assignedTo?: string;
};

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateTicketInput) => api.put(`/support/tickets/${id}`, body),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['tickets'] }); qc.invalidateQueries({ queryKey: ['ticket', v.id] }); },
  });
}

export function useDeleteTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/support/tickets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
}

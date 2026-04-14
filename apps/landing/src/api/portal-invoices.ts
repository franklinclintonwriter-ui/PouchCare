import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import type { PaginatedMeta } from "@/types/portalDashboard";

export type InvoiceStatus = "paid" | "pending" | "overdue" | "cancelled" | "draft";

export const INVOICE_STATUS_VARIANT: Record<
  InvoiceStatus,
  "success" | "warning" | "error" | "neutral" | "info"
> = {
  paid: "success",
  pending: "warning",
  overdue: "error",
  cancelled: "neutral",
  draft: "info",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Overdue",
  cancelled: "Cancelled",
  draft: "Draft",
};

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  paymentMethod: string | null;
  notes: string;
  relatedOrderId: string | null;
}

export interface InvoiceDetail extends Invoice {
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

function unwrapPaginated<T>(res: { data: { data: T[]; meta: PaginatedMeta } }): {
  items: T[];
  meta: PaginatedMeta;
} {
  const d = res.data as { data: T[]; meta: PaginatedMeta };
  return { items: d.data, meta: d.meta };
}

export function usePortalInvoices(page = 1, limit = 10, status?: string) {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) q.set("status", status);
  return useQuery({
    queryKey: ["portal", "invoices", page, limit, status ?? ""],
    queryFn: async () => {
      const res = await api.get(`/v1/portal/invoices?${q.toString()}`);
      return unwrapPaginated<Invoice>(res as never);
    },
  });
}

export function usePortalInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ["portal", "invoices", id],
    queryFn: async () => {
      const res = await api.get<InvoiceDetail>(`/v1/portal/invoices/${id}`);
      return res.data as unknown as InvoiceDetail;
    },
    enabled: !!id,
  });
}

export function useDownloadInvoicePdf() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.get(`/v1/portal/invoices/${id}/pdf`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}

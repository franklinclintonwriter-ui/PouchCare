/**
 * Invoice list — filterable by status, responsive cards (mobile) + table (desktop).
 * Route: /dashboard/invoices
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Eye,
  Loader2,
  Search,
} from "lucide-react";
import { paths } from "@/routes/paths";
import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_VARIANT,
  type InvoiceStatus,
  type Invoice,
  usePortalInvoices,
  useDownloadInvoicePdf,
} from "@/api/portal-invoices";
import { formatDateShort, formatUsd } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

const STATUS_TABS: { label: string; value: InvoiceStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
  { label: "Draft", value: "draft" },
];

export default function InvoicesPage() {
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page] = useState(1);

  const { data: invoicesData, isLoading, error } = usePortalInvoices(
    page,
    50,
    filter !== "all" ? filter : undefined,
  );
  const download = useDownloadInvoicePdf();

  const handleDownload = async (invoiceId: string) => {
    try {
      toast.success("Download started...");
      await download.mutateAsync(invoiceId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to download");
    }
  };

  const filtered = useMemo(() => {
    if (!invoicesData) return [];
    let list = invoicesData.items;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((i) => i.invoiceNumber.toLowerCase().includes(q));
    }
    return list;
  }, [invoicesData, search]);

  const totals = useMemo(() => {
    if (!invoicesData) return { paid: 0, pending: 0, count: 0 };
    const paid = invoicesData.items
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + i.total, 0);
    const pending = invoicesData.items
      .filter((i) => i.status === "pending" || i.status === "overdue")
      .reduce((s, i) => s + i.total, 0);
    return { paid, pending, count: invoicesData.meta.total || invoicesData.items.length };
  }, [invoicesData]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">
            View, filter, and print invoices for your orders and subscriptions.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total invoices</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{totals.count}</p>
        </div>
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total paid</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{formatUsd(totals.paid)}</p>
        </div>
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Outstanding</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">{formatUsd(totals.pending)}</p>
        </div>
      </div>

      <DashboardPanel
        title="All invoices"
        description="Click an invoice to view the full document or print it."
      >
        {/* Filter bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setFilter(t.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  filter === t.value
                    ? "bg-primary-100 text-primary-800"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search invoice #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-[40px] pl-9 text-sm"
            />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-600">
            Failed to load invoices. Please try again.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            No invoices match your filter.
          </p>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="mt-4 space-y-3 md:hidden">
              {filtered.map((inv) => (
                <InvoiceCard key={inv.id} inv={inv} onDownload={handleDownload} downloading={download.isPending} />
              ))}
            </ul>

            {/* Desktop table */}
            <div className="mt-4 hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                    {["Invoice #", "Date", "Due", "Amount", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3 font-mono font-semibold text-gray-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-600">
                        {formatDateShort(inv.issueDate)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-600">
                        {formatDateShort(inv.dueDate)}
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-gray-900">
                        {formatUsd(inv.total)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={INVOICE_STATUS_VARIANT[inv.status]}>
                          {INVOICE_STATUS_LABEL[inv.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Link
                            to={paths.dashboardInvoice(inv.id)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleDownload(inv.id)}
                            disabled={download.isPending}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DashboardPanel>
    </div>
  );
}

function InvoiceCard({ inv, onDownload, downloading }: { inv: Invoice; onDownload: (id: string) => void; downloading?: boolean }) {
  return (
    <li className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-sm font-bold text-gray-900">{inv.invoiceNumber}</p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {inv.relatedOrderId ?? "—"}
          </p>
        </div>
        <Badge variant={INVOICE_STATUS_VARIANT[inv.status]}>
          {INVOICE_STATUS_LABEL[inv.status]}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-gray-400">Issued</p>
          <p className="tabular-nums text-gray-700">{formatDateShort(inv.issueDate)}</p>
        </div>
        <div>
          <p className="text-gray-400">Due</p>
          <p className="tabular-nums text-gray-700">{formatDateShort(inv.dueDate)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400">Total</p>
          <p className="font-bold tabular-nums text-gray-900">{formatUsd(inv.total)}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Link
          to={paths.dashboardInvoice(inv.id)}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
        >
          <Eye className="h-4 w-4" />
          View
        </Link>
        <button
          type="button"
          onClick={() => void onDownload(inv.id)}
          disabled={downloading}
          className="flex min-h-[44px] w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
          aria-label="Download PDF"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

/**
 * Invoice list — filterable by status, responsive cards + table.
 * Route: /dashboard/invoices
 *
 * Migrated (Week 5) to the full UI-kit set: DataTable for the list, Tabs
 * for the status filter, real server-side Pagination. The previous
 * double-fetch (`usePortalInvoices(1, 1000)` for the counts) is gone for
 * the invoice count — we now use `meta.total` from the paginated response.
 * The paid / outstanding sums still require all-invoices data; that remains
 * opt-in behind an env-driven cap until a `/portal/invoices/summary` endpoint
 * exists on the backend. TODO(perf): request that endpoint.
 *
 * Per-invoice download spinner is now tracked in a `Set<string>` of pending
 * ids, so two concurrent downloads don't stomp each other.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Eye, Search, Loader2, FileText } from "lucide-react";
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
import {
  Tabs,
  Tab,
  DataTable,
  type DataTableColumn,
} from "@/components/ui";
import { toast } from "sonner";

const STATUS_TABS: { label: string; value: InvoiceStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
  { label: "Draft", value: "draft" },
];

const PAGE_SIZE = 20;
/** How many invoices we'll fetch to compute the paid / outstanding totals on
 *  the stat cards. Deliberately capped — for workspaces with more than this,
 *  the stat cards will understate totals until a summary endpoint ships. */
const TOTALS_CAP = 500;

export default function InvoicesPage() {
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const query = usePortalInvoices(
    page,
    PAGE_SIZE,
    filter !== "all" ? filter : undefined,
  );
  const { data: invoicesData } = query;

  // Summary fetch — used only for paid / outstanding cards. See TODO above.
  const summary = usePortalInvoices(1, TOTALS_CAP);

  // Per-invoice download pending Set
  const [pendingDownloads, setPendingDownloads] = useState<Set<string>>(
    new Set(),
  );
  const downloadMutation = useDownloadInvoicePdf();

  const handleDownload = async (id: string) => {
    setPendingDownloads((p) => new Set(p).add(id));
    try {
      await downloadMutation.mutateAsync(id);
      toast.success("Downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to download");
    } finally {
      setPendingDownloads((p) => {
        const next = new Set(p);
        next.delete(id);
        return next;
      });
    }
  };

  const filtered = useMemo(() => {
    if (!invoicesData) return [];
    if (!search) return invoicesData.items;
    return invoicesData.items.filter((i) =>
      i.invoiceNumber.toLowerCase().includes(search),
    );
  }, [invoicesData, search]);

  const totals = useMemo(() => {
    const source = summary.data?.items ?? invoicesData?.items ?? [];
    const paid = source
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + i.total, 0);
    const pending = source
      .filter((i) => i.status === "pending" || i.status === "overdue")
      .reduce((s, i) => s + i.total, 0);
    // Count comes straight from the paginated meta — no extra fetch needed.
    const count = invoicesData?.meta.total ?? source.length;
    return { paid, pending, count };
  }, [summary.data, invoicesData]);

  const columns: DataTableColumn<Invoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      cell: (inv) => (
        <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
          {inv.invoiceNumber}
        </span>
      ),
      mobileLabel: "Invoice",
    },
    {
      key: "issueDate",
      header: "Date",
      cell: (inv) => (
        <span className="tabular-nums text-gray-600 dark:text-gray-400">
          {formatDateShort(inv.issueDate)}
        </span>
      ),
      mobileLabel: "Issued",
    },
    {
      key: "dueDate",
      header: "Due",
      cell: (inv) => (
        <span className="tabular-nums text-gray-600 dark:text-gray-400">
          {formatDateShort(inv.dueDate)}
        </span>
      ),
    },
    {
      key: "total",
      header: "Amount",
      align: "right",
      cell: (inv) => (
        <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
          {formatUsd(inv.total)}
        </span>
      ),
      mobileLabel: "Total",
    },
    {
      key: "status",
      header: "Status",
      cell: (inv) => (
        <Badge variant={INVOICE_STATUS_VARIANT[inv.status]}>
          {INVOICE_STATUS_LABEL[inv.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      hideOnMobile: true,
      cell: (inv) => (
        <div className="flex justify-end gap-1.5">
          <Link
            to={paths.dashboardInvoice(inv.id)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void handleDownload(inv.id);
            }}
            disabled={pendingDownloads.has(inv.id)}
            aria-label={`Download invoice ${inv.invoiceNumber}`}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            {pendingDownloads.has(inv.id) ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
            Invoices
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View, filter, and print invoices for your orders and subscriptions.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Total invoices
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {totals.count}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Total paid
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">
            {formatUsd(totals.paid)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Outstanding
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">
            {formatUsd(totals.pending)}
          </p>
        </div>
      </div>

      <DashboardPanel
        title="All invoices"
        description="Click an invoice to view the full document or print it."
      >
        {/* Filter bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={filter}
            onChange={(v) => setFilter(v as InvoiceStatus | "all")}
            aria-label="Filter invoices by status"
          >
            {STATUS_TABS.map((t) => (
              <Tab key={t.value} value={t.value}>
                {t.label}
              </Tab>
            ))}
          </Tabs>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search invoice #..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="min-h-[40px] pl-9 text-sm"
              aria-label="Search invoices"
            />
          </div>
        </div>

        <DataTable<Invoice>
          className="mt-4"
          columns={columns}
          data={filtered}
          getRowId={(inv) => inv.id}
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          onRetry={() => query.refetch()}
          empty={{
            icon: <FileText />,
            title:
              invoicesData && invoicesData.items.length === 0 && !search
                ? "No invoices yet"
                : "No invoices match",
            description:
              invoicesData && invoicesData.items.length === 0 && !search
                ? "Your invoices will appear here when they're issued."
                : "Try clearing the status filter or the search.",
          }}
          pagination={{
            page,
            pageSize: PAGE_SIZE,
            total: invoicesData?.meta.total ?? 0,
            onChange: setPage,
          }}
        />
      </DashboardPanel>
    </div>
  );
}

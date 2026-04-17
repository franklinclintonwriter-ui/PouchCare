/**
 * Orders list — status filter tabs, search, responsive cards + table.
 * Route: /dashboard/orders
 *
 * Migrated (Week 4) to the full UI-kit set: Tabs for status filter with
 * proper ARIA + keyboard nav, Skeleton on load, ErrorState with retry,
 * EmptyState per filter, and Pagination over the filtered results.
 * Search is debounced 300 ms to stop filtering on every keystroke.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Package, Search } from "lucide-react";
import { usePortalOrders } from "@/api/portal-dashboard";
import { paths } from "@/routes/paths";
import { formatUsd, formatDateShort, orderStatusVariant } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { NarrowWide } from "@/components/dashboard/ResponsiveSplit";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Tabs,
  Tab,
  Skeleton,
  SkeletonRow,
  EmptyState,
  ErrorState,
  Pagination,
} from "@/components/ui";

const STATUS_TABS = ["all", "pending", "processing", "completed", "cancelled"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const PAGE_SIZE = 10;

export default function OrdersPage() {
  const query = usePortalOrders(1, 100);
  const { data, isLoading, isError, refetch } = query;
  const [filter, setFilter] = useState<StatusTab>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce the search 300 ms so we don't re-memoize on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 whenever filter / search changes so users don't get
  // stranded on an empty page 7 after switching filters.
  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    let list = data.items;
    if (filter !== "all") {
      list = list.filter((o) => o.status.toLowerCase() === filter);
    }
    if (search) {
      list = list.filter(
        (o) =>
          String(o.orderId).includes(search) ||
          (o.serviceName ?? o.service).toLowerCase().includes(search),
      );
    }
    return list;
  }, [data, filter, search]);

  const pageSlice = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
            Orders
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track and manage all your service orders.
          </p>
        </div>
        <Link
          to={paths.dashboardServices}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 sm:min-h-0"
        >
          New order
        </Link>
      </div>

      <DashboardPanel
        title="All orders"
        description="Click an order to view details, messages, and invoice."
      >
        {/* Filter + search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={filter}
            onChange={(v) => setFilter(v as StatusTab)}
            aria-label="Filter orders by status"
          >
            {STATUS_TABS.map((t) => (
              <Tab key={t} value={t} className="capitalize">
                {t}
              </Tab>
            ))}
          </Tabs>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search order # or service…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="min-h-[40px] pl-9 text-sm"
              aria-label="Search orders"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="mt-4 space-y-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : isError ? (
          <ErrorState
            error={query.error}
            onRetry={() => refetch()}
            className="mt-4"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title={
              data?.items.length === 0
                ? "No orders yet"
                : filter === "all" && !search
                  ? "No orders match"
                  : `No ${filter !== "all" ? filter : ""} orders match`
            }
            description={
              data?.items.length === 0
                ? "Your completed orders will appear here."
                : "Try clearing filters or widening your search."
            }
            action={
              data?.items.length === 0 ? (
                <Link to={paths.dashboardServices}>
                  <Button size="sm">Browse services</Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFilter("all");
                    setSearchInput("");
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <>
            <NarrowWide
              narrow={
                <ul className="mt-4 space-y-3">
                  {pageSlice.map((o) => (
                    <li
                      key={o.id}
                      className="rounded-2xl border border-gray-200/90 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            to={paths.dashboardOrder(o.id)}
                            className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-700"
                          >
                            {o.serviceName ?? o.service}
                          </Link>
                          <p className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                            #{o.orderId}
                          </p>
                        </div>
                        <Badge variant={orderStatusVariant(o.status)}>
                          {o.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800 pt-3 text-sm">
                        <span className="tabular-nums text-gray-600 dark:text-gray-400">
                          {formatDateShort(o.orderDate)}
                        </span>
                        <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                          {formatUsd(o.amountUsd)}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Link
                          to={paths.dashboardOrder(o.id)}
                          className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50/80"
                        >
                          Details
                        </Link>
                        <Link
                          to={paths.dashboardInvoices}
                          className="flex min-h-[44px] w-12 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                          aria-label="View invoice"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              }
              wide={
                <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <th className="px-4 py-2.5 font-semibold">Order</th>
                        <th className="px-4 py-2.5 font-semibold">Service</th>
                        <th className="px-4 py-2.5 font-semibold">Status</th>
                        <th className="px-4 py-2.5 font-semibold">Date</th>
                        <th className="px-4 py-2.5 text-right font-semibold">
                          Amount
                        </th>
                        <th className="px-4 py-2.5 text-right font-semibold">
                          Invoice
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {pageSlice.map((o) => (
                        <tr
                          key={o.id}
                          className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">
                            #{o.orderId}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              to={paths.dashboardOrder(o.id)}
                              className="font-medium text-primary-700 hover:underline"
                            >
                              {o.serviceName ?? o.service}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={orderStatusVariant(o.status)}>
                              {o.status.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-400">
                            {formatDateShort(o.orderDate)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">
                            {formatUsd(o.amountUsd)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={paths.dashboardInvoices}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Invoice
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
            />
            <Pagination
              className="mt-4"
              page={page}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              onChange={setPage}
            />
          </>
        )}
      </DashboardPanel>
    </div>
  );
}

// Re-export Skeleton at the bottom so the bundler keeps it reachable for
// potential future per-row skeletons; no runtime effect.
export { Skeleton as _OrdersSkeleton };

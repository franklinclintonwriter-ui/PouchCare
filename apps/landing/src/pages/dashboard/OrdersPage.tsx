/**
 * Orders list — status filter tabs, search, responsive cards + table.
 * Route: /dashboard/orders
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Search } from "lucide-react";
import { usePortalOrders } from "@/api/portal-dashboard";
import { paths } from "@/routes/paths";
import { formatUsd, formatDateShort } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { NarrowWide } from "@/components/dashboard/ResponsiveSplit";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

function statusVariant(s: string): "green" | "yellow" | "sky" | "slate" | "red" {
  const u = s.toUpperCase();
  if (u === "COMPLETED" || u === "DELIVERED") return "green";
  if (u === "PROCESSING" || u === "PENDING") return "yellow";
  if (u === "CANCELLED" || u === "REFUNDED") return "red";
  return "sky";
}

const STATUS_TABS = ["all", "pending", "processing", "completed", "cancelled"] as const;

export default function OrdersPage() {
  const { data, isLoading, isError } = usePortalOrders(1, 100);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    let list = data.items;
    if (filter !== "all") {
      list = list.filter((o) => o.status.toLowerCase() === filter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          String(o.orderId).includes(q) ||
          (o.serviceName ?? o.service).toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, filter, search]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage all your service orders.
          </p>
        </div>
        <Link
          to={paths.dashboardServices}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 sm:min-h-0"
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
          <div className="flex flex-wrap gap-1.5 overflow-x-auto">
            {STATUS_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  filter === t
                    ? "bg-primary-100 text-primary-800"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search order # or service…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-[40px] pl-9 text-sm"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <p className="py-6 text-sm text-gray-500">Loading orders…</p>
        ) : isError ? (
          <p className="py-6 text-sm text-red-600">Could not load orders.</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            {data?.items.length === 0
              ? "No orders yet."
              : "No orders match your filter."}
          </p>
        ) : (
          <NarrowWide
            narrow={
              <ul className="mt-4 space-y-3">
                {filtered.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={paths.dashboardOrder(o.id)}
                          className="font-medium text-gray-900 hover:text-primary-700"
                        >
                          {o.serviceName ?? o.service}
                        </Link>
                        <p className="mt-0.5 font-mono text-xs text-gray-500">#{o.orderId}</p>
                      </div>
                      <Badge variant={statusVariant(o.status)}>
                        {o.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3 text-sm">
                      <span className="tabular-nums text-gray-600">
                        {formatDateShort(o.orderDate)}
                      </span>
                      <span className="font-semibold tabular-nums text-gray-900">
                        {formatUsd(o.amountUsd)}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link
                        to={paths.dashboardOrder(o.id)}
                        className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50/80"
                      >
                        Details
                      </Link>
                      <Link
                        to={paths.dashboardInvoices}
                        className="flex min-h-[44px] w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50"
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
              <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-2.5 font-semibold">Order</th>
                      <th className="px-4 py-2.5 font-semibold">Service</th>
                      <th className="px-4 py-2.5 font-semibold">Status</th>
                      <th className="px-4 py-2.5 font-semibold">Date</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-mono text-gray-900">#{o.orderId}</td>
                        <td className="px-4 py-3">
                          <Link
                            to={paths.dashboardOrder(o.id)}
                            className="font-medium text-primary-700 hover:underline"
                          >
                            {o.serviceName ?? o.service}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant(o.status)}>
                            {o.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-gray-600">
                          {formatDateShort(o.orderDate)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-gray-900">
                          {formatUsd(o.amountUsd)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={paths.dashboardInvoices}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
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
        )}
      </DashboardPanel>
    </div>
  );
}

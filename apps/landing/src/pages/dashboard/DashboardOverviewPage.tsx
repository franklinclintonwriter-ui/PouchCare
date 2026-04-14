/**
 * Dashboard home — welcome, stat cards, recent orders, quick actions, activity.
 */
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  FileText,
  Globe,
  Globe2,
  LifeBuoy,
  Package,
  Receipt,
  Settings,
  Smartphone,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { paths } from "@/routes/paths";
import { usePortalAuthStore } from "@/stores/portalAuthStore";
import {
  usePortalOrders,
  usePortalWallet,
  useReferralStats,
} from "@/api/portal-dashboard";
import { usePortalInvoices } from "@/api/portal-invoices";
import { usePortalWebsites } from "@/api/portal-websites";
import { usePortalDomains } from "@/api/portal-hosting";
import { formatUsd, formatDateShort } from "@/lib/format";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

function statusVariant(s: string): "green" | "yellow" | "sky" | "red" {
  const u = s.toUpperCase();
  if (u === "COMPLETED" || u === "DELIVERED") return "green";
  if (u === "PROCESSING" || u === "PENDING") return "yellow";
  if (u === "CANCELLED" || u === "REFUNDED") return "red";
  return "sky";
}

const QUICK_ACTIONS: { to: string; label: string; icon: React.ElementType; color: string }[] = [
  { to: paths.dashboardOrders, label: "Orders", icon: Package, color: "bg-primary-50 text-primary-600" },
  { to: paths.dashboardCart, label: "Cart", icon: ShoppingCart, color: "bg-emerald-50 text-emerald-600" },
  { to: paths.dashboardServices, label: "Services", icon: Briefcase, color: "bg-violet-50 text-violet-600" },
  { to: paths.dashboardWallet, label: "Wallet", icon: Wallet, color: "bg-amber-50 text-amber-600" },
  { to: paths.dashboardHosting, label: "Domains", icon: Globe2, color: "bg-sky-50 text-sky-600" },
  { to: paths.dashboardWebsites, label: "Websites", icon: Globe, color: "bg-rose-50 text-rose-600" },
  { to: paths.dashboardInvoices, label: "Invoices", icon: FileText, color: "bg-indigo-50 text-indigo-600" },
  { to: paths.dashboardWebToApk, label: "Web→APK", icon: Smartphone, color: "bg-teal-50 text-teal-600" },
  { to: paths.dashboardBilling, label: "Billing", icon: Receipt, color: "bg-orange-50 text-orange-600" },
  { to: paths.dashboardReferrals, label: "Referrals", icon: Users, color: "bg-pink-50 text-pink-600" },
  { to: paths.dashboardSupport, label: "Support", icon: LifeBuoy, color: "bg-cyan-50 text-cyan-600" },
  { to: paths.dashboardSettings, label: "Settings", icon: Settings, color: "bg-gray-100 text-gray-600" },
];

export default function DashboardOverviewPage() {
  const user = usePortalAuthStore((s) => s.user);
  const wallet = usePortalWallet();
  const stats = useReferralStats();
  const recent = usePortalOrders(1, 5);
  const websites = usePortalWebsites(1, 100);
  const domainsQuery = usePortalDomains(1, 100);
  const invoicesQuery = usePortalInvoices(1, 100, 'Pending');

  const bal = wallet.data?.walletBalance ?? user?.walletBalance ?? 0;
  const websitesList = websites.data?.items ?? [];
  const onlineSites = websitesList.filter((w) => w.status === "online").length;
  const domainsList = domainsQuery.data?.items ?? [];
  const pendingInvoices = invoicesQuery.data?.meta?.total ?? 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Welcome */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 sm:text-sm sm:normal-case sm:tracking-normal sm:text-gray-500">
            Welcome back
          </p>
          <h2 className="mt-0.5 truncate text-lg font-bold text-gray-900 sm:text-xl">
            {user?.fullName ?? "Client"}
          </h2>
        </div>
        <Link to={paths.dashboardServices}>
          <Button
            variant="primary"
            size="sm"
            className="min-h-[44px] w-full sm:min-h-0 sm:w-auto"
            iconRight={<ArrowRight className="h-3.5 w-3.5" />}
          >
            Browse services
          </Button>
        </Link>
      </div>

      {/* Stat cards — 2 col on mobile, 3 on sm, 6 on lg */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Wallet"
          value={wallet.isLoading ? "…" : formatUsd(bal)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Referrals"
          value={stats.isLoading ? "…" : (stats.data?.totalReferrals ?? 0)}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Earnings"
          value={stats.isLoading ? "…" : formatUsd(stats.data?.totalCommissionEarned ?? 0)}
          icon={<Receipt className="h-4 w-4" />}
        />
        <StatCard
          label="Domains"
          value={domainsQuery.isLoading ? "…" : domainsList.length}
          icon={<Globe2 className="h-4 w-4" />}
        />
        <StatCard
          label="Sites online"
          value={websites.isLoading ? "…" : `${onlineSites}/${websitesList.length}`}
          icon={<Globe className="h-4 w-4" />}
        />
        <StatCard
          label="Due invoices"
          value={pendingInvoices}
          icon={<FileText className="h-4 w-4" />}
          hint={pendingInvoices > 0 ? "Action needed" : undefined}
        />
      </div>

      {/* Main grid: recent orders + quick actions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        {/* Recent orders */}
        <DashboardPanel
          className="lg:col-span-2"
          title="Recent orders"
          description="Latest activity on your account"
          action={
            <Link to={paths.dashboardOrders} className="block w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full touch-manipulation sm:w-auto"
                iconRight={<ArrowRight className="h-3.5 w-3.5" />}
              >
                View all
              </Button>
            </Link>
          }
        >
          {recent.isLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : !recent.data?.items.length ? (
            <p className="text-sm text-gray-500">
              No orders yet.{" "}
              <Link to={paths.dashboardServices} className="font-medium text-primary-600">
                Browse services
              </Link>{" "}
              to get started.
            </p>
          ) : (
            <ul className="space-y-3 sm:space-y-0 sm:divide-y sm:divide-gray-100">
              {recent.data.items.map((o) => (
                <li
                  key={o.id}
                  className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:py-3 sm:first:pt-0 sm:last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={paths.dashboardOrder(o.id)}
                      className="font-medium text-gray-900 hover:text-primary-700"
                    >
                      {o.serviceName ?? o.service}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-500">
                      #{o.orderId} · {formatDateShort(o.orderDate)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-200/80 pt-3 sm:mt-0 sm:border-0 sm:pt-0">
                    <Badge variant={statusVariant(o.status)}>
                      {o.status.replace(/_/g, " ")}
                    </Badge>
                    <p className="text-sm font-semibold tabular-nums text-gray-900">
                      {formatUsd(o.amountUsd)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>

        {/* Quick actions */}
        <DashboardPanel title="Quick actions">
          <div className="grid grid-cols-3 gap-2">
            {QUICK_ACTIONS.map(({ to, label, icon: Icon, color }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-center transition-all hover:border-primary-200 hover:bg-primary-50/50 hover:shadow-sm"
              >
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-medium text-gray-700 group-hover:text-primary-700">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}

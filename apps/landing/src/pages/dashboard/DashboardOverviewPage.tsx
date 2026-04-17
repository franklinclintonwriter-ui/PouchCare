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
import { formatUsd, formatDateShort, orderStatusVariant } from "@/lib/format";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

const QUICK_ACTIONS: {
  to: string;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    to: paths.dashboardOrders,
    label: "Orders",
    icon: Package,
    color: "bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400",
  },
  {
    to: paths.dashboardCart,
    label: "Cart",
    icon: ShoppingCart,
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  {
    to: paths.dashboardServices,
    label: "Services",
    icon: Briefcase,
    color: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  },
  {
    to: paths.dashboardWallet,
    label: "Wallet",
    icon: Wallet,
    color: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  },
  {
    to: paths.dashboardHosting,
    label: "Domains",
    icon: Globe2,
    color: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400",
  },
  {
    to: paths.dashboardWebsites,
    label: "Websites",
    icon: Globe,
    color: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
  },
  {
    to: paths.dashboardInvoices,
    label: "Invoices",
    icon: FileText,
    color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
  },
  {
    to: paths.dashboardWebToApk,
    label: "Web→APK",
    icon: Smartphone,
    color: "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400",
  },
  {
    to: paths.dashboardBilling,
    label: "Billing",
    icon: Receipt,
    color: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
  },
  {
    to: paths.dashboardReferrals,
    label: "Referrals",
    icon: Users,
    color: "bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400",
  },
  {
    to: paths.dashboardSupport,
    label: "Support",
    icon: LifeBuoy,
    color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400",
  },
  {
    to: paths.dashboardSettings,
    label: "Settings",
    icon: Settings,
    color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  },
];

export default function DashboardOverviewPage() {
  const user = usePortalAuthStore((s) => s.user);
  const wallet = usePortalWallet();
  const stats = useReferralStats();
  const recent = usePortalOrders(1, 5);
  const websites = usePortalWebsites(1, 10);
  const domainsQuery = usePortalDomains(1, 10);
  const invoicesQuery = usePortalInvoices(1, 10, "pending");

  const bal = wallet.data?.walletBalance ?? user?.walletBalance ?? 0;
  const websitesList = websites.data?.items ?? [];
  const onlineSites = websitesList.filter((w) => w.status === "online").length;
  const domainsList = domainsQuery.data?.items ?? [];
  const pendingInvoices =
    invoicesQuery.data?.meta?.total ?? invoicesQuery.data?.items.length ?? 0;
  const statSkeleton = (
    <span className="inline-block h-7 w-20 animate-pulse rounded-md bg-gray-200/80 align-middle dark:bg-gray-700/50" />
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Welcome */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 sm:text-sm sm:normal-case sm:tracking-normal sm:text-gray-500 sm:dark:text-gray-400">
            Welcome back
          </p>
          <h2 className="mt-0.5 truncate text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-xl">
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
        {wallet.isError ? (
          <ErrorState
            compact
            title="Wallet failed"
            error={wallet.error}
            onRetry={() => wallet.refetch()}
          />
        ) : (
          <StatCard
            label="Wallet"
            value={wallet.isLoading ? statSkeleton : formatUsd(bal)}
            icon={<Wallet className="h-4 w-4" />}
          />
        )}

        {stats.isError ? (
          <ErrorState
            compact
            title="Referrals failed"
            error={stats.error}
            onRetry={() => stats.refetch()}
          />
        ) : (
          <StatCard
            label="Referrals"
            value={
              stats.isLoading ? statSkeleton : (stats.data?.totalReferrals ?? 0)
            }
            icon={<Users className="h-4 w-4" />}
          />
        )}

        {stats.isError ? (
          <ErrorState
            compact
            title="Earnings failed"
            error={stats.error}
            onRetry={() => stats.refetch()}
          />
        ) : (
          <StatCard
            label="Earnings"
            value={
              stats.isLoading
                ? statSkeleton
                : formatUsd(stats.data?.totalCommissionEarned ?? 0)
            }
            icon={<Receipt className="h-4 w-4" />}
          />
        )}

        {domainsQuery.isError ? (
          <ErrorState
            compact
            title="Domains failed"
            error={domainsQuery.error}
            onRetry={() => domainsQuery.refetch()}
          />
        ) : (
          <StatCard
            label="Domains"
            value={
              domainsQuery.isLoading
                ? statSkeleton
                : (domainsQuery.data?.meta.total ?? domainsList.length)
            }
            icon={<Globe2 className="h-4 w-4" />}
          />
        )}

        {websites.isError ? (
          <ErrorState
            compact
            title="Websites failed"
            error={websites.error}
            onRetry={() => websites.refetch()}
          />
        ) : (
          <StatCard
            label="Sites online"
            value={
              websites.isLoading
                ? statSkeleton
                : `${onlineSites}/${websitesList.length}`
            }
            icon={<Globe className="h-4 w-4" />}
          />
        )}

        {invoicesQuery.isError ? (
          <ErrorState
            compact
            title="Invoices failed"
            error={invoicesQuery.error}
            onRetry={() => invoicesQuery.refetch()}
          />
        ) : (
          <StatCard
            label="Due invoices"
            value={invoicesQuery.isLoading ? statSkeleton : pendingInvoices}
            icon={<FileText className="h-4 w-4" />}
            hint={
              !invoicesQuery.isLoading && pendingInvoices > 0
                ? "Action needed"
                : undefined
            }
          />
        )}
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
            <div className="space-y-3">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : recent.isError ? (
            <ErrorState
              compact
              error={recent.error}
              onRetry={() => recent.refetch()}
            />
          ) : !recent.data?.items.length ? (
            <EmptyState
              icon={<Package />}
              title="No orders yet"
              description="Your recent orders will show up here once you place your first order."
              action={
                <Link to={paths.dashboardServices}>
                  <Button size="sm">Browse services</Button>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3 sm:space-y-0 sm:divide-y sm:divide-gray-100 sm:dark:divide-gray-800">
              {recent.data.items.map((o) => (
                <li
                  key={o.id}
                  className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:py-3 sm:first:pt-0 sm:last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={paths.dashboardOrder(o.id)}
                      className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-700"
                    >
                      {o.serviceName ?? o.service}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      #{o.orderId} · {formatDateShort(o.orderDate)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-200/80 dark:border-gray-700 pt-3 sm:mt-0 sm:border-0 sm:pt-0">
                    <Badge variant={orderStatusVariant(o.status)}>
                      {o.status.replace(/_/g, " ")}
                    </Badge>
                    <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
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
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 p-3 text-center transition-all hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-950/30 hover:shadow-sm"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl",
                    color,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-700">
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

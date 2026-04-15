/**
 * Hosting overview: KPIs + "My domains" (responsive card grid on small screens, table on md+).
 * @see HOSTING_PORTAL.md — do not ship table-only layouts without mobile cards.
 */
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Globe2,
  Loader2,
  Lock,
  Server,
  Shield,
} from "lucide-react";
import { paths } from "@/routes/paths";
import { formatDateShort, formatUsd } from "@/lib/format";
import { usePortalDomains } from "@/api/portal-hosting";
import { hostingStatusVariant } from "@/lib/hostingUtils";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export default function HostingOverviewPage() {
  const { data: domainsData, isLoading } = usePortalDomains(1, 100);
  const domains = domainsData?.items ?? [];
  const activeCount = domains.filter((d) => d.status === "active").length;
  const sslOk = domains.filter(
    (d) => d.status === "active" && new Date(d.sslExpiresAt) > new Date(),
  ).length;
  const nearestExpiry = [...domains]
    .filter((d) => d.status === "active")
    .sort(
      (a, b) =>
        new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
    )[0];
  const mrr = domains.reduce((n, d) => n + d.monthlyPriceUsd, 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-gray-200/90 dark:border-gray-700 bg-gradient-to-br from-white via-primary-50/40 to-sky-50/50 p-4 shadow-sm sm:p-6 md:p-8",
        )}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-sky-400/15 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200/60 bg-white/80 dark:bg-gray-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700 shadow-sm">
              <Globe2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Domain & hosting
            </div>
            <h1 className="mt-3 text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl md:text-3xl">
              Your infrastructure
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base">
              Monitor domains, SSL, and DNS. Use{" "}
              <Link
                to={paths.dashboardHostingRegister}
                className="font-semibold text-primary-700 underline decoration-primary-300 underline-offset-2 hover:text-primary-900"
              >
                Register & search
              </Link>{" "}
              to find new names.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
            as="a"
            href="mailto:support@pouchcare.com"
          >
            Request migration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Active domains"
          value={activeCount}
          hint={`${domains.length} total in portfolio`}
          icon={<Globe2 className="h-4 w-4 text-primary-500" />}
        />
        <StatCard
          label="SSL protected"
          value={`${sslOk}/${activeCount || 1}`}
          hint="Valid certificates"
          icon={<Shield className="h-4 w-4 text-emerald-500" />}
        />
        <StatCard
          label="Est. monthly"
          value={formatUsd(mrr)}
          hint="Combined plans"
          icon={<Server className="h-4 w-4 text-sky-500" />}
        />
        <StatCard
          label="Next renewal"
          value={
            nearestExpiry ? formatDateShort(nearestExpiry.expiresAt) : "—"
          }
          hint={nearestExpiry?.fqdn ?? "—"}
          icon={<Activity className="h-4 w-4 text-amber-500" />}
        />
      </div>

      <DashboardPanel
        title="My domains"
        description="Status, plans, and renewal windows. Tap a card or open Manage for DNS and nameservers."
        action={
          <Link
            to={paths.dashboardHostingRegister}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:from-primary-700 hover:to-primary-600 sm:min-h-0 sm:w-auto"
          >
            Register domain
          </Link>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : domainsData === undefined ? (
          <p className="py-10 text-center text-sm text-red-600">
            Failed to load domains. Please try again.
          </p>
        ) : (
          <>
            {/* Mobile / small tablet: stacked cards */}
            <ul className="grid grid-cols-1 gap-3 md:hidden">
              {domains.map((d) => (
            <li key={d.id}>
              <Link
                to={paths.dashboardHostingDomain(d.id)}
                className="flex min-h-[44px] flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-4 transition-colors active:bg-primary-50/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="break-all font-mono text-base font-semibold text-gray-900 dark:text-gray-100">
                    {d.fqdn}
                  </span>
                  <Badge variant={hostingStatusVariant(d.status)}>
                    {d.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                  <div>
                    <dt className="text-gray-400">Plan</dt>
                    <dd className="font-medium text-gray-800 dark:text-gray-200">{d.planName}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">Monthly</dt>
                    <dd className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                      {formatUsd(d.monthlyPriceUsd)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">Expires</dt>
                    <dd className="tabular-nums">
                      {formatDateShort(d.expiresAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">SSL</dt>
                    <dd className="flex items-center gap-1 tabular-nums">
                      <Lock className="h-3 w-3 text-emerald-600" aria-hidden />
                      {formatDateShort(d.sslExpiresAt)}
                    </dd>
                  </div>
                </dl>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600">
                  Manage domain
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            </li>
              ))}
            </ul>

            {/* md+: data table */}
            <div className="hidden overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <th className="px-3 py-3 font-semibold lg:px-4">Domain</th>
                <th className="px-3 py-3 font-semibold lg:px-4">Status</th>
                <th className="px-3 py-3 font-semibold lg:px-4">Plan</th>
                <th className="px-3 py-3 font-semibold lg:px-4">Expires</th>
                <th className="px-3 py-3 font-semibold lg:px-4">SSL</th>
                <th className="px-3 py-3 text-right font-semibold lg:px-4">
                  Monthly
                </th>
                <th className="w-px px-3 py-3 lg:px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {domains.map((d) => (
                <tr
                  key={d.id}
                  className="group transition-colors hover:bg-primary-50/40"
                >
                  <td className="px-3 py-3.5 lg:px-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                        {d.fqdn}
                      </span>
                      {d.autoRenew && (
                        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          Auto
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 lg:px-4">
                    <Badge variant={hostingStatusVariant(d.status)}>
                      {d.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-3 py-3.5 text-gray-700 dark:text-gray-300 lg:px-4">
                    {d.planName}
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-gray-600 dark:text-gray-400 lg:px-4">
                    {formatDateShort(d.expiresAt)}
                  </td>
                  <td className="px-3 py-3.5 lg:px-4">
                    <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <Lock
                        className="h-3.5 w-3.5 shrink-0 text-emerald-600"
                        aria-hidden
                      />
                      {formatDateShort(d.sslExpiresAt)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100 lg:px-4">
                    {formatUsd(d.monthlyPriceUsd)}
                  </td>
                  <td className="px-3 py-3.5 text-right lg:px-4">
                    <Link
                      to={paths.dashboardHostingDomain(d.id)}
                      className="inline-flex min-h-[40px] min-w-[40px] items-center justify-end gap-1 text-sm font-semibold text-primary-600 sm:min-h-0 sm:justify-start"
                    >
                      Manage
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
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

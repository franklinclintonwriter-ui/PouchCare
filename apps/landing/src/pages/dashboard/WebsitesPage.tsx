/**
 * My Websites overview — health cards, SEO scores, analytics summary.
 * Route: /dashboard/websites
 */
import { Link } from "react-router-dom";
import {
  Activity,
  Eye,
  Globe,
  Lock,
  Shield,
  TrendingUp,
  Unlock,
} from "lucide-react";
import { paths } from "@/routes/paths";
import {
  MOCK_WEBSITES,
  SITE_STATUS_LABEL,
  SITE_STATUS_VARIANT,
  seoScoreColor,
} from "@/data/mockWebsites";
import { formatDateShort } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

export default function WebsitesPage() {
  const online = MOCK_WEBSITES.filter((w) => w.status === "online").length;
  const avgSeo = Math.round(
    MOCK_WEBSITES.reduce((s, w) => s + w.seoScore, 0) / (MOCK_WEBSITES.length || 1),
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">My Websites</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor uptime, SEO health, SSL status, and analytics for your sites.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Sites</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{MOCK_WEBSITES.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Online</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{online}</p>
        </div>
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Avg. SEO</p>
          <p className={cn("mt-1 text-2xl font-bold tabular-nums", seoScoreColor(avgSeo))}>{avgSeo}/100</p>
        </div>
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">SSL issues</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-red-600">
            {MOCK_WEBSITES.filter((w) => !w.sslValid).length}
          </p>
        </div>
      </div>

      {/* Site cards */}
      <DashboardPanel
        title="All sites"
        description="Click a site to see detailed performance and SEO data."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {MOCK_WEBSITES.map((site) => (
            <Link
              key={site.id}
              to={paths.dashboardWebsite(site.id)}
              className="group flex flex-col rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 group-hover:bg-primary-50 group-hover:text-primary-600">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{site.name}</p>
                    <p className="truncate font-mono text-xs text-gray-400">{site.fqdn}</p>
                  </div>
                </div>
                <Badge variant={SITE_STATUS_VARIANT[site.status]}>
                  {SITE_STATUS_LABEL[site.status]}
                </Badge>
              </div>

              {/* Metrics */}
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
                <div>
                  <p className="flex items-center gap-1 text-xs text-gray-400">
                    <TrendingUp className="h-3 w-3" /> SEO
                  </p>
                  <p className={cn("mt-0.5 text-lg font-bold tabular-nums", seoScoreColor(site.seoScore))}>
                    {site.seoScore}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-xs text-gray-400">
                    <Activity className="h-3 w-3" /> Uptime
                  </p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-gray-900">
                    {site.uptimePct}%
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-xs text-gray-400">
                    <Eye className="h-3 w-3" /> Visitors
                  </p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-gray-900">
                    {site.analytics.visitorsMonth.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Bottom tags */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-medium",
                    site.sslValid
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700",
                  )}
                >
                  {site.sslValid ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  SSL {site.sslValid ? "valid" : "expired"}
                </span>
                {site.hostingPlan && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-medium text-gray-600">
                    <Shield className="h-3 w-3" />
                    {site.hostingPlan}
                  </span>
                )}
                <span className="ml-auto text-gray-400">
                  Checked {formatDateShort(site.lastChecked)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </DashboardPanel>
    </div>
  );
}

/**
 * Single website detail: performance, uptime, SEO score, SSL, tech stack, analytics.
 * Route: /dashboard/websites/:siteId
 */
import { Link, Navigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  Clock,
  Eye,
  ExternalLink,
  Globe,
  Lock,
  MousePointerClick,
  RefreshCw,
  Shield,
  Timer,
  TrendingUp,
  Unlock,
} from "lucide-react";
import { paths } from "@/routes/paths";
import {
  getMockWebsiteById,
  SITE_STATUS_LABEL,
  SITE_STATUS_VARIANT,
  seoScoreColor,
  seoScoreBg,
} from "@/data/mockWebsites";
import { formatDateShort } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

export default function WebsiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const site = siteId ? getMockWebsiteById(siteId) : undefined;

  if (!siteId || !site) {
    return <Navigate to={paths.dashboardWebsites} replace />;
  }

  const a = site.analytics;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 sm:text-sm" aria-label="Breadcrumb">
        <Link
          to={paths.dashboardWebsites}
          className="inline-flex min-h-[44px] items-center gap-1 font-medium text-primary-600 hover:text-primary-800 sm:min-h-0"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          My Websites
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="break-all font-mono text-gray-900">{site.fqdn}</span>
      </nav>

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/90 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 p-5 text-white shadow-lg sm:p-7 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Globe className="h-6 w-6 text-primary-300" />
              <h1 className="break-all font-mono text-xl font-bold tracking-tight sm:text-2xl">{site.name}</h1>
              <Badge variant={SITE_STATUS_VARIANT[site.status]}>
                {SITE_STATUS_LABEL[site.status]}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-white"
              >
                {site.url}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                <Activity className="h-3.5 w-3.5 text-emerald-300" />
                {site.uptimePct}% uptime
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm",
                  site.sslValid ? "text-emerald-300" : "text-red-300",
                )}
              >
                {site.sslValid ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                SSL {site.sslValid ? "valid" : "expired"}
              </span>
              {site.hostingPlan && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                  <Shield className="h-3.5 w-3.5 text-sky-300" />
                  {site.hostingPlan}
                </span>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[44px] w-full border-white/20 bg-white/10 text-white hover:bg-white/15 sm:min-h-0 sm:w-auto"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => toast.success("Mock: health check queued")}
          >
            Re-check now
          </Button>
        </div>
      </div>

      {/* SEO + analytics row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cn("flex flex-col items-center justify-center rounded-xl border p-5", seoScoreBg(site.seoScore))}>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">SEO Score</p>
          <p className={cn("mt-1 text-4xl font-extrabold tabular-nums", seoScoreColor(site.seoScore))}>
            {site.seoScore}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">/100</p>
        </div>
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Eye className="h-3.5 w-3.5" /> Monthly visitors
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {a.visitorsMonth.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <MousePointerClick className="h-3.5 w-3.5" /> Pageviews
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {a.pageviewsMonth.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <TrendingUp className="h-3.5 w-3.5" /> Bounce rate
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{a.bounceRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Performance / uptime panel */}
        <DashboardPanel title="Performance" description="Uptime and session analytics.">
          <dl className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Activity className="h-3.5 w-3.5" /> Uptime
              </dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-gray-900">{site.uptimePct}%</dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Timer className="h-3.5 w-3.5" /> Avg. session
              </dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-gray-900">
                {Math.floor(a.avgSessionSec / 60)}m {a.avgSessionSec % 60}s
              </dd>
            </div>
            <div className="col-span-2 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Clock className="h-3.5 w-3.5" /> Last checked
              </dt>
              <dd className="mt-1 text-sm text-gray-800">{formatDateShort(site.lastChecked)}</dd>
            </div>
          </dl>
        </DashboardPanel>

        {/* SSL + tech stack panel */}
        <DashboardPanel title="Infrastructure" description="SSL certificate and tech stack.">
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {site.sslValid ? (
                    <Lock className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Unlock className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      SSL {site.sslValid ? "valid" : "expired"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Expires {formatDateShort(site.sslExpiresAt)}
                    </p>
                  </div>
                </div>
                <Badge variant={site.sslValid ? "success" : "error"}>
                  {site.sslValid ? "Secure" : "Insecure"}
                </Badge>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Tech stack
              </p>
              <div className="flex flex-wrap gap-2">
                {site.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {site.linkedDomainId && (
              <Link
                to={paths.dashboardHostingDomain(site.linkedDomainId!)}
                className="flex min-h-[44px] items-center justify-between rounded-xl border border-primary-100 bg-primary-50/40 px-4 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100"
              >
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Manage domain hosting
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}

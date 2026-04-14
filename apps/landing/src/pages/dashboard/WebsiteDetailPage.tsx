/**
 * Single website detail: performance, uptime, SEO score, SSL, tech stack, analytics.
 * Route: /dashboard/websites/:siteId
 */
import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
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
  Pencil,
  RefreshCw,
  Save,
  Shield,
  Timer,
  Trash2,
  TrendingUp,
  Unlock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { paths } from "@/routes/paths";
import {
  SITE_STATUS_LABEL,
  SITE_STATUS_VARIANT,
  seoScoreColor,
  seoScoreBg,
} from "@/data/constants";
import { usePortalWebsite, useUpdateWebsite, useDeleteWebsite } from "@/api/portal-websites";
import { formatDateShort } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/cn";

export default function WebsiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const site = usePortalWebsite(siteId);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editType, setEditType] = useState("");
  const [editPlatform, setEditPlatform] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const updateMutation = useUpdateWebsite();
  const deleteMutation = useDeleteWebsite();

  if (!siteId || site.isLoading) {
    return <p className="text-center text-gray-500">Loading…</p>;
  }

  if (site.error || !site.data) {
    return <Navigate to={paths.dashboardWebsites} replace />;
  }

  const websiteData = site.data;
  const a = websiteData.analytics;

  const handleEditClick = () => {
    setEditName(websiteData.name);
    setEditUrl(websiteData.url);
    setEditType(websiteData.type || "Business");
    setEditPlatform(websiteData.platform || "Custom");
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editUrl.trim()) {
      toast.error("Name and URL are required");
      return;
    }

    await updateMutation.mutateAsync({
      id: siteId,
      name: editName,
      url: editUrl,
      type: editType,
      platform: editPlatform,
    });

    setIsEditing(false);
    toast.success("Website updated successfully");
  };

  const handleDeleteWebsite = async () => {
    await deleteMutation.mutateAsync(siteId);
    setDeleteConfirm(false);
    navigate(paths.dashboardWebsites);
    toast.success("Website deleted successfully");
  };

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
        <span className="break-all font-mono text-gray-900">{websiteData.fqdn}</span>
      </nav>

      {/* Edit Form */}
      {isEditing && (
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Edit Website</h2>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name" required>Name</Label>
              <Input
                id="edit-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-url" required>URL</Label>
              <Input
                id="edit-url"
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <select
                  id="edit-type"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors hover:border-gray-300 focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60"
                >
                  <option value="Business">Business</option>
                  <option value="Portfolio">Portfolio</option>
                  <option value="Blog">Blog</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="edit-platform">Platform</Label>
                <select
                  id="edit-platform"
                  value={editPlatform}
                  onChange={(e) => setEditPlatform(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors hover:border-gray-300 focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60"
                >
                  <option value="WordPress">WordPress</option>
                  <option value="React">React</option>
                  <option value="Next.js">Next.js</option>
                  <option value="Custom">Custom</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={updateMutation.isPending}
                icon={<Save className="h-4 w-4" />}
                className="flex-1"
              >
                {updateMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={updateMutation.isPending}
                icon={<X className="h-4 w-4" />}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Hero card */}
      {!isEditing && (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/90 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 p-5 text-white shadow-lg sm:p-7 md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Globe className="h-6 w-6 text-primary-300" />
                <h1 className="break-all font-mono text-xl font-bold tracking-tight sm:text-2xl">{websiteData.name}</h1>
                <Badge variant={SITE_STATUS_VARIANT[websiteData.status]}>
                  {SITE_STATUS_LABEL[websiteData.status]}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                <a
                  href={websiteData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  {websiteData.url}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                  <Activity className="h-3.5 w-3.5 text-emerald-300" />
                  {websiteData.uptimePct}% uptime
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm",
                    websiteData.sslValid ? "text-emerald-300" : "text-red-300",
                  )}
                >
                  {websiteData.sslValid ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  SSL {websiteData.sslValid ? "valid" : "expired"}
                </span>
                {websiteData.hostingPlan && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                    <Shield className="h-3.5 w-3.5 text-sky-300" />
                    {websiteData.hostingPlan}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[44px] border-white/20 bg-white/10 text-white hover:bg-white/15 sm:min-h-0"
                icon={<Pencil className="h-4 w-4" />}
                onClick={handleEditClick}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[44px] border-white/20 bg-white/10 text-white hover:bg-white/15 sm:min-h-0"
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={() => toast.success("Mock: health check queued")}
              >
                Re-check now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SEO + analytics row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cn("flex flex-col items-center justify-center rounded-xl border p-5", seoScoreBg(websiteData.seoScore))}>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">SEO Score</p>
          <p className={cn("mt-1 text-4xl font-extrabold tabular-nums", seoScoreColor(websiteData.seoScore))}>
            {websiteData.seoScore}
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
              <dd className="mt-1 text-xl font-bold tabular-nums text-gray-900">{websiteData.uptimePct}%</dd>
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
              <dd className="mt-1 text-sm text-gray-800">{formatDateShort(websiteData.lastChecked)}</dd>
            </div>
          </dl>
        </DashboardPanel>

        {/* SSL + tech stack panel */}
        <DashboardPanel title="Infrastructure" description="SSL certificate and tech stack.">
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {websiteData.sslValid ? (
                    <Lock className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Unlock className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      SSL {websiteData.sslValid ? "valid" : "expired"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Expires {formatDateShort(websiteData.sslExpiresAt)}
                    </p>
                  </div>
                </div>
                <Badge variant={websiteData.sslValid ? "success" : "error"}>
                  {websiteData.sslValid ? "Secure" : "Insecure"}
                </Badge>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Tech stack
              </p>
              <div className="flex flex-wrap gap-2">
                {websiteData.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {websiteData.linkedDomainId && (
              <Link
                to={paths.dashboardHostingDomain(websiteData.linkedDomainId!)}
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

      {/* Danger Zone */}
      {!isEditing && (
        <DashboardPanel title="Danger Zone" description="Irreversible actions.">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold text-gray-900">Delete Website</p>
                <p className="mt-1 text-sm text-gray-600">
                  Permanently remove this website from your account. This action cannot be undone.
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => setDeleteConfirm(true)}
                className="min-h-[44px] w-full whitespace-nowrap sm:min-h-0 sm:w-auto"
              >
                Delete Website
              </Button>
            </div>
          </div>
        </DashboardPanel>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm}
        title="Delete Website"
        description="Are you sure you want to delete this website? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => void handleDeleteWebsite()}
        onCancel={() => setDeleteConfirm(false)}
      />
    </div>
  );
}

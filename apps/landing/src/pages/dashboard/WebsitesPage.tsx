/**
 * My Websites overview — health cards, SEO scores, analytics summary.
 * Route: /dashboard/websites
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Eye,
  Globe,
  Lock,
  Plus,
  Shield,
  Trash2,
  TrendingUp,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { paths } from "@/routes/paths";
import {
  SITE_STATUS_LABEL,
  SITE_STATUS_VARIANT,
  seoScoreColor,
} from "@/data/constants";
import { usePortalWebsites, useCreateWebsite, useDeleteWebsite } from "@/api/portal-websites";
import { formatDateShort } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/cn";

export default function WebsitesPage() {
  const websites = usePortalWebsites(1, 100);
  const data = websites.data?.items ?? [];

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState("Business");
  const [newPlatform, setNewPlatform] = useState("Custom");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id?: string }>({ open: false });

  const createMutation = useCreateWebsite();
  const deleteMutation = useDeleteWebsite();

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) {
      toast.error("Name and URL are required");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: newName,
        url: newUrl,
        type: newType,
        platform: newPlatform,
      });
      setShowAddForm(false);
      setNewName("");
      setNewUrl("");
      setNewType("Business");
      setNewPlatform("Custom");
      toast.success("Website added successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add website");
    }
  };

  const handleDeleteWebsite = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm({ open: false });
      toast.success("Website deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete website");
    }
  };

  const online = data.filter((w) => w.status === "online").length;
  const avgSeo = Math.round(
    data.reduce((s, w) => s + w.seoScore, 0) / (data.length || 1),
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">My Websites</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor uptime, SEO health, SSL status, and analytics for your sites.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setShowAddForm(true)}
          className="min-h-[44px] sm:min-h-0"
        >
          Add Website
        </Button>
      </div>

      {/* Add Website Form */}
      {showAddForm && (
        <div className="rounded-2xl border border-gray-200/90 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Add New Website</h2>
          <form onSubmit={handleAddWebsite} className="space-y-4">
            <div>
              <Label htmlFor="site-name" required>Name</Label>
              <Input
                id="site-name"
                type="text"
                placeholder="My Website"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="site-url" required>URL</Label>
              <Input
                id="site-url"
                type="url"
                placeholder="https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="site-type">Type</Label>
                <select
                  id="site-type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors hover:border-gray-300 dark:hover:border-gray-600 focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60"
                >
                  <option value="Business">Business</option>
                  <option value="Portfolio">Portfolio</option>
                  <option value="Blog">Blog</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="site-platform">Platform</Label>
                <select
                  id="site-platform"
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors hover:border-gray-300 dark:hover:border-gray-600 focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60"
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
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? "Creating…" : "Create Website"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewName("");
                  setNewUrl("");
                  setNewType("Business");
                  setNewPlatform("Custom");
                }}
                disabled={createMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Sites</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{websites.isLoading ? "…" : data.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Online</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{websites.isLoading ? "…" : online}</p>
        </div>
        <div className="rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Avg. SEO</p>
          <p className={cn("mt-1 text-2xl font-bold tabular-nums", seoScoreColor(avgSeo))}>{websites.isLoading ? "…" : `${avgSeo}/100`}</p>
        </div>
        <div className="rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">SSL issues</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-red-600">
            {websites.isLoading ? "…" : data.filter((w) => !w.sslValid).length}
          </p>
        </div>
      </div>

      {/* Site cards */}
      <DashboardPanel
        title="All sites"
        description="Click a site to see detailed performance and SEO data."
      >
        {websites.isLoading && (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading websites…</p>
        )}
        {websites.error && (
          <p className="py-8 text-center text-sm text-red-500">Failed to load websites</p>
        )}
        {!websites.isLoading && !websites.error && data.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No websites yet</p>
        )}
        {!websites.isLoading && !websites.error && data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {data.map((site) => (
            <div
              key={site.id}
              className="group flex flex-col rounded-2xl border border-gray-200/90 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <Link
                  to={paths.dashboardWebsite(site.id)}
                  className="flex flex-1 items-center gap-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{site.name}</p>
                    <p className="truncate font-mono text-xs text-gray-400">{site.fqdn}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Badge variant={SITE_STATUS_VARIANT[site.status]}>
                    {SITE_STATUS_LABEL[site.status]}
                  </Badge>
                  <button
                    onClick={() => setDeleteConfirm({ open: true, id: site.id })}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1.5 text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete website"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Metrics */}
              <Link
                to={paths.dashboardWebsite(site.id)}
                className="group/metrics mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 dark:border-gray-800 pt-4 transition-opacity hover:opacity-80"
              >
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
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
                    {site.uptimePct}%
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-xs text-gray-400">
                    <Eye className="h-3 w-3" /> Visitors
                  </p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
                    {site.analytics.visitorsMonth.toLocaleString()}
                  </p>
                </div>
              </Link>

              {/* Bottom tags */}
              <Link
                to={paths.dashboardWebsite(site.id)}
                className="mt-3 flex flex-wrap items-center gap-2 text-xs transition-opacity hover:opacity-80"
              >
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
                  <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 font-medium text-gray-600 dark:text-gray-400">
                    <Shield className="h-3 w-3" />
                    {site.hostingPlan}
                  </span>
                )}
                <span className="ml-auto text-gray-400">
                  Checked {formatDateShort(site.lastChecked)}
                </span>
              </Link>
            </div>
          ))}
        </div>
        )}
      </DashboardPanel>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Website"
        description="Are you sure you want to delete this website? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => void handleDeleteWebsite()}
        onCancel={() => setDeleteConfirm({ open: false })}
      />
    </div>
  );
}

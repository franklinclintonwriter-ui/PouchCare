/**
 * Dashboard: Web → APK conversion tool.
 * Route: /dashboard/web-to-apk
 *
 * Panel 1 — "Convert a URL": form to queue a conversion job.
 * Panel 2 — "My conversions": table/card list from API.
 *
 * @see docs/TASKS_WEB_TO_APK.md
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Smartphone,
  Trash2,
} from "lucide-react";
import {
  WEB_TO_APK_PLANS,
} from "@/data/mockWebToApk";
import {
  APK_STATUS_LABEL,
  APK_STATUS_VARIANT,
} from "@/data/constants";
import { useApkJobs, useCreateApkJob, useApkJob, useDeleteApkJob } from "@/api/portal-web-to-apk";
import { formatDateShort, formatUsd } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

function statusBadge(status: string) {
  return (
    <Badge variant={APK_STATUS_VARIANT[status as keyof typeof APK_STATUS_VARIANT] ?? "neutral"}>
      {APK_STATUS_LABEL[status as keyof typeof APK_STATUS_LABEL] ?? status}
    </Badge>
  );
}

function JobTableRow({ job, onDelete }: { job: any; onDelete?: () => void }) {
  // Use polling hook to get updated status
  const jobDetail = useApkJob(job.status === "queued" || job.status === "processing" ? job.id : undefined);
  const currentJob = jobDetail.data || job;

  return (
    <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800">
      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{currentJob.appName}</td>
      <td className="max-w-[160px] truncate px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
        {currentJob.url}
      </td>
      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{currentJob.plan}</td>
      <td className="px-4 py-3 tabular-nums text-gray-500 dark:text-gray-400">
        {currentJob.apkSizeMb ? `${currentJob.apkSizeMb} MB` : "—"}
      </td>
      <td className="px-4 py-3 tabular-nums text-gray-500 dark:text-gray-400">
        {formatDateShort(currentJob.createdAt)}
      </td>
      <td className="px-4 py-3">{statusBadge(currentJob.status)}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {currentJob.status === "ready" && currentJob.downloadUrl ? (
            <a
              href={currentJob.downloadUrl}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
              download
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          ) : currentJob.status === "processing" || currentJob.status === "queued" ? (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {APK_STATUS_LABEL[currentJob.status as keyof typeof APK_STATUS_LABEL]}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            aria-label="Delete job"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function JobMobileCard({ job, onDelete }: { job: any; onDelete?: () => void }) {
  // Use polling hook to get updated status
  const jobDetail = useApkJob(job.status === "queued" || job.status === "processing" ? job.id : undefined);
  const currentJob = jobDetail.data || job;

  return (
    <li className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100">
            <Smartphone className="h-4 w-4 text-primary-700" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{currentJob.appName}</p>
            <p className="truncate font-mono text-[11px] text-gray-400">{currentJob.url}</p>
          </div>
        </div>
        {statusBadge(currentJob.status)}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-gray-400">Plan</dt>
          <dd className="font-medium text-gray-700 dark:text-gray-300">{currentJob.plan}</dd>
        </div>
        <div>
          <dt className="text-gray-400">Size</dt>
          <dd className="font-medium text-gray-700 dark:text-gray-300">
            {currentJob.apkSizeMb ? `${currentJob.apkSizeMb} MB` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-400">Created</dt>
          <dd className="tabular-nums text-gray-700 dark:text-gray-300">{formatDateShort(currentJob.createdAt)}</dd>
        </div>
      </dl>
      <div className="mt-3 flex gap-2">
        {currentJob.status === "ready" && currentJob.downloadUrl && (
          <a
            href={currentJob.downloadUrl}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 text-sm font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
            download
          >
            <Download className="h-4 w-4" />
            Download APK
          </a>
        )}
        {(currentJob.status === "processing" || currentJob.status === "queued") && (
          <div className="flex flex-1 items-center justify-center gap-1.5 text-xs text-gray-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {APK_STATUS_LABEL[currentJob.status as keyof typeof APK_STATUS_LABEL]}…
          </div>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex min-h-[44px] w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          aria-label="Delete job"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export default function WebToApkPage() {
  const [url, setUrl] = useState("");
  const [appName, setAppName] = useState("");
  const [planId, setPlanId] = useState(WEB_TO_APK_PLANS[1]?.id ?? "starter");

  const jobs = useApkJobs(1, 100);
  const createJob = useCreateApkJob();
  const deleteJob = useDeleteApkJob();
  const selectedPlan = WEB_TO_APK_PLANS.find((p) => p.id === planId) ?? WEB_TO_APK_PLANS[0]!;

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Delete this conversion job?")) return;
    try {
      await deleteJob.mutateAsync(jobId);
      toast.success("Job deleted");
      jobs.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete job");
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Enter a website URL");
      return;
    }
    if (!appName.trim()) {
      toast.error("Enter an app name");
      return;
    }

    try {
      await createJob.mutateAsync({
        appName: appName.trim(),
        url: url.trim(),
        plan: selectedPlan.name,
      });
      setUrl("");
      setAppName("");
      toast.success("Conversion queued! We'll email you when it's ready.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to queue conversion");
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">Web → APK</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Convert any website or PWA into a downloadable Android APK.{" "}
            <Link
              to="/services/web-to-apk"
              className="font-medium text-primary-600 hover:underline"
            >
              Learn more
            </Link>
          </p>
        </div>
        <Badge variant="info">
          {selectedPlan.name} plan
        </Badge>
      </div>

      {/* ── Panel 1: Convert form ─────────────────────────────────────── */}
      <DashboardPanel
        title="Convert a URL"
        description="Fill in the details below and click Convert. We'll process your APK and notify you by email."
      >
        <form onSubmit={handleConvert} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="apk-url">Website URL</Label>
              <Input
                id="apk-url"
                type="url"
                placeholder="https://yourbusiness.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1 min-h-[48px] text-base sm:text-sm"
                disabled={createJob.isPending}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must be publicly accessible. HTTPS recommended.
              </p>
            </div>
            <div>
              <Label htmlFor="apk-name">App name</Label>
              <Input
                id="apk-name"
                placeholder="My Business App"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="mt-1 min-h-[48px] text-base sm:text-sm"
                disabled={createJob.isPending}
                required
              />
            </div>
            <div>
              <Label htmlFor="apk-plan">Hosting plan</Label>
              <select
                id="apk-plan"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:bg-gray-900 dark:text-gray-100"
                disabled={createJob.isPending}
              >
                {WEB_TO_APK_PLANS.map((p: typeof WEB_TO_APK_PLANS[0]) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.monthlyUsd > 0 ? ` — ${formatUsd(p.monthlyUsd)}/mo` : " — Free"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plan features preview */}
          <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-4">
            <p className="mb-2 text-xs font-semibold text-primary-700">
              {selectedPlan.name} plan includes:
            </p>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {selectedPlan.features.slice(0, 4).map((f: string) => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={createJob.isPending}
            className="min-h-[52px] w-full touch-manipulation sm:w-auto sm:min-w-[200px]"
            icon={
              createJob.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Smartphone className="h-5 w-5" />
              )
            }
          >
            {createJob.isPending ? "Queuing conversion…" : "Convert to APK"}
          </Button>
        </form>
      </DashboardPanel>

      {/* ── Panel 2: My conversions ───────────────────────────────────── */}
      <DashboardPanel
        title="My conversions"
        description="All APK jobs for your account."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[40px]"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => void jobs.refetch()}
          >
            Refresh
          </Button>
        }
      >
        {jobs.isLoading && (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading conversions…</p>
        )}
        {jobs.error && (
          <p className="py-8 text-center text-sm text-red-500">Failed to load conversions</p>
        )}
        {!jobs.isLoading && !jobs.error && jobs.data?.items.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No conversions yet. Fill in the form above to get started.
          </p>
        )}
        {!jobs.isLoading && !jobs.error && jobs.data?.items && jobs.data.items.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800 md:block">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {["App name", "URL", "Plan", "Size", "Created", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {jobs.data.items.map((o) => (
                    <JobTableRow
                      key={o.id}
                      job={o}
                      onDelete={() => void handleDeleteJob(o.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-3 md:hidden">
              {jobs.data.items.map((o) => (
                <JobMobileCard
                  key={o.id}
                  job={o}
                  onDelete={() => void handleDeleteJob(o.id)}
                />
              ))}
            </ul>
          </>
        )}
      </DashboardPanel>

      {/* ── Upgrade prompt ────────────────────────────────────────────── */}
      <div className={cn(
        "flex flex-col items-start justify-between gap-4 rounded-xl border border-primary-100",
        "bg-gradient-to-r from-primary-50 to-violet-50 p-4 sm:flex-row sm:items-center sm:p-5",
      )}>
        <div className="flex items-start gap-3">
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Need Play Store signing or unlimited builds?
            </p>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
              Upgrade to Pro — signed APKs, unlimited conversions, priority queue.
            </p>
          </div>
        </div>
        <Link
          to="/services/web-to-apk"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-primary-300 bg-white dark:bg-gray-900 px-4 text-sm font-semibold text-primary-700 shadow-sm hover:bg-primary-50 transition-colors"
        >
          View plans
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

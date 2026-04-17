import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Cctv,
  MapPin,
  Radio,
  Wifi,
  WifiOff,
  AlertTriangle,
  ChevronRight,
  Building2,
  Search,
  Shield,
  Activity,
  Cpu,
  Satellite,
  Zap,
  Clock3,
  Settings,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import { PageTransition } from "@/components/ui/PageTransition";
import { KPICard } from "@/components/ui/KPICard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  useMonitorSummary,
  type MonitorBranchRow,
  type MonitorSummaryPayload,
  type MonitorSummaryInsights,
} from "@/api/monitor";

const BRANCH_GRADIENTS = [
  { gradientFrom: "#1d4ed8", gradientTo: "#3b82f6" },
  { gradientFrom: "#0f766e", gradientTo: "#14b8a6" },
  { gradientFrom: "#7e22ce", gradientTo: "#a855f7" },
  { gradientFrom: "#b45309", gradientTo: "#f59e0b" },
  { gradientFrom: "#374151", gradientTo: "#6b7280" },
  { gradientFrom: "#be123c", gradientTo: "#fb7185" },
] as const;

type DashboardBranch = MonitorBranchRow & {
  gradientFrom: string;
  gradientTo: string;
};

const emptyTotals: MonitorSummaryPayload["totals"] = {
  totalCameras: 0,
  onlineCameras: 0,
  recordingCameras: 0,
  offlineCameras: 0,
  totalBranches: 0,
  onlineBranches: 0,
};

// ── KPI summary row ─────────────────────────────────────────

function MonitorKPIs({
  totals,
  loading,
}: {
  totals: MonitorSummaryPayload["totals"];
  loading: boolean;
}) {
  const s = totals;
  const onlinePct =
    s.totalCameras > 0 ? (s.onlineCameras / s.totalCameras) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      <KPICard
        title="Total Cameras"
        value={s.totalCameras}
        icon={<Cctv />}
        iconBg="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        loading={loading}
      />
      <KPICard
        title="Online"
        value={`${s.onlineCameras} / ${s.totalCameras}`}
        icon={<Wifi />}
        iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        change={s.totalCameras > 0 ? onlinePct : undefined}
        changeLabel="of fleet"
        loading={loading}
      />
      <KPICard
        title="Recording"
        value={s.recordingCameras}
        icon={<Radio />}
        iconBg="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        loading={loading}
      />
      <KPICard
        title="Offline / Issues"
        value={s.offlineCameras}
        icon={<WifiOff />}
        iconBg="bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
        loading={loading}
      />
    </div>
  );
}

// ── System health bar ───────────────────────────────────────

function SystemHealthBar({
  totals,
}: {
  totals: MonitorSummaryPayload["totals"];
}) {
  const s = totals;
  const pct =
    s.totalCameras > 0
      ? Math.round((s.onlineCameras / s.totalCameras) * 100)
      : 0;
  const color =
    pct >= 90 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  const label =
    pct >= 90
      ? "All systems healthy"
      : pct >= 60
        ? "Partial outages detected"
        : "Critical — multiple cameras offline";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-white px-3 py-3 shadow-soft sm:flex-row sm:items-center sm:gap-3 sm:px-4 dark:border-gray-700/60 dark:bg-gray-800/80">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          pct >= 90
            ? "bg-emerald-50 dark:bg-emerald-900/30"
            : pct >= 60
              ? "bg-amber-50 dark:bg-amber-900/30"
              : "bg-red-50 dark:bg-red-900/30",
        )}
      >
        <Shield
          className={cn(
            "h-4 w-4",
            pct >= 90
              ? "text-emerald-600 dark:text-emerald-400"
              : pct >= 60
                ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400",
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          <span className="shrink-0 font-bold text-gray-900 tabular-nums dark:text-gray-100">
            {pct}% uptime
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
          <motion.div
            className={cn("h-full rounded-full", color)}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1 border-t border-gray-100 pt-2 text-xs text-gray-400 sm:border-0 sm:pt-0 dark:border-gray-700/60">
        <Activity className="h-3 w-3" />
        <span>
          {s.onlineBranches}/{s.totalBranches} branches
        </span>
      </div>
    </div>
  );
}

// ── Camera ring progress ────────────────────────────────────

function CameraRing({
  total,
  online,
  gradientFrom,
  gradientTo,
}: {
  total: number;
  online: number;
  gradientFrom: string;
  gradientTo: string;
}) {
  const pct = total > 0 ? (online / total) * 100 : 0;
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const strokeDash = (pct / 100) * circ;
  const gradId = `ring-${gradientFrom.replace("#", "")}`;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 72 72">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          strokeWidth="6"
          className="stroke-gray-100 dark:stroke-gray-700"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {online}
        </span>
        <span className="text-[9px] text-gray-400">/{total}</span>
      </div>
    </div>
  );
}

// ── Branch status badge ─────────────────────────────────────

function BranchStatusBadge({ status }: { status: MonitorBranchRow["status"] }) {
  if (status === "online") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        Online
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <AlertTriangle className="h-3 w-3" />
        Partial
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <WifiOff className="h-3 w-3" />
      Offline
    </span>
  );
}

// ── Branch card ─────────────────────────────────────────────

function BranchCard({
  branch,
  onClick,
  index,
}: {
  branch: DashboardBranch;
  onClick: () => void;
  index: number;
}) {
  const offlineCount = branch.offlineCameras;
  const recordingCount = branch.recordingCameras;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.28 }}
    >
      <button
        onClick={onClick}
        className={cn(
          "group relative w-full overflow-hidden rounded-2xl border text-left transition-all duration-200",
          "border-gray-200/80 bg-white shadow-soft hover:shadow-card dark:border-gray-700/60 dark:bg-gray-800/80",
          "hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          branch.status === "offline" && "opacity-60",
        )}
      >
        <div
          className="h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${branch.gradientFrom}, ${branch.gradientTo})`,
          }}
        />

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${branch.gradientFrom}, ${branch.gradientTo})`,
                }}
              >
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-gray-900 dark:text-gray-100">
                  {branch.name}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {branch.city ?? "—"}, {branch.country ?? "—"}
                </div>
              </div>
            </div>
            <BranchStatusBadge status={branch.status} />
          </div>

          <div className="mt-4 flex items-center gap-4">
            <CameraRing
              total={branch.totalCameras}
              online={branch.onlineCameras}
              gradientFrom={branch.gradientFrom}
              gradientTo={branch.gradientTo}
            />

            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                  Online
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {branch.onlineCameras}
                </span>
              </div>
              {recordingCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Radio className="h-3.5 w-3.5 text-red-500" />
                    Recording
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {recordingCount}
                  </span>
                </div>
              )}
              {offlineCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <WifiOff className="h-3.5 w-3.5 text-red-400" />
                    Offline
                  </span>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {offlineCount}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Cctv className="h-3.5 w-3.5" />
                  Total
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {branch.totalCameras}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700/40">
            <p className="truncate text-xs text-gray-400">
              {branch.address ?? "—"}
            </p>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </div>
        </div>
      </button>
    </motion.div>
  );
}

// ── Fleet insights (VIGI vs manual, motion, freshness) ───────

function formatShortIso(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function FleetInsightsPanel({
  insights,
  loading,
}: {
  insights: MonitorSummaryInsights | undefined;
  loading: boolean;
}) {
  if (loading && !insights) {
    return (
      <div className="rounded-xl border border-gray-200/80 bg-white px-4 py-4 shadow-soft dark:border-gray-700/60 dark:bg-gray-800/80">
        <div className="h-20 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700/60" />
      </div>
    );
  }
  if (!insights) return null;

  const totalSrc = insights.manualCameras + insights.vigiCameras;
  const vigiPct =
    totalSrc > 0 ? Math.round((insights.vigiCameras / totalSrc) * 100) : 0;

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white px-4 py-4 shadow-soft dark:border-gray-700/60 dark:bg-gray-800/80">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Fleet insights
        </h2>
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
          Last 24h motion · NVR coverage
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700/50 dark:bg-gray-900/40">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
            <Cpu className="h-3 w-3" /> Manual
          </div>
          <p className="mt-1 text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {insights.manualCameras}
          </p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700/50 dark:bg-gray-900/40">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
            <Satellite className="h-3 w-3" /> VIGI
          </div>
          <p className="mt-1 text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {insights.vigiCameras}
            <span className="ml-1.5 text-xs font-normal text-gray-400">
              ({vigiPct}%)
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700/50 dark:bg-gray-900/40">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
            <Zap className="h-3 w-3 text-amber-500" /> Motion 24h
          </div>
          <p className="mt-1 text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {insights.motionEventsLast24h}
          </p>
        </div>
        <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 px-3 py-2.5 dark:border-amber-800/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:text-amber-400">
            <Clock3 className="h-3 w-3" /> Stale ping
          </div>
          <p className="mt-1 text-xl font-bold tabular-nums text-amber-900 dark:text-amber-200">
            {insights.onlineButStalePing}
          </p>
          <p className="text-[10px] text-amber-700/90 dark:text-amber-500/90">
            Online but no ping in 7d
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-700/50 dark:text-gray-400">
        <span>
          NVR integrations:{" "}
          <strong className="text-gray-800 dark:text-gray-200">
            {insights.vigiNvrIntegrations}
          </strong>
        </span>
        <span>
          Last motion:{" "}
          <strong className="text-gray-800 dark:text-gray-200">
            {formatShortIso(insights.lastMotionAt)}
          </strong>
        </span>
        <span>
          Last ping:{" "}
          <strong className="text-gray-800 dark:text-gray-200">
            {formatShortIso(insights.lastPingAt)}
          </strong>
        </span>
      </div>
    </div>
  );
}

function AttentionTable({
  rows,
  onBranch,
}: {
  rows: NonNullable<
    MonitorSummaryPayload["alerts"]
  >["branchesNeedingAttention"];
  onBranch: (id: string) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-red-200/70 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20">
      <div className="flex items-center gap-2 border-b border-red-200/60 px-4 py-2.5 dark:border-red-900/40">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <h2 className="text-sm font-semibold text-red-900 dark:text-red-200">
          Branches needing attention
        </h2>
      </div>
      <ul className="divide-y divide-red-100 dark:divide-red-900/30">
        {rows.map((r) => (
          <li key={r.branchId}>
            <button
              type="button"
              onClick={() => onBranch(r.branchId)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-red-100/50 dark:hover:bg-red-950/40"
            >
              <span className="min-w-0 truncate font-medium text-gray-900 dark:text-gray-100">
                {r.name}
              </span>
              <span className="shrink-0 text-sm tabular-nums text-red-700 dark:text-red-400">
                {r.offlineCount} offline / {r.totalCameras}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Offline alert banner ────────────────────────────────────

function OfflineAlert({ branches }: { branches: MonitorBranchRow[] }) {
  const problematic = branches.filter((b) => b.status !== "online");
  if (problematic.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-700/40 dark:bg-amber-950/30">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="text-sm">
        <p className="font-semibold text-amber-900 dark:text-amber-300">
          {problematic.length} branch{problematic.length > 1 ? "es" : ""} with
          camera issues
        </p>
        <p className="mt-0.5 text-amber-700 dark:text-amber-400">
          {problematic.map((b) => b.name).join(", ")}
        </p>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────

export default function MonitorDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const { data, isLoading, isError, error } = useMonitorSummary({
    refetchInterval: 45_000,
  });

  useEffect(() => {
    if (data) setLastRefreshedAt(new Date());
  }, [data]);

  const totals = data?.totals ?? emptyTotals;
  const allBranches = data?.branches ?? [];

  const onSearchChange = useCallback((v: string) => setSearch(v), []);

  const headerConfig = useMemo(
    () => ({
      title: "Monitor",
      breadcrumbs: [{ label: "Monitor", icon: Cctv }],
      actions: [
        {
          type: "search" as const,
          placeholder: "Search branches…",
          value: search,
          onChange: onSearchChange,
        },
        {
          type: "button" as const,
          label: "",
          ariaLabel: "Monitor overview help",
          icon: Settings,
          variant: "outline" as const,
          onClick: () => setGuideOpen(true),
        },
      ],
    }),
    [search, onSearchChange],
  );

  useHeaderConfig(headerConfig);

  // last refreshed label
  const lastRefreshedLabel = lastRefreshedAt
    ? lastRefreshedAt.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  const filteredBranches = useMemo((): DashboardBranch[] => {
    const q = search.toLowerCase().trim();
    const base = allBranches.map((b, i) => {
      const g = BRANCH_GRADIENTS[i % BRANCH_GRADIENTS.length];
      return { ...b, gradientFrom: g.gradientFrom, gradientTo: g.gradientTo };
    });
    if (!q) return base;
    return base.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.city ?? "").toLowerCase().includes(q) ||
        (b.country ?? "").toLowerCase().includes(q),
    );
  }, [allBranches, search]);

  const loading = isLoading;

  if (isError) {
    return (
      <PageTransition className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center dark:border-red-900/40 dark:bg-red-950/30">
          <p className="text-sm text-red-800 dark:text-red-200">
            {error instanceof Error
              ? error.message
              : "Failed to load monitor data."}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Modal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Monitor setup guide"
        description="Fleet health dashboard, NVR connection steps, and branch shortcuts."
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-700/60 dark:bg-gray-900/40">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
              Dashboard overview
            </h3>
            <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                KPIs auto-refresh every 45 s &mdash; use the{" "}
                <strong>Refresh</strong> button (top-right) for immediate
                updates.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                Header search filters branches by name, city, or country.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                Branches with &ge;1 offline camera appear in the{" "}
                <strong>Needs attention</strong> table &mdash; click to jump
                directly to that branch.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                Open any branch card to view cameras, live feed, export CSV, and
                NVR settings.
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <h3 className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300">
              <Cctv className="h-3.5 w-3.5" />
              VIGI NVR setup (per branch)
            </h3>
            <ol className="space-y-2.5 text-sm text-blue-900 dark:text-blue-100">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  1
                </span>
                From this page, open a <strong>branch card</strong> (branch
                cameras view).
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  2
                </span>
                Use <strong>NVR settings</strong> or{" "}
                <strong>Configure NVR</strong> in the banner, or the header{" "}
                <strong>settings</strong> icon →{" "}
                <strong>Camera &amp; NVR settings</strong> modal.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  3
                </span>
                <div>
                  Enter the recorder&apos;s <strong>OpenAPI</strong> endpoint
                  (HTTPS, usually port <strong>20443</strong>). The{" "}
                  <strong>API server</strong> must reach this host (same LAN,
                  VPN, tunnel, or DDNS — not only your phone).
                  <div className="mt-2 rounded-lg bg-blue-100/80 px-3 py-2 font-mono text-[11px] dark:bg-blue-900/40">
                    Example: <strong>your-nvr.example.com:20443</strong> or LAN
                    IP if the API runs on that network
                    <br />
                    User: often <strong>admin</strong> · Password: NVR admin
                    password
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  4
                </span>
                <strong>Save integration</strong> →{" "}
                <strong>Test connection</strong> → <strong>Sync cameras</strong>
                .
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                  ✓
                </span>
                Cameras show a <strong>VIGI</strong> badge; optional TP-Link
                account &quot;Discover&quot; only helps fill host — it does not
                replace NVR host + password.
              </li>
            </ol>
          </div>

          {lastRefreshedLabel && (
            <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <Activity className="h-3.5 w-3.5" />
              Data last fetched at {lastRefreshedLabel} &mdash; auto-refreshes
              every 45 s.
            </p>
          )}
        </div>
      </Modal>

      <MonitorKPIs totals={totals} loading={loading} />

      <SystemHealthBar totals={totals} />

      <FleetInsightsPanel insights={data?.insights} loading={loading} />

      {data?.alerts?.branchesNeedingAttention && (
        <AttentionTable
          rows={data.alerts.branchesNeedingAttention}
          onBranch={(id) => navigate(`/monitor/${id}`)}
        />
      )}

      <OfflineAlert branches={allBranches} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Branches
            {filteredBranches.length !== allBranches.length
              ? ` (${filteredBranches.length} of ${allBranches.length})`
              : ` (${allBranches.length})`}
          </h2>
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-xs text-primary-600 hover:underline dark:text-primary-400"
            >
              Clear filter
            </button>
          )}
        </div>

        {filteredBranches.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-14 dark:border-gray-700">
            <Search className="mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500">
              {allBranches.length === 0
                ? "No branches or cameras yet. Run API seed or add cameras."
                : `No branches match "${search}"`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBranches.map((branch, i) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                index={i}
                onClick={() => navigate(`/monitor/${branch.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Last refreshed footer */}
      {lastRefreshedLabel && (
        <p className="flex items-center justify-end gap-1.5 text-[11px] text-gray-400 dark:text-gray-600">
          <Activity className="h-3 w-3" />
          Last refreshed {lastRefreshedLabel} &middot; auto every 45 s
        </p>
      )}
    </PageTransition>
  );
}

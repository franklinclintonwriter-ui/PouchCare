import {
  DollarSign,
  UserCheck,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/utils/cn";
import type { DashboardSummary, Trend } from "@/types/analytics";

interface KPIRowProps {
  data?: DashboardSummary;
  loading?: boolean;
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: Trend;
  trendLabel?: string;
  icon: React.ReactNode;
  iconBg: string;
  loading?: boolean;
  highlight?: boolean;
}

function TrendIndicator({ trend, label }: { trend: Trend; label?: string }) {
  const Icon =
    trend.direction === "up"
      ? TrendingUp
      : trend.direction === "down"
        ? TrendingDown
        : Minus;
  const colorClass =
    trend.direction === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend.direction === "down"
        ? "text-red-500 dark:text-red-400"
        : "text-gray-400";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        colorClass,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {trend.change > 0 && <span>{trend.change}%</span>}
      {label && (
        <span className="text-gray-400 dark:text-gray-500 ml-0.5 hidden lg:inline">
          {label}
        </span>
      )}
    </span>
  );
}

function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  iconBg,
  loading,
  highlight,
}: KPICardProps) {
  if (loading) {
    return (
      <Card padding="none">
        <CardContent className="!mt-0 p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      padding="none"
      className={cn(
        "h-full transition-all hover:shadow-lg hover:-translate-y-0.5",
        highlight && "ring-2 ring-primary-500/20 dark:ring-primary-400/20",
      )}
    >
      <CardContent className="!mt-0 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium leading-snug text-gray-500 dark:text-gray-400 sm:text-sm">
              {title}
            </p>
            <p className="mt-1.5 truncate text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100 sm:text-2xl xl:text-3xl">
              {value}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {trend && <TrendIndicator trend={trend} label={trendLabel} />}
              {subtitle && (
                <span
                  className={cn(
                    "text-xs",
                    trend
                      ? "text-gray-400 dark:text-gray-500"
                      : "text-gray-500 dark:text-gray-400",
                  )}
                >
                  {trend ? "\u00B7 " + subtitle : subtitle}
                </span>
              )}
            </div>
          </div>
          <div
            className={cn(
              "flex shrink-0 rounded-xl p-2.5 sm:p-3",
              iconBg,
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KPIRow({ data, loading = false }: KPIRowProps) {
  const { formatCurrency } = useCurrency();

  const kpis = data?.kpis;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {/* Revenue YTD */}
      <KPICard
        title="Revenue (YTD)"
        value={kpis ? formatCurrency(kpis.revenue.value) : "-"}
        trend={kpis?.revenue.trend}
        trendLabel="vs last year"
        icon={<DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />}
        iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
        loading={loading}
        highlight
      />

      {/* Net Profit */}
      <KPICard
        title="Net Profit"
        value={kpis ? formatCurrency(kpis.profit.value) : "-"}
        subtitle={
          kpis ? `${formatCurrency(kpis.profit.expenses)} expenses` : undefined
        }
        icon={<Target className="h-5 w-5 sm:h-6 sm:w-6" />}
        iconBg={
          kpis && kpis.profit.value >= 0
            ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25"
            : "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25"
        }
        loading={loading}
      />

      {/* Present Today */}
      <KPICard
        title="Present Today"
        value={kpis ? kpis.attendance.presentToday.toLocaleString() : "-"}
        trend={kpis?.attendance.trend}
        subtitle={kpis ? `${kpis.attendance.percentage}% rate` : undefined}
        icon={<UserCheck className="h-5 w-5 sm:h-6 sm:w-6" />}
        iconBg="bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25"
        loading={loading}
      />

      {/* Active Clients */}
      <KPICard
        title="Active Clients"
        value={kpis ? kpis.clients.active.toLocaleString() : "-"}
        trend={kpis?.clients.trend}
        subtitle={kpis ? `${kpis.clients.newThisMonth} new` : undefined}
        icon={<Globe className="h-5 w-5 sm:h-6 sm:w-6" />}
        iconBg="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25"
        loading={loading}
      />
    </div>
  );
}

interface TaskProgressProps {
  data?: DashboardSummary;
  loading?: boolean;
}

export function TaskProgressCard({ data, loading }: TaskProgressProps) {
  const tasks = data?.kpis?.tasks;

  if (loading) {
    return (
      <Card padding="none">
        <CardContent className="!mt-0 p-5">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-3 w-full rounded-full mb-4" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-6 w-8 mx-auto mb-1" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tasks) {
    return (
      <Card padding="none">
        <CardContent className="!mt-0 p-5 flex flex-col items-center justify-center min-h-[180px] text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Task Completion
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            No task metrics available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <CardContent className="!mt-0 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Task Completion
          </h4>
          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
            {tasks.completionRate}%
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${tasks.completionRate}%` }}
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {tasks.done}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Done</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {tasks.inProgress}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              In Progress
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {tasks.pending}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
              {tasks.total}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PipelineCard({ data, loading }: TaskProgressProps) {
  const pipeline = data?.kpis?.pipeline;

  if (loading) {
    return (
      <Card padding="none">
        <CardContent className="!mt-0 p-5">
          <Skeleton className="h-4 w-28 mb-4" />
          <Skeleton className="h-10 w-24 mb-2" />
          <Skeleton className="h-3 w-36" />
        </CardContent>
      </Card>
    );
  }

  if (!pipeline) {
    return (
      <Card padding="none">
        <CardContent className="!mt-0 p-5 flex flex-col items-center justify-center min-h-[180px] text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Pipeline Win Rate
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            No pipeline data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const winRateColor =
    pipeline.winRate >= 50
      ? "text-emerald-600 dark:text-emerald-400"
      : pipeline.winRate >= 25
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-500 dark:text-red-400";

  return (
    <Card padding="none">
      <CardContent className="!mt-0 p-5">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Pipeline Win Rate
        </h4>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-4xl font-bold", winRateColor)}>
            {pipeline.winRate}%
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            conversion
          </span>
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {pipeline.won} won
          </span>
          <span className="text-gray-400">of</span>
          <span className="text-gray-600 dark:text-gray-400 font-medium">
            {pipeline.total} leads
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

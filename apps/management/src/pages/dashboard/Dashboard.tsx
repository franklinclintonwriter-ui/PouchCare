import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Clock,
  Sparkles,
  CheckSquare,
  ClipboardList,
  FolderKanban,
  FileText,
  CalendarOff,
  Users,
  ArrowRight,
  MonitorPlay,
} from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import { usePermission } from "@/hooks/usePermission";
import { useDashboardSummary, useForecast } from "@/api/analytics";
import {
  KPIRow,
  TaskProgressCard,
  PipelineCard,
  RevenueChart,
  HealthBreakdown,
  getHealthStatusLabel,
  StaffLeaderboard,
  TopClients,
  ForecastChart,
  StaffOverview,
  TopReferrers,
  RecentActivities,
  QuickActions,
} from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuthStore } from "@/store/authStore";
import type { StaffUser } from "@/types/auth";
import { ROUTES } from "@/routes/config";
import { cn } from "@/utils/cn";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const liteLinks: {
  to: string;
  label: string;
  description: string;
  icon: typeof CheckSquare;
  when?: (p: ReturnType<typeof usePermission>) => boolean;
}[] = [
  {
    to: ROUTES.TASKS_MINE,
    label: "My tasks",
    description: "Tasks assigned to you",
    icon: CheckSquare,
  },
  {
    to: ROUTES.TASKS,
    label: "All tasks",
    description: "Team task board",
    icon: ClipboardList,
  },
  {
    to: ROUTES.PROJECTS,
    label: "Projects",
    description: "Active client work",
    icon: FolderKanban,
  },
  {
    to: ROUTES.ATTENDANCE_CHECK,
    label: "Check in / out",
    description: "Start or end your day",
    icon: Clock,
  },
  {
    to: ROUTES.ATTENDANCE,
    label: "My attendance",
    description: "Your history",
    icon: Clock,
  },
  {
    to: ROUTES.TEAM_ATTENDANCE,
    label: "Team attendance",
    description: "Branch or team board",
    icon: Users,
    when: (p) => p.isManager,
  },
  {
    to: ROUTES.REPORTS,
    label: "Daily reports",
    description: "Submit and review",
    icon: FileText,
  },
  {
    to: ROUTES.LEAVE,
    label: "Leave",
    description: "Requests and balance",
    icon: CalendarOff,
  },
  {
    to: ROUTES.MONITOR,
    label: "Monitor",
    description: "Cameras and sites",
    icon: MonitorPlay,
    when: (p) => p.can("monitor.view"),
  },
];

function DashboardHero({
  user,
  showHealth,
  healthPercent,
}: {
  user: StaffUser | null;
  showHealth: boolean;
  healthPercent?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white shadow-xl shadow-primary-900/25 ring-1 ring-white/5">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='1.2' fill='%23fff' fill-opacity='0.12'/%3E%3C/svg%3E")`,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/[0.07]" />

      <div className="relative z-10 flex flex-col gap-4 px-4 py-5 sm:gap-5 sm:px-6 sm:py-6 lg:flex-row lg:items-stretch lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-primary-100 backdrop-blur-sm sm:text-xs">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary-200 sm:h-4 sm:w-4" aria-hidden />
            <span className="truncate">{formatDate()}</span>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-balance text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
              {getGreeting()}, {user?.name?.split(" ")[0] || "there"}!
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-primary-100/90 sm:text-[15px]">
              {showHealth
                ? "Here's what's happening with your business today."
                : "Your workspace — jump into tasks, attendance, and reports. Company analytics are available to operations roles."}
            </p>
          </div>
        </div>

        {showHealth && healthPercent != null && (
          <div className="shrink-0 lg:flex lg:items-center">
            <div className="flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md sm:max-w-md sm:py-3.5 lg:max-w-[17rem] lg:self-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 sm:h-14 sm:w-14">
                <span className="text-lg font-bold tabular-nums sm:text-xl">
                  {Math.round(healthPercent)}%
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wider text-primary-200/90">
                  Health score
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold sm:text-base">
                  {getHealthStatusLabel(healthPercent)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const perm = usePermission();
  const canAnalytics = perm.can("analytics.access");
  const { data, isLoading, isError, error } = useDashboardSummary({
    enabled: canAnalytics,
  });
  const forecast = useForecast({ enabled: canAnalytics });
  const user = useAuthStore((s) => s.user) as StaffUser | null;

  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? "Failed to load dashboard data"
        : null;

  const headerConfig = useMemo(
    () => ({
      title: "Dashboard",
      breadcrumbs: [{ label: "Dashboard", icon: LayoutDashboard }],
      actions: [],
    }),
    [],
  );

  useHeaderConfig(headerConfig);

  const revenueChartData = useMemo(
    () =>
      data?.revenue?.data?.map((r) => ({
        id: `${r.year}-${r.monthNum}`,
        year: r.year,
        month: r.monthNum,
        totalRevenueUsd: r.revenue,
        totalExpensesUsd: r.expenses,
      })),
    [data?.revenue?.data],
  );

  const healthData = useMemo(
    () =>
      data
        ? {
            total: data.health.total,
            breakdown: data.health.breakdown,
            meta: {
              tasksDone: data.kpis.tasks.done,
              tasksTotal: data.kpis.tasks.total,
              presentToday: data.kpis.attendance.presentToday,
              staffTotal: data.kpis.attendance.staffTotal,
              activeClients: data.kpis.clients.active,
            },
          }
        : undefined,
    [data],
  );

  const staffData = useMemo(
    () =>
      data
        ? {
            total: data.kpis.staff.total,
            active: data.kpis.staff.active,
            onLeave: data.kpis.staff.onLeave,
            newThisMonth: data.kpis.staff.newThisMonth,
          }
        : undefined,
    [data],
  );

  const clientData = useMemo(
    () =>
      data
        ? {
            total: data.kpis.clients.total,
            active: data.kpis.clients.active,
            newThisMonth: data.kpis.clients.newThisMonth,
            topSpenders: data.leaderboards.clients,
          }
        : undefined,
    [data],
  );

  const leaderboardData = useMemo(
    () =>
      data
        ? {
            staff: data.leaderboards.staff,
            referrers: data.leaderboards.referrers,
          }
        : undefined,
    [data],
  );

  if (!canAnalytics) {
    const links = liteLinks.filter((l) => !l.when || l.when(perm));
    return (
      <div className="space-y-4">
        <DashboardHero user={user} showHealth={false} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
          <div className="space-y-4 lg:col-span-8">
            <Card>
              <CardHeader className="border-b border-gray-100 pb-3 dark:border-gray-800">
                <CardTitle className="text-base">Quick links</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 pt-4 sm:grid-cols-2">
                {links.map(({ to, label, description, icon: Icon }) => (
                  <Link
                    key={to + label}
                    to={to}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 transition-all",
                      "hover:border-primary-200 hover:shadow-sm dark:border-gray-700/80 dark:bg-gray-900/40 dark:hover:border-primary-800",
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-500 dark:text-gray-600" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3 lg:col-span-4 lg:self-start">
            <QuickActions />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardHero
        user={user}
        showHealth={!!data?.health}
        healthPercent={data?.health.total}
      />

      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
        >
          <p className="font-medium">Failed to load dashboard data</p>
          <p className="mt-1 text-red-900/90 dark:text-red-200/90">
            {errorMessage}. Please try refreshing the page.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
        <div className="space-y-4 lg:col-span-8">
          <KPIRow data={data} loading={isLoading} />

          <RevenueChart data={revenueChartData} loading={isLoading} />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <TaskProgressCard data={data} loading={isLoading} />
            <PipelineCard data={data} loading={isLoading} />
            <StaffOverview staff={staffData} loading={isLoading} />
          </div>

          <ForecastChart forecast={forecast.data} loading={forecast.isLoading} />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
            <StaffLeaderboard leaderboard={leaderboardData} loading={isLoading} />
            <TopClients clients={clientData} loading={isLoading} />
            <TopReferrers leaderboard={leaderboardData} loading={isLoading} />
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:col-span-4 lg:self-start">
          <QuickActions />

          <HealthBreakdown health={healthData} loading={isLoading} />

          <div>
            <RecentActivities data={data} loading={isLoading} />
          </div>
        </div>
      </div>

      {data && (
        <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-4 text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
          <Clock className="h-3 w-3" />
          <span>Last updated: {new Date(data.generatedAt).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}

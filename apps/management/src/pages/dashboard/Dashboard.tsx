import { useMemo } from 'react';
import { LayoutDashboard, Clock, Sparkles } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useDashboardSummary, useForecast } from '@/api/analytics';
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
} from '@/components/dashboard';
import { useAuthStore } from '@/store/authStore';
import type { StaffUser } from '@/types/auth';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Dashboard() {
  const { data, isLoading, isError, error } = useDashboardSummary();
  const forecast = useForecast();
  const user = useAuthStore((s) => s.user) as StaffUser | null;

  const errorMessage = isError && error instanceof Error ? error.message : isError ? 'Failed to load dashboard data' : null;

  const headerConfig = useMemo(
    () => ({
      title: 'Dashboard',
      breadcrumbs: [{ label: 'Dashboard', icon: LayoutDashboard }],
      actions: [],
    }),
    []
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
    [data?.revenue?.data]
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
    [data]
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
    [data]
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
    [data]
  );

  const leaderboardData = useMemo(
    () =>
      data
        ? {
            staff: data.leaderboards.staff,
            referrers: data.leaderboards.referrers,
          }
        : undefined,
    [data]
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-6 py-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEuNSIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary-200" />
              <span className="text-primary-200 text-sm font-medium">{formatDate()}</span>
            </div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="mt-1 text-primary-100 text-sm">
              Here's what's happening with your business today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data?.health && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-lg font-bold">{Math.round(data.health.total)}%</span>
                </div>
                <div>
                  <p className="text-xs text-primary-200">Health Score</p>
                  <p className="text-sm font-semibold">
                    {getHealthStatusLabel(data.health.total)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
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

      {/* Main Content Grid - Desktop optimized 2-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column - Main Content (8 cols on xl) */}
        <div className="xl:col-span-8 space-y-6">
          {/* KPI Cards */}
          <KPIRow data={data} loading={isLoading} />

          {/* Revenue Chart - Full width on left column */}
          <RevenueChart data={revenueChartData} loading={isLoading} />

          {/* Stats Row - Task Progress, Pipeline, Staff Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TaskProgressCard data={data} loading={isLoading} />
            <PipelineCard data={data} loading={isLoading} />
            <StaffOverview staff={staffData} loading={isLoading} />
          </div>

          {/* Forecast Chart */}
          <ForecastChart forecast={forecast.data} loading={forecast.isLoading} />

          {/* Leaderboards - 3 column grid on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StaffLeaderboard leaderboard={leaderboardData} loading={isLoading} />
            <TopClients clients={clientData} loading={isLoading} />
            <TopReferrers leaderboard={leaderboardData} loading={isLoading} />
          </div>
        </div>

        {/* Right Sidebar - (4 cols on xl) */}
        <div className="xl:col-span-4 space-y-6">
          {/* Quick Actions */}
          <QuickActions />

          {/* Health Breakdown */}
          <HealthBreakdown health={healthData} loading={isLoading} />

          {/* Recent Activities */}
          <RecentActivities data={data} loading={isLoading} />
        </div>
      </div>

      {/* Last Updated Indicator */}
      {data && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Clock className="h-3 w-3" />
          <span>Last updated: {new Date(data.generatedAt).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}

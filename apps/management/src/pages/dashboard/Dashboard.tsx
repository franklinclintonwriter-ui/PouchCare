import { useMemo } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useHealthScore, useRevenueAnalytics, useStaffStats, useClientStats, useLeaderboard, useForecast } from '@/api/analytics';
import {
  KPIRow,
  RevenueChart,
  HealthBreakdown,
  StaffLeaderboard,
  TopClients,
  ForecastChart,
  StaffOverview,
  TopReferrers,
} from '@/components/dashboard';

export default function Dashboard() {
  const health = useHealthScore();
  const revenue = useRevenueAnalytics();
  const staff = useStaffStats();
  const clients = useClientStats();
  const leaderboard = useLeaderboard();
  const forecast = useForecast();

  const isLoading = health.isLoading || revenue.isLoading || staff.isLoading || clients.isLoading;

  const failedQueries = [health, revenue, staff, clients, leaderboard, forecast].filter((q) => q.isError);
  const firstErrorMessage = failedQueries[0]?.error instanceof Error
    ? failedQueries[0].error.message
    : failedQueries.length ? 'One or more requests failed' : null;

  const headerConfig = useMemo(() => ({
    title: 'Dashboard',
    breadcrumbs: [{ label: 'Dashboard', icon: LayoutDashboard }],
    actions: [],
  }), []);

  useHeaderConfig(headerConfig);

  return (
    <div className="space-y-4 sm:space-y-6">
      {failedQueries.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
        >
          <p className="font-medium">Some dashboard data could not be loaded</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
            {firstErrorMessage}. Other sections below may still show partial information.
          </p>
        </div>
      )}

      {/* KPI Cards Row */}
      <KPIRow
        health={health.data}
        staff={staff.data}
        clients={clients.data}
        revenue={revenue.data}
        loading={isLoading}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={revenue.data?.data} loading={revenue.isLoading} />
        </div>
        <HealthBreakdown health={health.data} loading={health.isLoading} />
      </div>

      {/* Forecast + Staff Overview */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ForecastChart forecast={forecast.data} loading={forecast.isLoading} />
        </div>
        <StaffOverview staff={staff.data} loading={staff.isLoading} />
      </div>

      {/* Leaderboards Row */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StaffLeaderboard leaderboard={leaderboard.data} loading={leaderboard.isLoading} />
        <TopClients clients={clients.data} loading={clients.isLoading} />
        <TopReferrers leaderboard={leaderboard.data} loading={leaderboard.isLoading} />
      </div>
    </div>
  );
}

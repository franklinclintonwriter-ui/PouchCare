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

  const headerConfig = useMemo(() => ({
    title: 'Dashboard',
    breadcrumbs: [{ label: 'Dashboard', icon: LayoutDashboard }],
    actions: [],
  }), []);

  useHeaderConfig(headerConfig);

  return (
    <div className="space-y-4 sm:space-y-6">
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

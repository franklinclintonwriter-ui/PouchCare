import { Activity, DollarSign, Users, UserCheck, Globe } from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { formatCurrency, formatNumber } from '@/utils/format';
import type { HealthScore, StaffStats, ClientStats, RevenueData } from '@/types/analytics';

interface KPIRowProps {
  health?: HealthScore;
  staff?: StaffStats;
  clients?: ClientStats;
  revenue?: RevenueData;
  loading?: boolean;
}

export function KPIRow({ health, staff, clients, revenue, loading = false }: KPIRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
      <KPICard
        title="Health Score"
        value={health ? `${Math.round(health.total)}%` : '—'}
        icon={<Activity />}
        iconBg="bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
        loading={loading}
      />
      <KPICard
        title="Revenue (YTD)"
        value={revenue ? formatCurrency(revenue.summary.totalRevenue) : '—'}
        icon={<DollarSign />}
        iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        loading={loading}
      />
      <KPICard
        title="Net Profit"
        value={revenue ? formatCurrency(revenue.summary.netProfit) : '—'}
        icon={<DollarSign />}
        iconBg={revenue && revenue.summary.netProfit >= 0
          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}
        loading={loading}
      />
      <KPICard
        title="Staff"
        value={staff ? formatNumber(staff.total) : '—'}
        changeLabel={staff ? `${staff.active} active` : undefined}
        icon={<Users />}
        iconBg="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        loading={loading}
      />
      <KPICard
        title="Present Today"
        value={health ? formatNumber(health.meta.presentToday) : '—'}
        changeLabel={health ? `of ${health.meta.staffTotal}` : undefined}
        icon={<UserCheck />}
        iconBg="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        loading={loading}
      />
      <KPICard
        title="Active Clients"
        value={clients ? formatNumber(clients.active) : '—'}
        changeLabel={clients ? `${clients.newThisMonth} new` : undefined}
        icon={<Globe />}
        iconBg="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        loading={loading}
      />
    </div>
  );
}

import { useMemo } from 'react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useRevenue, useForecast } from '@/api/finance';
import { PageTransition } from '@/components/ui/PageTransition';
import { StatsRow } from '@/components/shared/StatsRow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/mocks/generators';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, Calendar, Zap } from 'lucide-react';

export default function Forecast() {
  const { data: months, isLoading: revenueLoading } = useRevenue();
  const { data: forecastResult, isLoading: forecastLoading } = useForecast();
  const isLoading = revenueLoading || forecastLoading;

  const revenueData = months ?? [];
  const apiForecast = forecastResult?.forecast ?? [];

  const chartData = useMemo(() => {
    const historical = revenueData.map(m => ({
      month: typeof m.month === 'number' ? `${m.month}` : m.month,
      actual: m.revenue as number | null,
      projected: null as number | null,
    }));

    const projections = apiForecast.map(f => ({
      month: `${f.month} ${String(f.year).slice(-2)}`,
      actual: null as number | null,
      projected: f.projectedRevenue,
    }));

    return [...historical, ...projections];
  }, [revenueData, apiForecast]);

  const stats = useMemo(() => {
    const totalActual = revenueData.reduce((s, m) => s + m.revenue, 0);
    const avgMonthly = revenueData.length > 0 ? Math.round(totalActual / revenueData.length) : 0;
    const projectedQ = apiForecast.reduce((s, f) => s + f.projectedRevenue, 0);

    // Calculate YoY growth: compare last 12 months vs previous 12 months
    const sorted = [...revenueData];
    const last12 = sorted.slice(-12).reduce((s, m) => s + m.revenue, 0);
    const prev12 = sorted.slice(-24, -12).reduce((s, m) => s + m.revenue, 0);
    const yoyGrowth = prev12 > 0 ? parseFloat(((last12 - prev12) / prev12 * 100).toFixed(1)) : 0;

    return { totalActual, avgMonthly, projectedQ, yoyGrowth };
  }, [revenueData, apiForecast]);

  useHeaderConfig({
    title: 'Forecast',
    breadcrumbs: [{ label: 'Finance' }, { label: 'Forecast' }],
  });

  return (
    <PageTransition className="space-y-6">
      <StatsRow
        loading={isLoading}
        items={[
          { title: 'YTD Revenue', value: formatCurrency(stats.totalActual), icon: <TrendingUp className="h-4 w-4" />, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { title: 'Avg Monthly', value: formatCurrency(stats.avgMonthly), icon: <Calendar className="h-4 w-4" />, iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
          { title: 'Projected (3mo)', value: formatCurrency(stats.projectedQ), icon: <Target className="h-4 w-4" />, iconBg: 'bg-purple-100 dark:bg-purple-900/30' },
          { title: 'YoY Growth', value: `${stats.yoyGrowth >= 0 ? '+' : ''}${stats.yoyGrowth}%`, icon: <Zap className="h-4 w-4" />, iconBg: 'bg-amber-100 dark:bg-amber-900/30' },
        ]}
      />

      <Card padding="none">
        <div className="p-4 sm:p-5">
          <CardHeader>
            <CardTitle>Revenue Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-gray-500" />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-gray-500" />
                  <Tooltip
                    formatter={(value: number, name: string) => [formatCurrency(value), name === 'actual' ? 'Actual' : 'Projected']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    name="Actual"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorActual)"
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    name="Projected"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    fill="url(#colorProjected)"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </div>
      </Card>
    </PageTransition>
  );
}

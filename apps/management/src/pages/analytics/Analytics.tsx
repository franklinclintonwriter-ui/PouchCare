import { useMemo } from 'react';
import { BarChart3, DollarSign, TrendingUp, Users, ShoppingCart } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useRevenue } from '@/api/finance';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatsRow } from '@/components/shared/StatsRow';
import { PageTransition } from '@/components/ui/PageTransition';
import { formatCurrency, formatCompact } from '@/mocks/generators';
import type { MonthlyRevenue } from '@/types/models';

export default function Analytics() {
  const { data: revenueData, isLoading } = useRevenue();
  const chartData = useMemo(() => {
    return (revenueData ?? []).map((r: any) => ({
      month: `${r.month}-${String(r.year).slice(-2)}`,
      revenue: r.totalRevenueUsd ?? r.revenue ?? 0,
      expenses: r.totalExpensesUsd ?? r.expenses ?? 0,
      profit: r.netProfitUsd ?? r.profit ?? ((r.totalRevenueUsd ?? 0) - (r.totalExpensesUsd ?? 0)),
    }));
  }, [revenueData]);

  const headerConfig = useMemo(() => ({
    title: 'Analytics',
    breadcrumbs: [{ label: 'Analytics', icon: BarChart3 }],
    actions: [],
  }), []);
  useHeaderConfig(headerConfig);

  const totals = useMemo(() => {
    const totalRevenue = chartData.reduce((s, r) => s + r.revenue, 0);
    const totalExpenses = chartData.reduce((s, r) => s + r.expenses, 0);
    const totalProfit = chartData.reduce((s, r) => s + r.profit, 0);
    return { totalRevenue, totalExpenses, totalProfit };
  }, [chartData]);

  const kpis = useMemo(() => {
    const months = chartData.length;
    const half = Math.floor(months / 2);
    const firstHalf = chartData.slice(0, half);
    const secondHalf = chartData.slice(half);

    const sumHalf = (arr: typeof chartData, key: 'revenue' | 'expenses' | 'profit') =>
      arr.reduce((s, r) => s + r[key], 0);

    const pct = (curr: number, prev: number): number | undefined =>
      prev === 0 ? undefined : parseFloat(((curr - prev) / prev * 100).toFixed(1));

    const revPrev = sumHalf(firstHalf, 'revenue');
    const revCurr = sumHalf(secondHalf, 'revenue');
    const expPrev = sumHalf(firstHalf, 'expenses');
    const expCurr = sumHalf(secondHalf, 'expenses');
    const profPrev = sumHalf(firstHalf, 'profit');
    const profCurr = sumHalf(secondHalf, 'profit');

    return [
      {
        title: 'Total Revenue',
        value: formatCurrency(totals.totalRevenue),
        change: pct(revCurr, revPrev),
        changeLabel: 'vs prior half',
        icon: <DollarSign />,
        iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      },
      {
        title: 'Total Expenses',
        value: formatCurrency(totals.totalExpenses),
        change: pct(expCurr, expPrev),
        changeLabel: 'vs prior half',
        icon: <TrendingUp />,
        iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      },
      {
        title: 'Net Profit',
        value: formatCurrency(totals.totalProfit),
        change: pct(profCurr, profPrev),
        changeLabel: 'vs prior half',
        icon: <ShoppingCart />,
        iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      },
      {
        title: 'Avg Monthly',
        value: formatCurrency(months > 0 ? Math.round(totals.totalRevenue / months) : 0),
        icon: <Users />,
        iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      },
    ];
  }, [totals, chartData]);

  const tableColumns: Column<MonthlyRevenue>[] = [
    {
      key: 'month',
      label: 'Month',
      render: (row) => <span className="font-semibold text-gray-900 dark:text-gray-100">{row.month}</span>,
    },
    {
      key: 'revenue',
      label: 'Revenue',
      align: 'right',
      render: (row) => <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(row.revenue)}</span>,
    },
    {
      key: 'expenses',
      label: 'Expenses',
      align: 'right',
      render: (row) => <span className="text-red-600 dark:text-red-400">{formatCurrency(row.expenses)}</span>,
    },
    {
      key: 'profit',
      label: 'Profit',
      align: 'right',
      render: (row) => (
        <span className={row.profit >= 0 ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'font-medium text-red-600 dark:text-red-400'}>
          {formatCurrency(row.profit)}
        </span>
      ),
    },
  ];

  return (
    <PageTransition className="space-y-4">
      <StatsRow items={kpis} loading={isLoading} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-gray-500" />
                  <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 12 }} className="text-gray-500" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-gray-500" />
                  <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 12 }} className="text-gray-500" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card padding="none">
        <DataTable
          columns={tableColumns}
          data={chartData}
          isLoading={isLoading}
          getRowId={(row) => row.month}
          compact
          emptyTitle="No revenue data"
        />
      </Card>
    </PageTransition>
  );
}

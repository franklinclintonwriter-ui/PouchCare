import { useMemo } from 'react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useRevenue } from '@/api/finance';
import { PageTransition } from '@/components/ui/PageTransition';
import { StatsRow } from '@/components/shared/StatsRow';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/mocks/generators';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import type { MonthlyRevenue } from '@/types/models';

export default function Revenue() {
  const { data: months, isLoading } = useRevenue();
  const revenueData = months ?? [];

  const stats = useMemo(() => {
    if (!revenueData.length) return { totalRev: 0, totalExp: 0, netProfit: 0, avgMargin: 0 };
    const totalRev = revenueData.reduce((s, m) => s + m.revenue, 0);
    const totalExp = revenueData.reduce((s, m) => s + m.expenses, 0);
    const netProfit = totalRev - totalExp;
    const avgMargin = totalRev > 0 ? Math.round((netProfit / totalRev) * 100) : 0;
    return { totalRev, totalExp, netProfit, avgMargin };
  }, [revenueData]);

  useHeaderConfig({
    title: 'Revenue',
    breadcrumbs: [{ label: 'Finance' }, { label: 'Revenue' }],
  });

  const columns: Column<MonthlyRevenue>[] = [
    { key: 'month', label: 'Month', render: (row) => (
      <span className="font-semibold text-gray-900 dark:text-gray-100">{row.month}</span>
    )},
    { key: 'revenue', label: 'Revenue', align: 'right', render: (row) => (
      <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(row.revenue)}</span>
    )},
    { key: 'expenses', label: 'Expenses', align: 'right', render: (row) => (
      <span className="font-medium text-red-500 dark:text-red-400">{formatCurrency(row.expenses)}</span>
    )},
    { key: 'profit', label: 'Profit', align: 'right', render: (row) => (
      <span className={`font-semibold ${row.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
        {formatCurrency(row.profit)}
      </span>
    )},
    { key: 'margin', label: 'Margin', align: 'right', render: (row) => {
      const margin = row.revenue > 0 ? Math.round((row.profit / row.revenue) * 100) : 0;
      return <span className="text-gray-600 dark:text-gray-400">{margin}%</span>;
    }},
  ];

  return (
    <PageTransition className="space-y-6">
      <StatsRow
        loading={isLoading}
        items={[
          { title: 'Total Revenue', value: formatCurrency(stats.totalRev), icon: <TrendingUp className="h-4 w-4" />, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { title: 'Total Expenses', value: formatCurrency(stats.totalExp), icon: <TrendingDown className="h-4 w-4" />, iconBg: 'bg-red-100 dark:bg-red-900/30' },
          { title: 'Net Profit', value: formatCurrency(stats.netProfit), icon: <DollarSign className="h-4 w-4" />, iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
          { title: 'Avg Margin', value: `${stats.avgMargin}%`, icon: <Percent className="h-4 w-4" />, iconBg: 'bg-purple-100 dark:bg-purple-900/30' },
        ]}
      />

      <Card padding="none">
        <div className="p-4 sm:p-5">
          <CardHeader>
            <CardTitle>Monthly Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-gray-500" />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-gray-500" />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </div>
      </Card>

      <DataTable<MonthlyRevenue>
        columns={columns}
        data={revenueData}
        isLoading={isLoading}
        getRowId={(row) => row.month}
      />
    </PageTransition>
  );
}

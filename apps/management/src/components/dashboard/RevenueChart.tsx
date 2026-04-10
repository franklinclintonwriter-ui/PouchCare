import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrency } from '@/hooks/useCurrency';
import type { MonthlyRevenue } from '@/types/analytics';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface RevenueChartProps {
  data?: MonthlyRevenue[];
  loading?: boolean;
}

export function RevenueChart({ data, loading = false }: RevenueChartProps) {
  const { formatCurrency, symbol, convert } = useCurrency();

  const chartData = data?.map((d) => ({
    name: MONTHS[d.month - 1],
    revenue: d.totalRevenueUsd,
    expenses: d.totalExpensesUsd ?? 0,
    profit: d.totalRevenueUsd - (d.totalExpensesUsd ?? 0),
  })) ?? [];

  // Calculate totals for the summary
  const totals = chartData.reduce(
    (acc, d) => ({
      revenue: acc.revenue + d.revenue,
      expenses: acc.expenses + d.expenses,
      profit: acc.profit + d.profit,
    }),
    { revenue: 0, expenses: 0, profit: 0 }
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            Revenue vs Expenses
          </CardTitle>
          {!loading && chartData.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-rose-500" />
                <span className="text-gray-600 dark:text-gray-400">Expenses</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Summary Stats */}
        {!loading && chartData.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(totals.revenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Expenses</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(totals.expenses)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Net Profit</p>
              <div className="flex items-center gap-1">
                {totals.profit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <p className={`text-lg font-bold ${totals.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {formatCurrency(Math.abs(totals.profit))}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <DollarSign className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No revenue data</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Revenue data will appear here when available
            </p>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="currentColor" 
                  className="text-gray-100 dark:text-gray-700" 
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-gray-500 dark:text-gray-400"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => {
                    const converted = convert(v) ?? v;
                    return `${symbol}${converted >= 1000 ? `${(converted / 1000).toFixed(0)}k` : converted}`;
                  }}
                  className="text-gray-500 dark:text-gray-400"
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: 'none',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                    fontSize: '0.875rem',
                    padding: '12px 16px',
                  }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'revenue' ? 'Revenue' : 'Expenses',
                  ]}
                />
                <Bar 
                  dataKey="revenue" 
                  name="Revenue" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={50}
                />
                <Bar 
                  dataKey="expenses" 
                  name="Expenses" 
                  fill="#f43f5e" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

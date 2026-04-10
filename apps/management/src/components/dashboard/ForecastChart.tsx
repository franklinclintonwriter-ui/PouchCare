import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrency } from '@/hooks/useCurrency';
import type { ForecastData } from '@/types/analytics';

interface ForecastChartProps {
  forecast?: ForecastData;
  loading?: boolean;
}

export function ForecastChart({ forecast, loading = false }: ForecastChartProps) {
  const { formatCurrency, symbol, convert } = useCurrency();

  const chartData = forecast?.forecast.map((f) => ({
    name: `${f.month} ${f.year}`,
    projected: f.projected,
    low: f.low,
    high: f.high,
    profit: f.profit,
  })) ?? [];

  // Calculate average projected
  const avgProjected = chartData.length > 0 
    ? chartData.reduce((sum, d) => sum + d.projected, 0) / chartData.length 
    : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Revenue Forecast
            </CardTitle>
            {forecast?.basis && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Based on {forecast.basis.months}-month average
                {forecast.basis.avgGrowth !== undefined && (
                  <span className="text-purple-600 dark:text-purple-400 font-medium ml-1">
                    ({forecast.basis.avgGrowth > 0 ? '+' : ''}{forecast.basis.avgGrowth}% growth)
                  </span>
                )}
              </p>
            )}
          </div>
          {!loading && chartData.length > 0 && (
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-purple-500" />
                <span className="text-gray-600 dark:text-gray-400">Projected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-purple-300 border-dashed" style={{ borderBottom: '2px dashed' }} />
                <span className="text-gray-600 dark:text-gray-400">Range</span>
              </div>
            </div>
          )}
        </div>

        {/* Forecast Summary */}
        {!loading && chartData.length > 0 && forecast?.basis && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Projected</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(avgProjected)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Historical Avg.</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(forecast.basis.avgRevenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Expenses</p>
              <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
                {formatCurrency(forecast.basis.avgExpenses ?? 0)}
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <Skeleton className="h-[280px] w-full rounded-lg" />
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[280px] text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <TrendingUp className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Not enough data</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Need at least 3 months of revenue data for forecasting
            </p>
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: 'none',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                    fontSize: '0.875rem',
                    padding: '12px 16px',
                  }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'projected' ? 'Projected' : name === 'low' ? 'Conservative' : 'Optimistic',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="high"
                  stroke="#a78bfa"
                  strokeDasharray="4 4"
                  fill="url(#rangeGrad)"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="projected"
                  stroke="#8b5cf6"
                  fill="url(#forecastGrad)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="low"
                  stroke="#a78bfa"
                  strokeDasharray="4 4"
                  fill="transparent"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

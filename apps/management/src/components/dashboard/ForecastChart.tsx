import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
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
  })) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Forecast</CardTitle>
        {forecast?.basis && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Based on {forecast.basis.months}-month avg: {formatCurrency(forecast.basis.avgRevenue)}/mo
          </span>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[240px] w-full rounded-lg" />
        ) : chartData.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            Not enough data for forecast
          </div>
        ) : (
          <div className="h-[180px] sm:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-700" />
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
                  contentStyle={{
                    borderRadius: '0.5rem',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '0.875rem',
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
                  fill="transparent"
                  strokeWidth={1}
                />
                <Area
                  type="monotone"
                  dataKey="projected"
                  stroke="#8b5cf6"
                  fill="url(#forecastGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="low"
                  stroke="#a78bfa"
                  strokeDasharray="4 4"
                  fill="transparent"
                  strokeWidth={1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

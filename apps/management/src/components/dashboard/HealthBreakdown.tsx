import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { HealthScore } from '@/types/analytics';

interface HealthBreakdownProps {
  health?: HealthScore;
  loading?: boolean;
}

const items = [
  { key: 'tasks' as const, label: 'Tasks Completion', color: 'primary' as const },
  { key: 'attendance' as const, label: 'Attendance Rate', color: 'success' as const },
  { key: 'pipeline' as const, label: 'Sales Pipeline', color: 'warning' as const },
  { key: 'clients' as const, label: 'Client Health', color: 'primary' as const },
];

export function HealthBreakdown({ health, loading = false }: HealthBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Breakdown</CardTitle>
        {health && (
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(health.total)}
            <span className="text-sm font-normal text-gray-400 ml-0.5">/100</span>
          </span>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((item) => {
              const value = health?.breakdown[item.key] ?? 0;
              return (
                <div key={item.key}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {Math.round(value)}%
                    </span>
                  </div>
                  <ProgressBar value={value} color={item.color} size="md" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

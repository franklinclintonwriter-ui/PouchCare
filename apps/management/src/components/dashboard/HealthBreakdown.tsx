import { CheckCircle, Users, Target, Heart, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';
import type { HealthScore } from '@/types/analytics';

interface HealthBreakdownProps {
  health?: HealthScore;
  loading?: boolean;
}

const items = [
  { 
    key: 'tasks' as const, 
    label: 'Tasks Completion', 
    color: 'primary' as const,
    icon: CheckCircle,
    iconColor: 'text-primary-500',
  },
  { 
    key: 'attendance' as const, 
    label: 'Attendance Rate', 
    color: 'success' as const,
    icon: Users,
    iconColor: 'text-emerald-500',
  },
  { 
    key: 'pipeline' as const, 
    label: 'Sales Pipeline', 
    color: 'warning' as const,
    icon: Target,
    iconColor: 'text-amber-500',
  },
  { 
    key: 'clients' as const, 
    label: 'Client Health', 
    color: 'primary' as const,
    icon: Heart,
    iconColor: 'text-pink-500',
  },
];

/** Shared with Dashboard welcome banner so labels match Health Breakdown card */
export function getHealthStatusLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Attention';
}

function getHealthStatus(score: number): { label: string; color: string } {
  const label = getHealthStatusLabel(score);
  if (score >= 80) return { label, color: 'text-emerald-600 dark:text-emerald-400' };
  if (score >= 60) return { label, color: 'text-blue-600 dark:text-blue-400' };
  if (score >= 40) return { label, color: 'text-amber-600 dark:text-amber-400' };
  return { label, color: 'text-red-500 dark:text-red-400' };
}

export function HealthBreakdown({ health, loading = false }: HealthBreakdownProps) {
  const status = health ? getHealthStatus(health.total) : null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary-500" />
            Health Breakdown
          </CardTitle>
        </div>
        {health && (
          <div className="mt-4 flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-gray-100 dark:text-gray-700"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(health.total / 100) * 226.2} 226.2`}
                  className="text-primary-500 transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(health.total)}
                </span>
              </div>
            </div>
            <div>
              <p className={cn('text-lg font-semibold', status?.color)}>
                {status?.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Overall company health
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const value = health?.breakdown[item.key] ?? 0;
              const Icon = item.icon;
              return (
                <div key={item.key}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-4 w-4', item.iconColor)} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </span>
                    </div>
                    <span className={cn(
                      'text-sm font-bold',
                      value >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                      value >= 40 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-500 dark:text-red-400'
                    )}>
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

import { Users, UserCheck, UserX, Briefcase } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import type { StaffStats } from '@/types/analytics';

interface StaffOverviewProps {
  staff?: StaffStats;
  loading?: boolean;
}

export function StaffOverview({ staff, loading = false }: StaffOverviewProps) {
  const stats = [
    { label: 'Total Staff', value: staff?.total ?? 0, icon: Users, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Active', value: staff?.active ?? 0, icon: UserCheck, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' },
    { label: 'On Leave', value: staff?.onLeave ?? 0, icon: Briefcase, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' },
    { label: 'Inactive', value: Math.max(0, (staff?.total ?? 0) - (staff?.active ?? 0) - (staff?.onLeave ?? 0)), icon: UserX, color: 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col items-center rounded-lg border border-gray-100 p-3 dark:border-gray-700/50">
                  <div className={`rounded-lg p-2 ${stat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

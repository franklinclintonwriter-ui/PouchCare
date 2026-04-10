import { Users, UserCheck, UserX, Briefcase, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';
import type { StaffStats } from '@/types/analytics';

interface StaffOverviewProps {
  staff?: StaffStats;
  loading?: boolean;
}

export function StaffOverview({ staff, loading = false }: StaffOverviewProps) {
  const inactive = Math.max(0, (staff?.total ?? 0) - (staff?.active ?? 0) - (staff?.onLeave ?? 0));
  
  const stats = [
    { 
      label: 'Total', 
      value: staff?.total ?? 0, 
      icon: Users, 
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
    },
    { 
      label: 'Active', 
      value: staff?.active ?? 0, 
      icon: UserCheck, 
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white',
    },
    { 
      label: 'On Leave', 
      value: staff?.onLeave ?? 0, 
      icon: Briefcase, 
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white',
    },
    { 
      label: 'Inactive', 
      value: inactive, 
      icon: UserX, 
      color: 'text-gray-500 dark:text-gray-400',
      bgColor: 'bg-gradient-to-br from-gray-400 to-gray-500 text-white',
    },
  ];

  const activePercentage = staff?.total ? Math.round((staff.active / staff.total) * 100) : 0;

  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Team Overview
          </h4>
          {staff?.newThisMonth !== undefined && staff.newThisMonth > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full animate-pulse">
              <UserPlus className="h-3 w-3" />
              +{staff.newThisMonth} new
            </span>
          )}
        </div>
        
        {/* Active Progress Bar */}
        {!loading && staff?.total && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-500 dark:text-gray-400">Active Rate</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{activePercentage}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${activePercentage}%` }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div>
                  <Skeleton className="h-5 w-8 mb-1" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={stat.label} 
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-colors group"
                >
                  <div className={cn('p-2 rounded-lg shadow-sm transition-transform group-hover:scale-105', stat.bgColor)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useMemo } from 'react';
import {
  CheckCircle,
  Clock,
  Target,
  ShoppingCart,
  UserCheck,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';
import type { Activity as ActivityType, DashboardSummary } from '@/types/analytics';

interface RecentActivitiesProps {
  data?: DashboardSummary;
  loading?: boolean;
}

function getActivityIcon(type: ActivityType['type'], status: string) {
  switch (type) {
    case 'task':
      return status === 'DONE' || status === 'VERIFIED' ? (
        <CheckCircle className="h-4 w-4 text-emerald-500" />
      ) : status === 'IN_PROGRESS' ? (
        <Clock className="h-4 w-4 text-blue-500" />
      ) : (
        <AlertCircle className="h-4 w-4 text-amber-500" />
      );
    case 'attendance':
      return <UserCheck className="h-4 w-4 text-primary-500" />;
    case 'lead':
      return status === 'WON' ? (
        <TrendingUp className="h-4 w-4 text-emerald-500" />
      ) : (
        <Target className="h-4 w-4 text-purple-500" />
      );
    case 'order':
      return <ShoppingCart className="h-4 w-4 text-blue-500" />;
    default:
      return <Briefcase className="h-4 w-4 text-gray-500" />;
  }
}

function getStatusVariant(type: ActivityType['type'], status: string): 'success' | 'warning' | 'info' | 'default' {
  if (type === 'task') {
    if (status === 'DONE' || status === 'VERIFIED') return 'success';
    if (status === 'IN_PROGRESS') return 'info';
    return 'warning';
  }
  if (type === 'lead') {
    if (status === 'WON') return 'success';
    if (status === 'NEGOTIATION' || status === 'PROPOSAL') return 'info';
    return 'default';
  }
  if (type === 'attendance') {
    if (status === 'PRESENT') return 'success';
    if (status === 'LATE') return 'warning';
    return 'default';
  }
  if (type === 'order') {
    if (status === 'COMPLETED' || status === 'DELIVERED') return 'success';
    if (status === 'PROCESSING') return 'info';
    return 'default';
  }
  return 'default';
}

function formatTimeAgo(time: string): string {
  const now = new Date();
  const then = new Date(time);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

function getTypeLabel(type: ActivityType['type']): string {
  switch (type) {
    case 'task': return 'Task';
    case 'attendance': return 'Attendance';
    case 'lead': return 'Lead';
    case 'order': return 'Order';
    default: return 'Activity';
  }
}

function getActivityBg(type: ActivityType['type']): string {
  switch (type) {
    case 'task': return 'bg-purple-50 dark:bg-purple-900/20';
    case 'attendance': return 'bg-primary-50 dark:bg-primary-900/20';
    case 'lead': return 'bg-emerald-50 dark:bg-emerald-900/20';
    case 'order': return 'bg-blue-50 dark:bg-blue-900/20';
    default: return 'bg-gray-100 dark:bg-gray-800';
  }
}

function ActivityItem({ activity }: { activity: ActivityType }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 -mx-2 px-2 rounded-xl transition-all cursor-default">
      <div className={cn(
        'mt-0.5 p-2 rounded-xl transition-all group-hover:scale-105',
        getActivityBg(activity.type)
      )}>
        {getActivityIcon(activity.type, activity.status)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
            {activity.title}
          </p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
            {formatTimeAgo(activity.time)}
          </span>
        </div>
        {activity.subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {activity.subtitle}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
            {getTypeLabel(activity.type)}
          </span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <Badge variant={getStatusVariant(activity.type, activity.status)} size="sm">
            {activity.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-gray-100 dark:border-gray-800">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <div className="flex-1">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-1/2 mb-2" />
        <div className="flex gap-2 items-center">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function RecentActivities({ data, loading }: RecentActivitiesProps) {
  const activities = useMemo(() => {
    if (!data?.activities) return [];

    const all = [
      ...(data.activities.tasks || []),
      ...(data.activities.attendance || []),
      ...(data.activities.leads || []),
    ];

    return all
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
  }, [data?.activities]);

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary-500" />
            Recent Activity
          </CardTitle>
          {activities.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {activities.length} items
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-3 flex-1 overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <ActivitySkeleton key={i} />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Briefcase className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No recent activity</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Activities will appear here as they happen
            </p>
          </div>
        ) : (
          <div className="space-y-0 overflow-y-auto max-h-[420px] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent pr-1">
            {activities.map((activity) => (
              <ActivityItem key={`${activity.type}-${activity.id}`} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { cn } from '@/utils/cn';
import { CheckCircle2, MessageSquare, AlertCircle, Clock, ArrowRight, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface TimelineEvent {
  id: string;
  type: 'created' | 'status_change' | 'comment' | 'alert' | 'completed' | 'assignment';
  title: string;
  description?: string;
  timestamp: string;
  actorName?: string;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
}

const typeConfig: Record<TimelineEvent['type'], { icon: typeof Clock; color: string }> = {
  created: { icon: Star, color: 'text-primary-500 bg-primary-50 dark:bg-primary-900/30' },
  status_change: { icon: ArrowRight, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
  comment: { icon: MessageSquare, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
  alert: { icon: AlertCircle, color: 'text-red-500 bg-red-50 dark:bg-red-900/30' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
  assignment: { icon: Clock, color: 'text-gray-500 bg-gray-50 dark:bg-gray-800' },
};

function ActivityTimeline({ events, loading = false }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100 dark:bg-gray-700/60" />
      <div className="space-y-4">
        {events.map((event) => {
          const config = typeConfig[event.type];
          const Icon = config.icon;
          return (
            <div key={event.id} className="relative flex gap-3 pl-0">
              <div className={cn('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', config.color)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm text-gray-900 dark:text-gray-100">{event.title}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-400 dark:text-gray-500">
                  {event.actorName && <span>{event.actorName}</span>}
                  <span>{new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ActivityTimeline, type TimelineEvent };

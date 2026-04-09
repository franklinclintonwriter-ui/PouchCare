import { BarChart3, CheckCircle2, ListTodo, Star, Target, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { StaffProfileDetail } from '@/types/models';

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Star;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700/50">
          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{value}</p>
          {hint ? <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p> : null}
        </div>
      </div>
    </Card>
  );
}

export function StaffProfileStats({ member }: { member: StaffProfileDetail }) {
  const fmt = (n: number | null | undefined, d = 1) =>
    n != null && !Number.isNaN(n) ? n.toFixed(d) : '—';

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Stat icon={ListTodo} label="Tasks assigned" value={String(member.tasksAssigned ?? 0)} />
      <Stat icon={CheckCircle2} label="Tasks completed" value={String(member.tasksCompleted ?? 0)} />
      <Stat icon={Star} label="Avg task rating" value={fmt(member.averageTaskRating)} hint="From peer reviews" />
      <Stat icon={Trophy} label="CEO performance" value={fmt(member.ceoPerformanceRating)} hint="1–10 scale" />
      <Stat icon={BarChart3} label="Performance score" value={fmt(member.performanceScore)} />
      <Stat icon={Target} label="Tasks rated" value={String(member.totalTasksRated ?? 0)} />
    </div>
  );
}

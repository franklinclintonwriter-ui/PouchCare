import {
  BarChart3,
  CheckCircle2,
  ListTodo,
  Star,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import type { StaffProfileDetail } from '@/types/models';

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  color = 'bg-gray-50 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300',
}: {
  icon: typeof Star;
  label: string;
  value: string;
  hint?: string;
  color?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={cn('rounded-xl p-2.5', color)}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{value}</p>
          {hint ? <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{hint}</p> : null}
        </div>
      </div>
    </Card>
  );
}

function ProgressRing({ value, max = 10, size = 48 }: { value: number; max?: number; size?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-rose-500';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={5} className="stroke-gray-200 dark:stroke-gray-700" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={5} strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} className={cn('transition-all duration-500', color)} style={{ stroke: 'currentColor' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900 dark:text-gray-100">
        {value.toFixed(1)}
      </div>
    </div>
  );
}

export function StaffProfileStats({ member }: { member: StaffProfileDetail }) {
  const fmt = (n: number | null | undefined, d = 1) =>
    n != null && !Number.isNaN(n) ? n.toFixed(d) : '—';

  const completionRate = member.tasksAssigned && member.tasksAssigned > 0
    ? Math.round(((member.tasksCompleted ?? 0) / member.tasksAssigned) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Primary KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={ListTodo}
          label="Tasks assigned"
          value={String(member.tasksAssigned ?? 0)}
          color="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <Stat
          icon={CheckCircle2}
          label="Completed"
          value={String(member.tasksCompleted ?? 0)}
          hint={`${completionRate}% completion rate`}
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <Stat
          icon={Star}
          label="Avg task rating"
          value={fmt(member.averageTaskRating)}
          hint={`From ${member.totalTasksRated ?? 0} rated tasks`}
          color="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <Stat
          icon={BarChart3}
          label="Performance"
          value={fmt(member.performanceScore)}
          color="bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
        />
      </div>

      {/* CEO rating + progress rings */}
      {(member.ceoPerformanceRating != null || member.averageTaskRating != null) && (
        <Card className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Performance overview</h3>
          <div className="mt-4 flex flex-wrap items-center gap-8">
            {member.ceoPerformanceRating != null && (
              <div className="flex flex-col items-center gap-2">
                <ProgressRing value={member.ceoPerformanceRating} max={10} size={64} />
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100">CEO rating</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">out of 10</p>
                </div>
              </div>
            )}
            {member.averageTaskRating != null && (
              <div className="flex flex-col items-center gap-2">
                <ProgressRing value={member.averageTaskRating} max={5} size={64} />
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Task quality</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">out of 5</p>
                </div>
              </div>
            )}
            {member.performanceScore != null && (
              <div className="flex flex-col items-center gap-2">
                <ProgressRing value={member.performanceScore} max={10} size={64} />
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Overall score</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">composite</p>
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 dark:text-gray-400">Completion rate</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{completionRate}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={cn('h-full rounded-full transition-all', completionRate >= 80 ? 'bg-emerald-500' : completionRate >= 50 ? 'bg-amber-500' : 'bg-rose-500')}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
              {member.ceoRatingNote && (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-400">
                  <span className="font-medium text-gray-800 dark:text-gray-200">CEO note:</span> {member.ceoRatingNote}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

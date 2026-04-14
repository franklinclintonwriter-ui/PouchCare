import { Trophy, Star, Medal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';
import type { Leaderboard } from '@/types/analytics';

interface StaffLeaderboardProps {
  leaderboard?: Leaderboard;
  loading?: boolean;
}

const RANK_STYLES = [
  { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', icon: '🥇' },
  { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400', icon: '🥈' },
  { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', icon: '🥉' },
];

export function StaffLeaderboard({ leaderboard, loading = false }: StaffLeaderboardProps) {
  const staff = leaderboard?.staff ?? [];

  return (
    <Card padding="none">
      <CardHeader className="border-b border-gray-100 px-4 pb-3 pt-4 dark:border-gray-800 sm:px-5 sm:pt-5">
        <CardTitle className="flex min-w-0 items-center gap-2 text-base font-semibold leading-snug sm:text-[17px]">
          <Trophy className="h-[18px] w-[18px] shrink-0 text-amber-500 sm:h-5 sm:w-5" aria-hidden />
          <span className="truncate">Top Performers</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="!mt-0 px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-10" />
              </div>
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
              <Medal className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No data yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Performance ratings will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            {staff.slice(0, 5).map((member, index) => {
              const rankStyle = RANK_STYLES[index] ?? null;
              return (
                <div 
                  key={member.id} 
                  className={cn(
                    'flex min-w-0 items-center gap-2 rounded-xl p-2 transition-colors sm:gap-3 sm:p-2.5',
                    index < 3 ? 'bg-gray-50 dark:bg-gray-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                  )}
                >
                  <span className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    rankStyle ? rankStyle.bg : 'bg-gray-100 dark:bg-gray-700',
                    rankStyle?.text ?? 'text-gray-500 dark:text-gray-400'
                  )}>
                    {index < 3 ? rankStyle?.icon : index + 1}
                  </span>
                  <Avatar name={member.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {member.name}
                    </p>
                    <p className="truncate text-[11px] text-gray-500 dark:text-gray-400 sm:text-xs">
                      {member.branch ?? 'N/A'} · {member.tasksCompleted} tasks
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-1.5 py-1 dark:bg-amber-900/20 sm:px-2">
                    <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
                    <span className="text-xs font-bold tabular-nums text-amber-600 dark:text-amber-400 sm:text-sm">
                      {member.averageTaskRating?.toFixed(1) ?? '—'}
                    </span>
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

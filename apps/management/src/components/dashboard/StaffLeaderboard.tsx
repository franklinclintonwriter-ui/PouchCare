import { Trophy, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonRow } from '@/components/ui/Skeleton';
import type { Leaderboard } from '@/types/analytics';

interface StaffLeaderboardProps {
  leaderboard?: Leaderboard;
  loading?: boolean;
}

export function StaffLeaderboard({ leaderboard, loading = false }: StaffLeaderboardProps) {
  const staff = leaderboard?.staff ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Top Performers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No performance data yet</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {staff.slice(0, 5).map((member, index) => (
              <div key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-gray-500 dark:text-gray-400">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                </span>
                <Avatar name={member.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {member.name}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {member.branch} &middot; {member.tasksCompleted} tasks
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {member.averageTaskRating.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

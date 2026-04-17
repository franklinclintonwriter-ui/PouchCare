import { Share2, Users, Gift } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/utils/cn';
import type { Leaderboard } from '@/types/analytics';

interface TopReferrersProps {
  leaderboard?: Leaderboard;
  loading?: boolean;
}

export function TopReferrers({ leaderboard, loading = false }: TopReferrersProps) {
  const { formatCurrency } = useCurrency();
  const referrers = leaderboard?.referrers ?? [];

  return (
    <Card padding="none">
      <CardHeader className="border-b border-gray-100 px-4 pb-3 pt-4 dark:border-gray-800 sm:px-5 sm:pt-5">
        <CardTitle className="flex min-w-0 items-center gap-2 text-base font-semibold leading-snug sm:text-[17px]">
          <Share2 className="h-[18px] w-[18px] shrink-0 text-indigo-500 sm:h-5 sm:w-5" aria-hidden />
          <span className="truncate">Top Referrers</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="!mt-0 px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : referrers.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
              <Gift className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No referrers yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Top referrers will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            {referrers.slice(0, 5).map((ref, index) => (
              <div 
                key={ref.id} 
                className={cn(
                  'flex min-w-0 items-center gap-2 rounded-xl p-2 transition-colors sm:gap-3 sm:p-2.5',
                  index === 0 ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                )}
              >
                <Avatar name={ref.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {ref.fullName}
                  </p>
                  <p className="flex min-w-0 items-center gap-1 truncate text-[11px] text-gray-500 dark:text-gray-400 sm:text-xs">
                    <span className="shrink-0">{ref.country ?? 'Unknown'}</span>
                    <span className="shrink-0">·</span>
                    <Users className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                    <span className="min-w-0 truncate">{ref.totalReferrals} referrals</span>
                  </p>
                </div>
                <span className={cn(
                  'shrink-0 rounded-lg px-2 py-1 text-xs font-bold tabular-nums sm:text-sm',
                  index === 0 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                    : 'text-emerald-600 dark:text-emerald-400'
                )}>
                  {formatCurrency(ref.totalCommissionEarned)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

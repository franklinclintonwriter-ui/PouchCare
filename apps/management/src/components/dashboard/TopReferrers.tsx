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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Share2 className="h-4 w-4 text-indigo-500" />
          Top Referrers
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
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
          <div className="space-y-2">
            {referrers.slice(0, 5).map((ref, index) => (
              <div 
                key={ref.id} 
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl transition-colors',
                  index === 0 ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                )}
              >
                <Avatar name={ref.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {ref.fullName}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span>{ref.country ?? 'Unknown'}</span>
                    <span>·</span>
                    <Users className="h-3 w-3" />
                    <span>{ref.totalReferrals} referrals</span>
                  </p>
                </div>
                <span className={cn(
                  'shrink-0 text-sm font-bold px-2 py-1 rounded-lg',
                  index === 0 
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30' 
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

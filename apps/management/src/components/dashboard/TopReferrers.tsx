import { Share2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/format';
import type { Leaderboard } from '@/types/analytics';

interface TopReferrersProps {
  leaderboard?: Leaderboard;
  loading?: boolean;
}

export function TopReferrers({ leaderboard, loading = false }: TopReferrersProps) {
  const referrers = leaderboard?.referrers ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-indigo-500" />
          Top Referrers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : referrers.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No referral data yet</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {referrers.slice(0, 5).map((ref) => (
              <div key={ref.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar name={ref.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {ref.fullName}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {ref.country ?? 'Unknown'} &middot; {ref.totalReferrals} referrals
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
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

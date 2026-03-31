import { useMemo } from 'react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePerformanceReviews } from '@/api/performance';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { PerformanceReview } from '@/types/models';

export default function Performance() {
  const { data: reviews, isLoading } = usePerformanceReviews();
  const reviewData: PerformanceReview[] = Array.isArray(reviews)
    ? reviews
    : (() => {
        const maybe = reviews as unknown as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as PerformanceReview[]) : [];
      })();

  // Aggregate radar data across all reviews
  const radarData = useMemo(() => {
    if (!reviewData.length) return [];
    const avg = (key: keyof PerformanceReview['scores']) =>
      Math.round(reviewData.reduce((s, r) => s + (r?.scores?.[key] ?? 0), 0) / reviewData.length);
    return [
      { metric: 'Tasks', score: avg('tasks') },
      { metric: 'Attendance', score: avg('attendance') },
      { metric: 'Quality', score: avg('quality') },
      { metric: 'Initiative', score: avg('initiative') },
    ];
  }, [reviewData]);

  useHeaderConfig({
    title: 'Performance',
    breadcrumbs: [{ label: 'HR' }, { label: 'Performance' }],
  });

  return (
    <PageTransition className="space-y-6">
      {/* Radar chart overview */}
      <Card padding="none">
        <div className="p-4 sm:p-5">
          <CardHeader>
            <CardTitle>Team Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-72">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Skeleton className="h-48 w-48 rounded-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid className="stroke-gray-200 dark:stroke-gray-700" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} className="text-gray-600 dark:text-gray-400" />
                    <Radar
                      name="Average Score"
                      dataKey="score"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Performance cards grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                  <Skeleton className="h-8 w-12 rounded" />
                </div>
              </Card>
            ))
          : reviewData.map((review) => (
              <PerformanceCard key={review.id} review={review} />
            ))}
      </div>
    </PageTransition>
  );
}

function PerformanceCard({ review }: { review: PerformanceReview }) {
  const isPositive = review.trend >= 0;
  const scoreEntries = review?.scores ? Object.entries(review.scores) : [];

  return (
    <Card hover>
      <div className="flex items-center gap-3">
        <Avatar name={review.staffName} src={review.avatarUrl} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{review.staffName}</p>
          <Badge variant="default" size="sm">{review.period}</Badge>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{review.overallScore}</p>
          <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{isPositive ? '+' : ''}{review.trend}%</span>
          </div>
        </div>
      </div>

      {/* Score bars */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {scoreEntries.map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 w-14 truncate">{key}</span>
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${val}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 w-6 text-right">{val}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

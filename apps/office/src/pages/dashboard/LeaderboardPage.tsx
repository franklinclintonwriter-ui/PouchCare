import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/Skeleton'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

export default function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/staff/leaderboard').then(r => r.data.data).catch(() => []),
  })

  const medals = ['🥇', '🥈', '🥉']

  usePageHeader('🏆 Branch Leaderboard', 'Top performers this month')

  return (
    <div>

      {isLoading
        ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        : (
          <div className="space-y-2">
            {(data || []).map((s: any, i: number) => (
              <div key={s.id}
                className={`bg-midnight-card border rounded-xl p-4 flex items-center gap-4 transition-all ${i === 0 ? 'border-yellow-500/40 shadow-sm shadow-yellow-500/10' : 'border-midnight-border'}`}>
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                  {i < 3
                    ? <span className="text-2xl">{medals[i]}</span>
                    : <span className="text-lg font-mono font-bold text-text-muted">#{i + 1}</span>
                  }
                </div>
                <div className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-500/30 flex-shrink-0 flex items-center justify-center text-sky-400 font-bold text-sm">
                  {s.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary truncate">{s.name}</p>
                  <p className="text-xs text-text-muted">{s.branch || 'Remote'} · {s.tasksCompleted} tasks done</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono font-bold text-xl text-sky-400">{s.averageTaskRating ?? '—'}</p>
                  <p className="text-[10px] text-text-muted">/ 10 rating</p>
                </div>
              </div>
            ))}
            {(data || []).length === 0 && (
              <div className="text-center py-16 text-text-muted">
                <span className="text-4xl block mb-3">🏆</span>
                <p className="text-sm">No ratings yet. Complete tasks to appear here.</p>
              </div>
            )}
          </div>
        )
      }
    </div>
  )
}

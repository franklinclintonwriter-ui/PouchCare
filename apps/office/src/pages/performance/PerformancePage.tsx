import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Skeleton } from '@/components/ui/Skeleton'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

export default function PerformancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-performance'],
    queryFn: () => api.get('/performance').then((r) => r.data).catch(() => ({ data: [] })),
  })

  const chartData = (data?.data || []).slice(0, 12).map((r: any) => ({
    period: r.reviewPeriod || r.reviewQuarter || 'N/A',
    rating: r.overallRating,
    quality: r.taskQuality,
  })).reverse()

  const latest = (data?.data || [])[0]

  usePageHeader('📈 My Performance', 'CEO ratings and review history')

  return (
    <div>

      {/* Latest rating */}
      {latest && (
        <div className="bg-midnight-card border border-sky-500/30 rounded-xl p-5 mb-6 border-l-4 border-l-sky-500">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Latest CEO Rating</p>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-4xl font-bold text-sky-400">{latest.overallRating}</span>
            <span className="text-text-muted">/10</span>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-4 text-center">
            {[
              { l: 'Task Quality', v: latest.taskQuality },
              { l: 'Communication', v: latest.communication },
              { l: 'Punctuality', v: latest.punctuality },
              { l: 'Teamwork', v: latest.teamwork },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-mono font-bold text-lg text-text-primary">{s.v ?? '—'}</p>
                <p className="text-[10px] text-text-muted">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      {isLoading
        ? <Skeleton className="h-48 rounded-xl" />
        : chartData.length > 1 && (
          <div className="bg-midnight-card border border-midnight-border rounded-xl p-5 mb-6">
            <h3 className="font-sora font-semibold text-sm mb-4">Rating Trend</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3D" />
                <XAxis dataKey="period" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1E2A3D', borderRadius: 10, fontSize: 12 }} />
                <Line type="monotone" dataKey="rating" stroke="#0EA5E9" strokeWidth={2} dot={{ fill: '#0EA5E9', r: 4 }} name="Overall" />
                <Line type="monotone" dataKey="quality" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 4 }} name="Quality" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      }

      {/* History */}
      <div className="space-y-2">
        <h3 className="font-sora font-semibold text-sm text-text-secondary mb-3">Rating History</h3>
        {(data?.data || []).map((r: any, i: number) => (
          <div key={r.id || i} className="bg-midnight-card border border-midnight-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">{r.reviewPeriod} {r.reviewYear && `· ${r.reviewYear}`}</p>
              <p className="text-xs text-text-muted mt-0.5">Rated by {r.ratedBy || 'CEO'}</p>
            </div>
            <span className="font-mono text-xl font-bold text-sky-400">{r.overallRating}<span className="text-sm text-text-muted">/10</span></span>
          </div>
        ))}
        {(data?.data || []).length === 0 && !isLoading && (
          <p className="text-center py-12 text-text-muted text-sm">No performance reviews yet.</p>
        )}
      </div>
    </div>
  )
}

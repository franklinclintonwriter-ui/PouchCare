import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

const MOODS: Record<string, string> = { '😊 Great': 'text-green-400', '🙂 Good': 'text-sky-400', '😐 Neutral': 'text-text-muted', '😔 Stressed': 'text-yellow-400', '😞 Bad': 'text-red-400' }

export default function ReportsPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['all-reports', search],
    queryFn: () => api.get(`/reports/daily?limit=30`).then(r => r.data).catch(() => ({ data: [] })),
  })

  const noBlockers = (data?.data || []).filter((r: any) => !r.blockers).length
  const withBlockers = (data?.data || []).filter((r: any) => r.blockers).length

  usePageHeader('📝 Daily Reports', `${data?.meta?.total || 0} total · ${withBlockers} with blockers`)

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-midnight-card border border-midnight-border rounded-xl p-4 text-center"><p className="text-2xl font-mono font-bold text-text-primary">{data?.meta?.total || '—'}</p><p className="text-xs text-text-muted">Total Reports</p></div>
        <div className="bg-midnight-card border border-green-500/20 rounded-xl p-4 text-center"><p className="text-2xl font-mono font-bold text-green-400">{noBlockers}</p><p className="text-xs text-text-muted">No Blockers</p></div>
        <div className="bg-midnight-card border border-red-500/20 rounded-xl p-4 text-center"><p className="text-2xl font-mono font-bold text-red-400">{withBlockers}</p><p className="text-xs text-text-muted">Have Blockers</p></div>
      </div>
      <div className="space-y-3">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : (data?.data || []).map((r: any) => (
            <div key={r.id} className={`bg-midnight-card border rounded-xl p-5 ${r.blockers ? 'border-red-500/20' : 'border-midnight-border'}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-medium text-text-primary">{r.submitterName}</p>
                  <p className="text-xs text-text-muted">{r.submitterRole?.replace(/_/g, ' ')} · {r.branch} · {formatDate(r.reportDate)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.mood && <span className="text-lg">{r.mood.split(' ')[0]}</span>}
                  <span className="font-mono text-xs text-text-muted">{r.hoursWorked}h</span>
                </div>
              </div>
              <div className="grid gap-2 text-sm">
                <div><p className="text-xs text-text-muted uppercase tracking-wide mb-0.5">Completed</p><p className="text-text-secondary">{r.tasksCompleted}</p></div>
                {r.blockers && <div><p className="text-xs text-red-400 uppercase tracking-wide mb-0.5">⚠️ Blockers</p><p className="text-red-300">{r.blockers}</p></div>}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

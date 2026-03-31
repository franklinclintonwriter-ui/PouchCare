import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { formatDate, statusColor } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

export default function LeavePage() {
  const [status, setStatus] = useState('All')
  const toast = useToast(); const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['all-leave', status],
    queryFn: () => api.get(`/leave${status !== 'All' ? `?status=${status}` : ''}&limit=50`).then(r => r.data).catch(() => ({ data: [] })),
  })

  const approve = useMutation({ mutationFn: (id: string) => api.put(`/leave/${id}/approve`), onSuccess: () => { toast.success('Leave approved'); qc.invalidateQueries({ queryKey: ['all-leave'] }) } })
  const reject  = useMutation({ mutationFn: (id: string) => api.put(`/leave/${id}/reject`, { reason: 'Rejected by manager' }), onSuccess: () => { toast.success('Leave rejected'); qc.invalidateQueries({ queryKey: ['all-leave'] }) } })

  const pendingCount = (data?.data || []).filter((r: any) => r.status === 'PENDING').length

  usePageHeader('🌴 Leave Management', `${pendingCount} pending · ${data?.meta?.total || 0} total`)

  return (
    <div>
      <div className="flex gap-1 mb-4 flex-wrap">
        {['All', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${status === s ? 'bg-sky-500 text-white border-sky-500' : 'text-text-muted border-midnight-border hover:border-white/20'}`}>
            {s === 'All' ? 'All' : s}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {(data?.data || []).map((r: any) => (
          <div key={r.id} className={`bg-midnight-card border rounded-xl p-4 flex items-center justify-between ${r.status === 'PENDING' ? 'border-yellow-500/20' : 'border-midnight-border'}`}>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-primary">{r.staffName}</p>
              <p className="text-xs text-text-muted mt-0.5">{r.leaveType} · {formatDate(r.startDate)} → {formatDate(r.endDate)} · {r.totalDays} day(s)</p>
              {r.reason && <p className="text-xs text-text-secondary mt-0.5 italic">"{r.reason}"</p>}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              <Badge label={r.status} color={statusColor(r.status.toLowerCase()) as any} />
              {r.status === 'PENDING' && (
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => approve.mutate(r.id)} loading={approve.isPending}>✓</Button>
                  <Button size="sm" variant="danger" onClick={() => reject.mutate(r.id)} loading={reject.isPending}>✗</Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {!(data?.data || []).length && !isLoading && <div className="text-center py-16 text-text-muted"><span className="text-4xl block mb-3">🌴</span><p>No leave requests.</p></div>}
      </div>
    </div>
  )
}

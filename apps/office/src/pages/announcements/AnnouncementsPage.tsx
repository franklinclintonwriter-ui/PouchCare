import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/Skeleton'
import { timeAgo } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

export default function AnnouncementsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/notifications').then((r) => r.data).catch(() => ({ data: [] })),
    refetchInterval: 60000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.post('/notifications/mark-read', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  })

  usePageHeader('📣 Announcements', undefined,
    <button onClick={() => api.post('/notifications/mark-read', { all: true }).then(() => qc.invalidateQueries({ queryKey: ['announcements'] }))}
      className="text-xs text-sky-500 hover:underline">Mark all read</button>
  )

  return (
    <div>
      {isLoading
        ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        : <div className="space-y-2">
          {(data?.data || []).map((a: any) => (
            <div key={a.id} onClick={() => !a.read && markRead.mutate(a.id)}
              className={`bg-midnight-card border rounded-xl p-4 cursor-pointer transition-all ${!a.read ? 'border-sky-500/40 shadow-sm shadow-sky-500/10' : 'border-midnight-border opacity-70'}`}>
              <div className="flex items-start gap-3">
                {!a.read && <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-1.5 animate-pulse-dot" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${!a.read ? 'text-text-primary' : 'text-text-secondary'}`}>{a.title}</p>
                    {a.isUrgent && <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5 flex-shrink-0">Urgent</span>}
                  </div>
                  <p className="text-xs text-text-muted mt-1">{a.message}</p>
                  <p className="text-[10px] text-text-muted mt-2">From {a.sentBy || 'Management'} · {timeAgo(a.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
          {(data?.data || []).length === 0 && (
            <div className="text-center py-16 text-text-muted">
              <span className="text-4xl block mb-3">📣</span>
              <p className="text-sm">No announcements yet.</p>
            </div>
          )}
        </div>
      }
    </div>
  )
}

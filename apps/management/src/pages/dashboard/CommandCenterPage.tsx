import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

interface Alert { id: string; type: 'critical' | 'important' | 'info'; title: string; detail: string; action?: string }

export default function CommandCenterPage() {
  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ['command-center'],
    queryFn: () => api.get('/analytics/health').then((r) => r.data.data?.alerts || []).catch(() => []),
    refetchInterval: 30000,
  })

  const critical = (alerts || []).filter((a) => a.type === 'critical')
  const important = (alerts || []).filter((a) => a.type === 'important')
  const info = (alerts || []).filter((a) => a.type === 'info')

  usePageHeader('⚡ Command Center', 'CEO morning briefing — live alerts',
    <Button size="sm" variant="ghost" onClick={() => window.location.reload()}>↻ Refresh</Button>
  )

  const Section = ({ title, items, color }: { title: string; items: Alert[]; color: string }) => (
    <div className={`bg-midnight-card border rounded-xl p-5 border-l-4 ${color}`}>
      <h3 className="font-sora font-semibold mb-4 flex items-center gap-2">
        {title} <span className="text-xs font-mono bg-midnight rounded px-2 py-0.5">{items.length}</span>
      </h3>
      {items.length === 0
        ? <p className="text-text-muted text-sm">All clear ✓</p>
        : items.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-3 border-b border-midnight-border last:border-0">
            <div>
              <p className="text-sm font-medium text-text-primary">{a.title}</p>
              <p className="text-xs text-text-muted mt-0.5">{a.detail}</p>
            </div>
            {a.action && <Button size="sm" variant="ghost">{a.action}</Button>}
          </div>
        ))
      }
    </div>
  )

  return (
    <div>
      {isLoading
        ? <div className="space-y-4">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-32 rounded-xl"/>)}</div>
        : <div className="space-y-4">
          <Section title="🔴 Critical" items={critical} color="border-l-red-500 border-midnight-border" />
          <Section title="🟡 Important" items={important} color="border-l-yellow-500 border-midnight-border" />
          <Section title="🔵 Pulse" items={info} color="border-l-sky-500 border-midnight-border" />
        </div>
      }
    </div>
  )
}

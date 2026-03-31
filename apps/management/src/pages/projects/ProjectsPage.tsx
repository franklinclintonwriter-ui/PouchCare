import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useUiStore } from '@/stores/uiStore'
import { formatDate, formatCurrency, statusColor } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

const col = createColumnHelper<any>()
const COLS = [
  col.accessor('projectId', { header: '#', cell: i => <span className="font-mono text-xs text-text-muted">PRJ-{i.getValue()}</span> }),
  col.accessor('name', { header: 'Project', cell: i => <span className="font-medium text-text-primary">{i.getValue()}</span> }),
  col.accessor('clientName', { header: 'Client', cell: i => <span className="text-xs text-text-secondary">{i.getValue() || '—'}</span> }),
  col.accessor('serviceType', { header: 'Type', cell: i => <span className="text-xs text-text-muted">{i.getValue()?.replace(/_/g, ' ') || '—'}</span> }),
  col.accessor('price', { header: 'Value', cell: i => <span className="font-mono text-xs text-green-400 font-bold">{i.getValue() ? formatCurrency(i.getValue()) : '—'}</span> }),
  col.accessor('paymentStatus', { header: 'Payment', cell: i => {
    const c: Record<string, any> = { PAID: 'green', PARTIAL: 'yellow', UNPAID: 'red', OVERDUE: 'red' }
    return <Badge label={i.getValue()} color={c[i.getValue()] || 'gray'} />
  }}),
  col.accessor('deadline', { header: 'Deadline', cell: i => <span className="text-xs text-text-muted">{i.getValue() ? formatDate(i.getValue()) : '—'}</span> }),
  col.accessor('progress', { header: 'Progress', cell: i => (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-midnight-border rounded-full overflow-hidden w-14">
        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${i.getValue()}%` }} />
      </div>
      <span className="font-mono text-[10px] text-text-muted">{i.getValue()}%</span>
    </div>
  )}),
  col.accessor('status', { header: 'Status', cell: i => <Badge label={i.getValue()} color={statusColor(i.getValue().toLowerCase()) as any} /> }),
]

const STATUSES = ['All', 'PENDING', 'IN_PROGRESS', 'REVIEW', 'DELIVERED', 'ON_HOLD', 'CANCELLED']

export default function ProjectsPage() {
  const { openSlideOver, closeSlideOver } = useUiStore()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')

  const { data, isLoading } = useQuery({
    queryKey: ['projects', search, status],
    queryFn: () => {
      const p = new URLSearchParams()
      if (search) p.set('q', search)
      if (status !== 'All') p.set('status', status)
      return api.get(`/projects?${p}`).then(r => r.data).catch(() => ({ data: [], meta: { total: 0 } }))
    },
  })

  usePageHeader('📁 Projects', `${data?.meta?.total || 0} total`,
    <Button size="sm" onClick={() => openSlideOver(<div className="p-4"><h3 className="font-sora font-semibold mb-2">Create Project</h3><p className="text-text-muted text-sm">Connect to POST /projects</p></div>)}>+ New Project</Button>
  )

  return (
    <div>
      <div className="sticky top-16 bg-midnight z-10 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
            className="bg-midnight-card border border-midnight-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-sky-500 w-48 placeholder:text-text-muted" />
          <div className="flex gap-1 flex-wrap">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${status === s ? 'bg-sky-500 text-white border-sky-500' : 'text-text-muted border-midnight-border hover:border-white/20'}`}>
                {s === 'All' ? 'All' : s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>
      <DataTable data={data?.data || []} columns={COLS} loading={isLoading}
        onRowClick={p => openSlideOver(<div className="p-4"><h3 className="font-sora font-semibold mb-2">{p.name}</h3><pre className="text-xs text-text-muted">{JSON.stringify(p, null, 2)}</pre></div>)}
        emptyState="No projects found." />
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useUiStore } from '@/stores/uiStore'
import { formatDate, statusColor, truncate } from '@/lib/utils'
import type { Task } from '@/types'
import api from '@/lib/api'
import { TaskSlideOver } from './TaskSlideOver'
import { usePageHeader } from '@/hooks/usePageHeader'

const col = createColumnHelper<Task>()
const COLUMNS: any[] = [
  col.accessor('taskId', { header: '#', cell: (i) => <span className="font-mono text-xs text-text-muted">TSK-{i.getValue()}</span> }),
  col.accessor('title', { header: 'Task', cell: (i) => <span className="font-medium text-text-primary">{truncate(i.getValue(), 45)}</span> }),
  col.accessor('assignedMember', { header: 'Assigned', cell: (i) => { const v: any = i.getValue(); return <span className="text-xs">{v && typeof v === 'object' ? v.name : (v || '—')}</span> } }),
  col.accessor('priority', { header: 'Priority', cell: (i) => {
    const c = { CRITICAL: 'red', HIGH: 'yellow', MEDIUM: 'sky', LOW: 'gray', Critical: 'red', High: 'yellow', Medium: 'sky', Low: 'gray' } as Record<string, any>
    return <Badge label={i.getValue()} color={c[i.getValue()] || 'gray'} />
  }}),
  col.accessor('approvalStatus', { header: 'Approval', cell: (i) => {
    const LABELS: Record<string, string> = {
      WAITING: 'Waiting', SUBMITTED: 'Submitted', APPROVED_MGR: 'Approved',
      REJECTED_MGR: 'Rejected', ESCALATED: 'Escalated', VERIFIED: 'Verified',
    }
    const val = i.getValue() as string
    return <Badge label={LABELS[val] || val} color={statusColor(val) as any} />
  } }),
  col.accessor('deadline', { header: 'Deadline', cell: (i) => <span className="text-xs text-text-muted">{i.getValue() ? formatDate(i.getValue()!) : '—'}</span> }),
  col.accessor('progress', { header: 'Progress', cell: (i) => (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-midnight-border rounded-full overflow-hidden w-16">
        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${i.getValue()}%` }} />
      </div>
      <span className="text-xs text-text-muted font-mono">{i.getValue()}%</span>
    </div>
  )}),
]

const STATUS_FILTERS = ['All', 'Not Started', 'In Progress', 'Blocked', 'Review', 'Done']
const APPROVAL_FILTERS = [
  { label: 'All',                value: 'All' },
  { label: 'Submitted by Staff', value: 'SUBMITTED' },
  { label: 'Approved by Manager',value: 'APPROVED_MGR' },
  { label: 'Rejected by Manager',value: 'REJECTED_MGR' },
  { label: 'Escalated to CEO',   value: 'ESCALATED' },
  { label: 'Completed & Verified',value: 'VERIFIED' },
]

export default function TasksPage() {
  const { openSlideOver } = useUiStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatus] = useState('All')
  const [approvalFilter, setApproval] = useState('All')
  const [view, setView] = useState<'table' | 'board'>('table')

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', search, statusFilter, approvalFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (statusFilter !== 'All') params.set('status', statusFilter)
      if (approvalFilter && approvalFilter !== 'All') params.set('approvalStatus', approvalFilter)
      return api.get(`/tasks?${params}`).then((r) => r.data).catch(() => ({ data: [] }))
    },
    staleTime: 30000,
  })

  usePageHeader('Tasks', `${data?.meta?.total || 0} total`,
    <div className="flex items-center gap-2">
      <div className="flex bg-midnight-card border border-midnight-border rounded-lg p-0.5">
        {(['table', 'board'] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${view === v ? 'bg-sky-500 text-white' : 'text-text-muted hover:text-text-primary'}`}>
            {v === 'table' ? '☰ Table' : '⧉ Board'}
          </button>
        ))}
      </div>
      <Button size="sm" onClick={() => openSlideOver(<TaskSlideOver mode="create" />)}>+ New Task</Button>
    </div>
  )

  return (
    <div>
      {/* Toolbar */}
      <div className="sticky top-16 bg-midnight z-10 pb-4">

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..."
              className="bg-midnight-card border border-midnight-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary outline-none focus:border-sky-500 w-48 placeholder:text-text-muted" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${statusFilter === s ? 'bg-sky-500 text-white border-sky-500' : 'text-text-muted border-midnight-border hover:border-white/20 hover:text-text-primary'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap mt-1">
            {APPROVAL_FILTERS.map((f) => (
              <button key={f.value} onClick={() => setApproval(f.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${approvalFilter === f.value ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' : 'text-text-muted border-midnight-border hover:border-white/20 hover:text-text-primary'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'table'
        ? <DataTable<Task>
            data={data?.data || []}
            columns={COLUMNS}
            loading={isLoading}
            onRowClick={(task) => openSlideOver(<TaskSlideOver mode="view" task={task} />)}
            emptyState="No tasks found."
          />
        : <TaskBoardView tasks={data?.data || []} onTaskClick={(t) => openSlideOver(<TaskSlideOver mode="view" task={t} />)} />
      }
    </div>
  )
}

function TaskBoardView({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (t: Task) => void }) {
  const statuses = ['Not Started', 'In Progress', 'Review', 'Blocked', 'Done']
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statuses.map((status) => {
        const col = tasks.filter((t) => t.status === status)
        const colors: Record<string, string> = { 'Not Started': 'gray', 'In Progress': 'sky', Review: 'yellow', Blocked: 'red', Done: 'green' }
        return (
          <div key={status} className="flex-shrink-0 w-72">
            <div className="flex items-center gap-2 mb-3">
              <Badge label={status} color={colors[status] as any} />
              <span className="text-xs text-text-muted font-mono">{col.length}</span>
            </div>
            <div className="space-y-2">
              {col.map((t) => (
                <div key={t.id} onClick={() => onTaskClick(t)}
                  className="bg-midnight-card border border-midnight-border rounded-xl p-4 cursor-pointer hover:border-sky-500/40 transition-all hover:-translate-y-0.5">
                  <p className="text-sm font-medium text-text-primary mb-2">{t.title}</p>
                  <div className="flex items-center justify-between">
                    <Badge label={t.priority} color={{ Critical: 'red', High: 'yellow', Medium: 'sky', Low: 'gray' }[t.priority] as any} />
                    <span className="text-xs text-text-muted">{typeof t.assignedMember === 'object' && t.assignedMember ? (t.assignedMember as any).name : (t.assignedMember || 'Unassigned')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

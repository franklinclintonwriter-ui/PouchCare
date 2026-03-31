import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useUiStore } from '@/stores/uiStore'
import { statusColor, formatDate } from '@/lib/utils'
import api from '@/lib/api'
import type { Task } from '@/types'
import { usePageHeader } from '@/hooks/usePageHeader'

function TaskDetail({ task, onClose }: { task: Task; onClose: () => void }) {
  const qc = useQueryClient()
  const submitMutation = useMutation({
    mutationFn: (note: string) => api.post(`/tasks/${task.id}/submit`, { note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-tasks'] }); onClose() },
  })
  const [note, setNote] = useState('')
  const [progress, setProgress] = useState(task.progress)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-text-muted font-mono">TSK-{task.taskId}</p>
          <h2 className="font-sora font-semibold text-lg mt-0.5">{task.title}</h2>
        </div>
        <button onClick={onClose} className="text-text-muted text-2xl hover:text-text-primary">×</button>
      </div>

      <div className="flex gap-2 mb-6">
        <Badge label={task.status} color={statusColor(task.status) as any} />
        <Badge label={task.priority} color={{ Critical:'red', High:'yellow', Medium:'sky', Low:'gray' }[task.priority] as any} />
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs text-text-muted mb-2">
          <span>Progress: {progress}%</span>
        </div>
        <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(+e.target.value)}
          className="w-full accent-sky-500" />
      </div>

      {task.approvalStatus === 'Waiting for Submission' && (
        <div className="border-t border-midnight-border pt-4">
          <label className="text-xs text-text-muted uppercase tracking-wide block mb-2">Submission Note</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="What did you complete?"
            className="w-full bg-[#0d1528] border border-midnight-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-sky-500 resize-none placeholder:text-text-muted" />
          <Button className="mt-3 w-full" onClick={() => submitMutation.mutate(note)} loading={submitMutation.isPending}>
            Submit for Review →
          </Button>
        </div>
      )}

      {task.ceoWorkRating && (
        <div className="mt-4 bg-sky-500/10 border border-sky-500/20 rounded-xl p-4">
          <p className="text-xs text-sky-400 font-semibold mb-1">CEO Rating</p>
          <p className="text-2xl font-mono font-bold text-sky-400">{task.ceoWorkRating}<span className="text-base text-text-muted">/10</span></p>
        </div>
      )}
    </div>
  )
}

export default function TasksPage() {
  const { openSlideOver, closeSlideOver } = useUiStore()
  const [filter, setFilter] = useState('All')
  const filters = ['All', 'Not Started', 'In Progress', 'Review', 'Done']

  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks', filter],
    queryFn: () => api.get(`/tasks${filter !== 'All' ? `?status=${filter}` : ''}`).then((r) => r.data).catch(() => ({ data: [] })),
  })

  usePageHeader('✅ My Tasks', `${data?.meta?.total || 0} tasks`)

  return (
    <div>
      <div className="flex gap-1 flex-wrap mb-4">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filter === f ? 'bg-sky-500 text-white border-sky-500' : 'text-text-muted border-midnight-border hover:border-white/20 hover:text-text-primary'}`}>
            {f}
          </button>
        ))}
      </div>

      {isLoading
        ? <div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-20 rounded-xl"/>)}</div>
        : <div className="space-y-2">
          {(data?.data || []).map((task: Task) => (
            <div key={task.id} onClick={() => openSlideOver(<TaskDetail task={task} onClose={closeSlideOver} />)}
              className="bg-midnight-card border border-midnight-border rounded-xl p-4 cursor-pointer hover:border-sky-500/40 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary">{task.title}</p>
                  <p className="text-xs text-text-muted mt-1">{task.deadline ? `Due ${formatDate(task.deadline)}` : 'No deadline'}</p>
                </div>
                <Badge label={task.approvalStatus} color={statusColor(task.approvalStatus) as any} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-midnight-border rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${task.progress}%` }} />
                </div>
                <span className="text-xs font-mono text-text-muted">{task.progress}%</span>
              </div>
            </div>
          ))}
          {(data?.data || []).length === 0 && <div className="text-center py-16 text-text-muted">No tasks found 🎉</div>}
        </div>
      }
    </div>
  )
}

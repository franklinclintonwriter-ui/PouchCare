import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUiStore } from '@/stores/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { statusColor, formatDate } from '@/lib/utils'
import api from '@/lib/api'

// Approval status enum keys → display labels
const APPROVAL_LABELS: Record<string, string> = {
  WAITING:      'Waiting for Submission',
  SUBMITTED:    'Submitted by Staff',
  APPROVED_MGR: 'Approved by Manager',
  REJECTED_MGR: 'Rejected by Manager',
  ESCALATED:    'Escalated to CEO',
  VERIFIED:     'Completed & Verified',
}

interface Props { mode: 'create' | 'view'; task?: any }

export function TaskSlideOver({ mode, task }: Props) {
  const { closeSlideOver } = useUiStore()
  const { isCEO, isManager } = useAuth()
  const qc = useQueryClient()
  const [ratingVal, setRatingVal] = useState<number | null>(task?.ceoWorkRating || null)
  const [ratingNote, setRatingNote] = useState(task?.ceoRatingNote || '')
  const [verifyNote, setVerifyNote] = useState('')

  const actionMutation = useMutation({
    mutationFn: ({ action, body }: { action: string; body?: any }) =>
      api.post(`/tasks/${task?.id}/${action}`, body || {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      closeSlideOver()
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.error || 'Action failed'
      console.error(msg)
    },
  })

  // Create mode
  if (mode === 'create') {
    return <CreateTaskForm onClose={closeSlideOver} />
  }

  if (!task) return null

  const approvalStatus = task.approvalStatus // enum key e.g. SUBMITTED
  const approvalLabel = APPROVAL_LABELS[approvalStatus] || approvalStatus

  // What can CEO do: everything. What can manager do: approve/reject/escalate
  const canApproveReject = isManager() && (approvalStatus === 'SUBMITTED' || approvalStatus === 'ESCALATED')
  const canEscalate      = isManager() && !isCEO() && approvalStatus === 'SUBMITTED'
  const canVerify        = isCEO() && (approvalStatus === 'APPROVED_MGR' || approvalStatus === 'ESCALATED')
  const canRate          = isCEO() && approvalStatus === 'VERIFIED'
  // CEO can do all of the above
  const ceoCanApprove    = isCEO() && approvalStatus === 'SUBMITTED'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-text-muted font-mono mb-1">TSK-{task.taskId}</p>
          <h2 className="font-sora font-semibold text-lg leading-tight">{task.title}</h2>
        </div>
        <button onClick={closeSlideOver} className="text-text-muted hover:text-text-primary text-2xl flex-shrink-0 ml-4">×</button>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        <Badge label={task.status?.replace(/_/g, ' ')} color={statusColor(task.status) as any} />
        <Badge label={task.priority}
          color={({ CRITICAL: 'red', HIGH: 'yellow', MEDIUM: 'sky', LOW: 'gray' } as any)[task.priority] || 'gray'} />
        <Badge label={approvalLabel} color={statusColor(approvalStatus) as any} />
        {task.ceoVerified && <Badge label="✓ CEO Verified" color="green" />}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
        {[
          ['Assigned To',  task.assignedMember?.name || task.assignedMember || '—'],
          ['Manager',      task.assignedManager?.name || task.assignedManager || '—'],
          ['Branch',       task.assignedBranch || '—'],
          ['Deadline',     task.deadline ? formatDate(task.deadline) : '—'],
          ['Est. Hours',   task.estimatedHours?.toString() || '—'],
          ['Actual Hours', task.actualHours?.toString() || '—'],
          ['Created by',   task.createdByRole || '—'],
          ['Category',     task.category || '—'],
        ].map(([l, v]) => (
          <div key={String(l)}>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-0.5">{l}</p>
            <p className="text-text-primary font-medium text-xs">{String(v)}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-text-muted mb-1.5">
          <span>Progress</span>
          <span className="font-mono">{task.progress || 0}%</span>
        </div>
        <div className="h-2 bg-midnight-border rounded-full overflow-hidden">
          <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${task.progress || 0}%` }} />
        </div>
      </div>

      {/* Notes */}
      {task.notes && (
        <div className="mb-5 p-3 bg-midnight-hover rounded-lg border border-midnight-border">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-text-secondary">{task.notes}</p>
        </div>
      )}

      {/* Staff submission note */}
      {task.staffSubmissionNote && (
        <div className="mb-5 p-3 bg-sky-500/10 rounded-lg border border-sky-500/20">
          <p className="text-xs text-sky-400 uppercase tracking-wide mb-1">Staff Submission Note</p>
          <p className="text-sm text-text-primary">{task.staffSubmissionNote}</p>
        </div>
      )}

      {/* CEO Work Rating (if rated) */}
      {task.ceoWorkRating && (
        <div className="mb-5 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <p className="text-xs text-green-400 uppercase tracking-wide mb-1">CEO Work Rating</p>
          <p className="text-2xl font-bold font-mono text-green-400">{task.ceoWorkRating}<span className="text-sm text-text-muted">/10</span></p>
          {task.ceoRatingNote && <p className="text-xs text-text-muted mt-1">{task.ceoRatingNote}</p>}
        </div>
      )}

      {/* ── Action Buttons ─────────────────────────────── */}
      <div className="pt-4 border-t border-midnight-border space-y-3">

        {/* CEO can approve directly (skip manager) */}
        {ceoCanApprove && (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1"
              onClick={() => actionMutation.mutate({ action: 'approve' })}
              loading={actionMutation.isPending}>
              ✅ Approve (CEO)
            </Button>
            <Button size="sm" variant="danger"
              onClick={() => actionMutation.mutate({ action: 'reject' })}
              loading={actionMutation.isPending}>
              ✗ Reject
            </Button>
          </div>
        )}

        {/* Manager approve/reject (non-CEO) */}
        {canApproveReject && !isCEO() && (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1"
              onClick={() => actionMutation.mutate({ action: 'approve' })}
              loading={actionMutation.isPending}>
              ✅ Approve
            </Button>
            <Button size="sm" variant="danger"
              onClick={() => actionMutation.mutate({ action: 'reject' })}
              loading={actionMutation.isPending}>
              ✗ Reject
            </Button>
          </div>
        )}

        {/* Escalate to CEO (manager only) */}
        {canEscalate && (
          <Button size="sm" variant="secondary" className="w-full"
            onClick={() => actionMutation.mutate({ action: 'escalate' })}
            loading={actionMutation.isPending}>
            ⬆ Escalate to CEO
          </Button>
        )}

        {/* CEO Verify */}
        {canVerify && (
          <div className="space-y-2">
            <textarea value={verifyNote} onChange={e => setVerifyNote(e.target.value)}
              rows={2} placeholder="Verification note (optional)..."
              className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 resize-none placeholder:text-text-muted" />
            <Button size="sm" className="w-full"
              onClick={() => actionMutation.mutate({ action: 'verify', body: { note: verifyNote } })}
              loading={actionMutation.isPending}>
              🔍 Verify & Complete
            </Button>
          </div>
        )}

        {/* CEO Rate (after verified) */}
        {canRate && (
          <div className="space-y-2">
            <p className="text-xs text-text-muted uppercase tracking-wide">Rate Work (1–10)</p>
            <div className="flex gap-1.5 flex-wrap">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} onClick={() => setRatingVal(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all
                    ${ratingVal === n ? 'bg-sky-500 text-white border-sky-500' : 'border-midnight-border text-text-muted hover:border-sky-500/50'}`}>
                  {n}
                </button>
              ))}
            </div>
            <textarea value={ratingNote} onChange={e => setRatingNote(e.target.value)}
              rows={2} placeholder="Rating note (optional)..."
              className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 resize-none placeholder:text-text-muted" />
            <Button size="sm" className="w-full" disabled={!ratingVal}
              onClick={() => actionMutation.mutate({ action: 'rate', body: { rating: ratingVal, note: ratingNote } })}
              loading={actionMutation.isPending}>
              ⭐ Submit Rating
            </Button>
          </div>
        )}

        {/* CEO can ALSO rate any task directly */}
        {isCEO() && approvalStatus === 'VERIFIED' && task.ceoWorkRating === null && !canRate && (
          <div className="space-y-2">
            <p className="text-xs text-text-muted uppercase tracking-wide">⭐ Rate Work (1–10)</p>
            <div className="flex gap-1.5 flex-wrap">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} onClick={() => setRatingVal(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all
                    ${ratingVal === n ? 'bg-sky-500 text-white border-sky-500' : 'border-midnight-border text-text-muted hover:border-sky-500/50'}`}>
                  {n}
                </button>
              ))}
            </div>
            <Button size="sm" className="w-full" disabled={!ratingVal}
              onClick={() => actionMutation.mutate({ action: 'rate', body: { rating: ratingVal, note: ratingNote } })}
              loading={actionMutation.isPending}>
              ⭐ Submit Rating
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Create Task Form ──────────────────────────────────────────────
function CreateTaskForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  // Load staff for assignment dropdown
  const { data: staffData } = useQuery({
    queryKey: ['staff-list-simple'],
    queryFn: () => api.get('/staff/members?limit=100').then(r => r.data.data || []),
  })

  const onSubmit = async (data: any) => {
    try {
      await api.post('/tasks', {
        ...data,
        estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : undefined,
      })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    } catch (e: any) {
      console.error(e?.response?.data?.error || 'Failed to create task')
    }
  }

  const staffOptions = [
    { value: '', label: 'Unassigned' },
    ...(staffData || []).map((s: any) => ({ value: s.id, label: s.name })),
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-sora font-semibold text-lg">✅ New Task</h2>
        <button onClick={onClose} className="text-text-muted text-2xl hover:text-text-primary">×</button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Task Title *" placeholder="e.g. Improve meta titles for pouchcare.com"
          error={errors.title?.message as string}
          {...register('title', { required: 'Title is required' })} />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Priority" options={[
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'HIGH', label: 'High' },
            { value: 'CRITICAL', label: 'Critical' },
            { value: 'LOW', label: 'Low' },
          ]} {...register('priority')} />
          <Select label="Assign To" options={staffOptions} {...register('assignedMemberId')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Deadline" type="date" {...register('deadline')} />
          <Input label="Est. Hours" type="number" placeholder="4" {...register('estimatedHours')} />
        </div>

        <Input label="Category" placeholder="SEO / Dev / Content..." {...register('category')} />
        <Input label="Related Client" placeholder="Client name or URL" {...register('relatedClient')} />

        <div>
          <label className="text-xs text-text-muted uppercase tracking-wide block mb-1.5">Notes</label>
          <textarea rows={3} placeholder="Task description, requirements..." {...register('notes')}
            className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 resize-none placeholder:text-text-muted" />
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create Task
        </Button>
      </form>
    </div>
  )
}

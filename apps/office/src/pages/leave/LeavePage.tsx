import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useUiStore } from '@/stores/uiStore'
import { statusColor, formatDate } from '@/lib/utils'
import api from '@/lib/api'
import type { LeaveRequest } from '@/types'
import { usePageHeader } from '@/hooks/usePageHeader'

function ApplyLeaveForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()
  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/leave/apply', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-leave'] }); onClose() },
  })
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-sora font-semibold text-lg">Apply for Leave</h2>
        <button onClick={onClose} className="text-text-muted text-2xl hover:text-text-primary">×</button>
      </div>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <Select label="Leave Type" options={[
          { value: '', label: 'Select type' },
          { value: 'Annual Leave', label: 'Annual Leave' },
          { value: 'Sick Leave', label: 'Sick Leave' },
          { value: 'Emergency Leave', label: 'Emergency Leave' },
          { value: 'Unpaid Leave', label: 'Unpaid Leave' },
        ]} {...register('leaveType')} />
        <Input label="Start Date" type="date" {...register('startDate')} />
        <Input label="End Date" type="date" {...register('endDate')} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Reason</label>
          <textarea rows={3} placeholder="Reason for leave..."
            className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2.5 text-sm outline-none focus:border-sky-500 resize-none placeholder:text-text-muted"
            {...register('reason')} />
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>Submit Application →</Button>
      </form>
    </div>
  )
}

export default function LeavePage() {
  const { openSlideOver, closeSlideOver } = useUiStore()
  const { data, isLoading } = useQuery({
    queryKey: ['my-leave'],
    queryFn: () => api.get('/leave').then((r) => r.data).catch(() => ({ data: [] })),
  })

  usePageHeader('🌴 Leave Requests', undefined,
    <Button size="sm" onClick={() => openSlideOver(<ApplyLeaveForm onClose={closeSlideOver} />)}>+ Apply Leave</Button>
  )

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Annual Balance', value: '12 days', color: 'border-l-green-500' },
          { label: 'Sick Balance', value: '6 days', color: 'border-l-sky-500' },
          { label: 'Used This Year', value: '—', color: 'border-l-yellow-500' },
        ].map((s) => (
          <div key={s.label} className={`bg-midnight-card border border-midnight-border ${s.color} border-l-2 rounded-xl p-4`}>
            <p className="text-xl font-mono font-bold text-text-primary">{s.value}</p>
            <p className="text-xs text-text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {(data?.data || []).map((r: LeaveRequest) => (
          <div key={r.id} className="bg-midnight-card border border-midnight-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">{r.leaveType}</p>
                <p className="text-xs text-text-muted mt-0.5">{formatDate(r.startDate)} → {formatDate(r.endDate)} · {r.totalDays} day(s)</p>
              </div>
              <Badge label={r.status} color={statusColor(r.status) as any} />
            </div>
            {r.reason && <p className="text-xs text-text-muted mt-2 italic">"{r.reason}"</p>}
          </div>
        ))}
        {(data?.data || []).length === 0 && !isLoading && (
          <div className="text-center py-16 text-text-muted">
            <span className="text-4xl block mb-3">🌴</span>
            <p className="text-sm">No leave requests yet.</p>
            <Button size="sm" className="mt-4" onClick={() => openSlideOver(<ApplyLeaveForm onClose={closeSlideOver} />)}>Apply for Leave</Button>
          </div>
        )}
      </div>
    </div>
  )
}

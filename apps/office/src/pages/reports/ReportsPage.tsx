import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUiStore } from '@/stores/uiStore'
import { statusColor, formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { format } from 'date-fns'
import { usePageHeader } from '@/hooks/usePageHeader'

const MOODS = ['😊 Great', '🙂 Good', '😐 Neutral', '😔 Stressed', '😞 Bad']

function ReportForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [mood, setMood] = useState('')
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()
  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/reports/daily', { ...data, mood }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-reports'] }); onClose() },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-sora font-semibold text-lg">Daily Report</h2>
          <p className="text-xs text-text-muted">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
        </div>
        <button onClick={onClose} className="text-text-muted text-2xl hover:text-text-primary">×</button>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Tasks Completed Today *</label>
          <textarea rows={3} placeholder="List what you completed..." className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2.5 text-sm outline-none focus:border-sky-500 resize-none placeholder:text-text-muted" {...register('tasksCompleted')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Planned for Tomorrow *</label>
          <textarea rows={3} placeholder="What will you work on tomorrow?" className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2.5 text-sm outline-none focus:border-sky-500 resize-none placeholder:text-text-muted" {...register('plannedTomorrow')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Blockers (optional)</label>
          <textarea rows={2} placeholder="Any blockers or issues?" className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2.5 text-sm outline-none focus:border-sky-500 resize-none placeholder:text-text-muted" {...register('blockers')} />
        </div>

        <Input label="Hours Worked" type="number" min={1} max={24} defaultValue={8} {...register('hoursWorked', { valueAsNumber: true })} />

        <div>
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide block mb-2">How are you feeling?</label>
          <div className="flex gap-2 flex-wrap">
            {MOODS.map((m) => (
              <button key={m} type="button" onClick={() => setMood(m)}
                className={`px-3 py-2 rounded-lg text-sm border transition-all ${mood === m ? 'bg-sky-500/15 border-sky-500 text-sky-400' : 'border-midnight-border text-text-muted hover:border-white/20'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>Submit Report ✓</Button>
      </form>
    </div>
  )
}

export default function ReportsPage() {
  const { openSlideOver, closeSlideOver } = useUiStore()
  const { data } = useQuery({
    queryKey: ['my-reports'],
    queryFn: () => api.get('/reports/daily').then((r) => r.data).catch(() => ({ data: [] })),
  })

  usePageHeader('📝 Daily Reports', undefined,
    <Button size="sm" onClick={() => openSlideOver(<ReportForm onClose={closeSlideOver} />)}>+ Submit Report</Button>
  )

  return (
    <div>
      <div className="space-y-3">
        {(data?.data || []).map((r: any) => (
          <div key={r.id} className="bg-midnight-card border border-midnight-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-text-primary">{formatDate(r.reportDate)}</p>
              <div className="flex items-center gap-2">
                {r.mood && <span className="text-lg">{r.mood.split(' ')[0]}</span>}
                <Badge label={r.status} color={statusColor(r.status) as any} />
              </div>
            </div>
            <div className="grid gap-3 text-sm">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Completed</p>
                <p className="text-text-secondary">{r.tasksCompleted}</p>
              </div>
              {r.blockers && (
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Blockers</p>
                  <p className="text-red-400">{r.blockers}</p>
                </div>
              )}
              <p className="text-xs text-text-muted font-mono">{r.hoursWorked}h worked</p>
            </div>
          </div>
        ))}
        {(data?.data || []).length === 0 && (
          <div className="text-center py-16 text-text-muted">
            <span className="text-4xl block mb-3">📝</span>
            <p className="text-sm">No reports submitted yet.</p>
            <Button size="sm" className="mt-4" onClick={() => openSlideOver(<ReportForm onClose={closeSlideOver} />)}>Submit Today's Report</Button>
          </div>
        )}
      </div>
    </div>
  )
}

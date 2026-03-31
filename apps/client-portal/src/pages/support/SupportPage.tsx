import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUiStore } from '@/stores/uiStore'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

function TicketDetail({ ticket, onClose }: { ticket: any; onClose: () => void }) {
  const [reply, setReply] = useState('')
  const toast = useToast(); const qc = useQueryClient()
  const send = useMutation({ mutationFn: () => api.post(`/support/tickets/${ticket.id}/reply`, { content: reply }), onSuccess: () => { toast.success('Sent'); setReply(''); qc.invalidateQueries({ queryKey: ['my-tickets'] }); onClose() } })
  return (
    <div>
      <div className="flex items-center justify-between mb-5"><div><h2 className="font-sora font-semibold">{ticket.subject}</h2><p className="text-xs text-text-muted">#{ticket.id?.slice(-8)} · {formatDate(ticket.createdAt)}</p></div><button onClick={onClose} className="text-text-muted text-2xl">×</button></div>
      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
        {(ticket.replies || []).map((r: any) => (
          <div key={r.id} className={`rounded-xl p-3 text-sm ${r.isStaff ? 'bg-sky-500/10 border border-sky-500/20 ml-4' : 'bg-midnight border border-midnight-border mr-4'}`}>
            <p className="text-xs text-text-muted mb-1">{r.isStaff ? '🛡️ Support Team' : '👤 You'}</p>
            <p className="text-text-secondary">{r.content}</p>
          </div>
        ))}
        {!(ticket.replies || []).length && <p className="text-text-muted text-sm text-center py-4">No messages yet.</p>}
      </div>
      {ticket.status !== 'Closed' && (<>
        <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Write your message..." className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 resize-none placeholder:text-text-muted mb-3" />
        <Button className="w-full" onClick={() => send.mutate()} loading={send.isPending} disabled={!reply.trim()}>Send Message</Button>
      </>)}
    </div>
  )
}

function NewTicketForm({ onClose }: { onClose: () => void }) {
  const toast = useToast(); const qc = useQueryClient()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()
  const sub = useMutation({ mutationFn: (d: any) => api.post('/support/tickets', d), onSuccess: () => { toast.success('Ticket created!'); qc.invalidateQueries({ queryKey: ['my-tickets'] }); onClose() } })
  return (
    <div>
      <div className="flex items-center justify-between mb-5"><h2 className="font-sora font-semibold">Create Ticket</h2><button onClick={onClose} className="text-text-muted text-2xl">×</button></div>
      <form onSubmit={handleSubmit((d) => sub.mutate(d))} className="space-y-4">
        <Input label="Subject *" placeholder="Describe your issue..." {...register('subject', { required: true })} />
        <div><label className="text-xs text-text-muted uppercase tracking-wide block mb-1.5">Category</label>
          <select {...register('category')} className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer">
            {['Order Issue','Wallet / Payment','Referral / Commission','Account','Other'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>Submit Ticket</Button>
      </form>
    </div>
  )
}

export default function SupportPage() {
  const [status, setStatus] = useState('All')
  const { openSlideOver, closeSlideOver } = useUiStore()

  const { data } = useQuery({ queryKey: ['my-tickets', status], queryFn: () => api.get(`/support/tickets${status !== 'All' ? `?status=${status}` : ''}`).then(r => r.data).catch(() => ({ data: [] })) })

  usePageHeader('🎫 Support', undefined,
    <Button size="sm" onClick={() => openSlideOver(<NewTicketForm onClose={closeSlideOver} />)}>+ New Ticket</Button>
  )

  return (
    <div>
      <div className="flex gap-1.5 mb-4">
        {['All','Open','In Progress','Resolved','Closed'].map(s => <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${status === s ? 'bg-sky-500 text-white border-sky-500' : 'text-text-muted border-midnight-border hover:border-white/20'}`}>{s}</button>)}
      </div>
      <div className="space-y-2">
        {(data?.data || []).map((t: any) => (
          <div key={t.id} onClick={() => openSlideOver(<TicketDetail ticket={t} onClose={closeSlideOver} />)} className="bg-midnight-card border border-midnight-border rounded-xl p-4 cursor-pointer hover:border-sky-500/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0"><p className="font-medium text-text-primary truncate">{t.subject}</p><p className="text-xs text-text-muted">{t.category || 'General'} · {formatDate(t.createdAt)} · {t.replies?.length || 0} replies</p></div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge label={t.priority || 'Medium'} color={t.priority === 'High' ? 'red' : 'yellow'} />
                <Badge label={t.status} color={t.status === 'Open' ? 'red' : t.status === 'Resolved' ? 'green' : 'sky'} />
              </div>
            </div>
          </div>
        ))}
        {!(data?.data || []).length && <div className="text-center py-16 text-text-muted"><span className="text-4xl block mb-3">🎫</span><p>No tickets yet.</p></div>}
      </div>
    </div>
  )
}

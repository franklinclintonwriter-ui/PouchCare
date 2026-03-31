import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useUiStore } from '@/stores/uiStore'
import { useToast } from '@/hooks/useToast'
import { formatDate, statusColor } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

function TicketDetail({ ticket, onClose }: { ticket: any; onClose: () => void }) {
  const [reply, setReply] = useState('')
  const toast = useToast(); const qc = useQueryClient()
  const sendReply = useMutation({
    mutationFn: () => api.post(`/support/tickets/${ticket.id}/reply`, { content: reply }),
    onSuccess: () => { toast.success('Reply sent'); setReply(''); qc.invalidateQueries({ queryKey: ['support-tickets'] }); onClose() },
  })
  return (
    <div>
      <div className="flex items-center justify-between mb-5"><div><h2 className="font-sora font-semibold">{ticket.subject}</h2><p className="text-xs text-text-muted">#{ticket.id?.slice(-8)} · {ticket.category} · {formatDate(ticket.createdAt)}</p></div><button onClick={onClose} className="text-text-muted text-2xl">×</button></div>
      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
        {(ticket.replies || []).map((r: any) => (
          <div key={r.id} className={`rounded-xl p-3 text-sm ${r.isStaff ? 'bg-sky-500/10 border border-sky-500/20' : 'bg-midnight border border-midnight-border'}`}>
            <p className="text-xs text-text-muted mb-1">{r.authorName} · {r.isStaff ? '🛡️ Staff' : '👤 Client'}</p>
            <p className="text-text-secondary">{r.content}</p>
          </div>
        ))}
      </div>
      <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Type your reply..."
        className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 resize-none placeholder:text-text-muted mb-3" />
      <Button className="w-full" onClick={() => sendReply.mutate()} loading={sendReply.isPending} disabled={!reply.trim()}>Send Reply</Button>
    </div>
  )
}

export default function SupportPage() {
  const [status, setStatus] = useState('All')
  const { openSlideOver, closeSlideOver } = useUiStore()

  const { data } = useQuery({
    queryKey: ['support-tickets', status],
    queryFn: () => api.get(`/support/tickets${status !== 'All' ? `?status=${status}` : ''}`).then(r => r.data).catch(() => ({ data: [] })),
  })

  const openCount = (data?.data || []).filter((t: any) => t.status === 'Open').length

  usePageHeader('🎫 Support Tickets', `${openCount} open · ${data?.meta?.total || 0} total`)

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${status === s ? 'bg-sky-500 text-white border-sky-500' : 'text-text-muted border-midnight-border hover:border-white/20'}`}>{s}</button>
        ))}
      </div>
      <div className="bg-midnight-card border border-midnight-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-[#0B1528]">{['Subject', 'Priority', 'Replies', 'Created', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>)}</tr></thead>
          <tbody>
            {(data?.data || []).map((t: any) => (
              <tr key={t.id} className="border-t border-midnight-border hover:bg-midnight-hover cursor-pointer" onClick={() => openSlideOver(<TicketDetail ticket={t} onClose={closeSlideOver} />)}>
                <td className="px-4 py-3 font-medium text-text-primary">{t.subject}</td>
                <td className="px-4 py-3"><Badge label={t.priority || 'Medium'} color={t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'yellow' : 'gray'} /></td>
                <td className="px-4 py-3 text-text-muted font-mono text-xs">{t.replies?.length || 0}</td>
                <td className="px-4 py-3 text-text-muted text-xs">{formatDate(t.createdAt)}</td>
                <td className="px-4 py-3"><Badge label={t.status} color={t.status === 'Open' ? 'red' : t.status === 'Resolved' ? 'green' : 'sky'} /></td>
                <td className="px-4 py-3 text-sky-400 text-xs hover:underline">Reply →</td>
              </tr>
            ))}
            {!(data?.data || []).length && <tr><td colSpan={6} className="py-10 text-center text-text-muted">No tickets yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

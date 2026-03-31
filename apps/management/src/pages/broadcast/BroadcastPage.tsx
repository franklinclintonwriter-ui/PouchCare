import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

export default function BroadcastPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('staff')
  const [urgent, setUrgent] = useState(false)
  const toast = useToast()

  const send = useMutation({
    mutationFn: () => api.post('/broadcast', { title, message, audience, isUrgent: urgent }),
    onSuccess: () => { toast.success('Broadcast sent!'); setTitle(''); setMessage('') },
    onError: () => toast.error('Failed to send'),
  })

  usePageHeader('📣 Broadcast', 'Send announcements to staff or clients')

  return (
    <div>
      <div className="max-w-xl">
        <div className="bg-midnight-card border border-midnight-border rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wide block mb-1.5">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title..."
              className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2.5 text-sm outline-none focus:border-sky-500 placeholder:text-text-muted" />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wide block mb-1.5">Message *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Your message..."
              className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2.5 text-sm outline-none focus:border-sky-500 resize-none placeholder:text-text-muted" />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wide block mb-2">Audience</label>
            <div className="flex gap-2">
              {[['staff', '👥 Staff'], ['clients', '🌐 Clients'], ['all', '🌍 Everyone']].map(([v, l]) => (
                <button key={v} onClick={() => setAudience(v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${audience === v ? 'bg-sky-500 text-white border-sky-500' : 'border-midnight-border text-text-muted hover:border-white/20'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} className="accent-red-500 w-4 h-4" />
            <span className="text-sm text-text-secondary">🚨 Mark as urgent</span>
          </label>
          <Button className="w-full" onClick={() => send.mutate()} loading={send.isPending} disabled={!title.trim() || !message.trim()}>
            📣 Send Broadcast
          </Button>
        </div>
        <p className="text-xs text-text-muted text-center mt-3">Message will be sent via WebSocket + saved to DB</p>
      </div>
    </div>
  )
}

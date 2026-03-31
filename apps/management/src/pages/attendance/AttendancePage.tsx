import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, statusColor } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

export default function AttendancePage() {
  const [memberId, setMemberId] = useState('')
  const [from, setFrom] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['all-attendance', memberId, from],
    queryFn: () => {
      const p = new URLSearchParams()
      if (memberId) p.set('memberId', memberId)
      if (from) p.set('from', from)
      return api.get(`/attendance?${p}&limit=50`).then(r => r.data).catch(() => ({ data: [] }))
    },
  })

  const today = (data?.data || []).filter((r: any) => r.date?.startsWith(new Date().toISOString().slice(0, 10)))
  const presentToday = today.filter((r: any) => r.status === 'PRESENT' || r.status === 'REMOTE').length

  usePageHeader('🕐 Attendance', `${presentToday} present today · ${data?.meta?.total || 0} records`)

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <input value={memberId} onChange={e => setMemberId(e.target.value)} placeholder="Filter by member ID..."
          className="bg-midnight-card border border-midnight-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-sky-500 w-44 placeholder:text-text-muted" />
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="bg-midnight-card border border-midnight-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-sky-500" />
        <button onClick={() => api.get('/attendance/export', { responseType: 'blob' }).then(r => { const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = 'attendance.csv'; a.click() })}
          className="px-3 py-2 rounded-lg text-xs border border-midnight-border text-text-muted hover:text-text-primary hover:border-white/20 transition-all">
          📥 Export CSV
        </button>
      </div>
      <div className="bg-midnight-card border border-midnight-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-[#0B1528]">{['Staff', 'Date', 'Status', 'Work Type', 'Check In', 'Check Out', 'Hours'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-4 rounded" /></td></tr>)
              : (data?.data || []).map((r: any) => (
                <tr key={r.id} className="border-t border-midnight-border hover:bg-midnight-hover">
                  <td className="px-4 py-3 font-medium text-text-primary">{r.name}</td>
                  <td className="px-4 py-3 text-text-muted text-xs font-mono">{r.date?.slice(0, 10)}</td>
                  <td className="px-4 py-3"><Badge label={r.status} color={r.status === 'PRESENT' ? 'green' : r.status === 'ABSENT' ? 'red' : r.status === 'LATE' ? 'yellow' : 'sky'} /></td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{r.workType}</td>
                  <td className="px-4 py-3 text-text-muted text-xs font-mono">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-4 py-3 text-text-muted text-xs font-mono">{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-4 py-3 text-text-muted text-xs font-mono">{r.hoursWorked ? `${r.hoursWorked}h` : '—'}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

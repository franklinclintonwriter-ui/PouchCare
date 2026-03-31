import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { statusColor, formatDate } from '@/lib/utils'
import api from '@/lib/api'
import type { AttendanceRecord } from '@/types'
import { usePageHeader } from '@/hooks/usePageHeader'

export default function AttendancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => api.get('/attendance').then((r) => r.data).catch(() => ({ data: [] })),
  })

  const stats = { present: 0, absent: 0, late: 0, total: (data?.data || []).length }
  ;(data?.data || []).forEach((r: AttendanceRecord) => {
    if (r.status === 'Present') stats.present++
    else if (r.status === 'Absent') stats.absent++
    else if (r.status === 'Late') stats.late++
  })

  usePageHeader('🕐 Attendance', 'Your attendance history')

  return (
    <div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Present', value: stats.present, color: 'text-green-500' },
          { label: 'Absent', value: stats.absent, color: 'text-red-500' },
          { label: 'Late', value: stats.late, color: 'text-yellow-500' },
          { label: 'Total', value: stats.total, color: 'text-sky-500' },
        ].map((s) => (
          <div key={s.label} className="bg-midnight-card border border-midnight-border rounded-xl p-4 text-center">
            <p className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Records */}
      {isLoading
        ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        : <div className="bg-midnight-card border border-midnight-border rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#0B1528] border-b border-midnight-border">
                {['Date', 'Status', 'Work Type', 'Check In', 'Check Out', 'Hours'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.data || []).map((r: AttendanceRecord) => (
                <tr key={r.id} className="border-b border-midnight-border last:border-0 hover:bg-midnight-hover">
                  <td className="px-4 py-3 text-text-primary font-medium">{formatDate(r.date)}</td>
                  <td className="px-4 py-3"><Badge label={r.status} color={statusColor(r.status) as any} /></td>
                  <td className="px-4 py-3 text-text-secondary">{r.workType}</td>
                  <td className="px-4 py-3 text-text-muted font-mono text-xs">{r.checkInTime?.slice(11, 16) || '—'}</td>
                  <td className="px-4 py-3 text-text-muted font-mono text-xs">{r.checkOutTime?.slice(11, 16) || '—'}</td>
                  <td className="px-4 py-3 text-text-muted font-mono text-xs">{r.hoursWorked ? `${r.hoursWorked}h` : '—'}</td>
                </tr>
              ))}
              {(data?.data || []).length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-text-muted">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      }
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { KpiCard } from '@/components/ui/KpiCard'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/stores/authStore'
import { statusColor } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

export default function BranchDashboardPage() {
  const { user } = useAuthStore()

  const { data: staffData } = useQuery({
    queryKey: ['branch-staff', user?.branch],
    queryFn: () => api.get(`/staff/members?branch=${user?.branch}&limit=20`).then(r => r.data).catch(() => ({ data: [] })),
  })

  const { data: pendingTasks } = useQuery({
    queryKey: ['branch-pending'],
    queryFn: () => api.get('/tasks?approvalStatus=SUBMITTED_BY_STAFF&limit=10').then(r => r.data).catch(() => ({ data: [] })),
  })

  const { data: attendance } = useQuery({
    queryKey: ['branch-attendance-today'],
    queryFn: () => api.get('/attendance?limit=50').then(r => r.data).catch(() => ({ data: [] })),
  })

  const staff = staffData?.data || []
  const pending = pendingTasks?.data || []
  const todayAttendance = attendance?.data || []
  const presentCount = todayAttendance.filter((a: any) => a.status === 'PRESENT' || a.status === 'REMOTE').length

  usePageHeader(`🏢 ${user?.branch || 'Branch'} Dashboard`, 'Manager view — your branch overview')

  return (
    <div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Staff" value={staff.length} icon="👥" color="sky" mono={false} />
        <KpiCard label="Present Today" value={`${presentCount}/${staff.length}`} icon="✅" color="green" mono={false} />
        <KpiCard label="Pending Approvals" value={pending.length} icon="⏳" color="yellow" mono={false} />
        <KpiCard label="Active Tasks" value="—" icon="📋" color="sky" mono={false} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Pending Approvals */}
        <div className="bg-midnight-card border border-midnight-border rounded-xl">
          <div className="px-5 py-4 border-b border-midnight-border flex items-center justify-between">
            <h3 className="font-sora font-semibold text-sm">⏳ Pending Approvals</h3>
            <Badge label={`${pending.length}`} color="yellow" dot={false} />
          </div>
          {pending.length === 0
            ? <p className="p-5 text-text-muted text-sm">No pending approvals 🎉</p>
            : pending.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3 border-b border-midnight-border last:border-0 hover:bg-midnight-hover">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{t.title}</p>
                  <p className="text-xs text-text-muted">{t.assignedMember?.name || '—'}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => api.post(`/tasks/${t.id}/approve`)}
                    className="text-xs bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg px-2 py-1 hover:bg-green-500/20 transition-colors">
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => api.post(`/tasks/${t.id}/reject`)}
                    className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg px-2 py-1 hover:bg-red-500/20 transition-colors">
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))
          }
        </div>

        {/* Today's Attendance */}
        <div className="bg-midnight-card border border-midnight-border rounded-xl">
          <div className="px-5 py-4 border-b border-midnight-border">
            <h3 className="font-sora font-semibold text-sm">🕐 Today's Attendance</h3>
          </div>
          {todayAttendance.length === 0
            ? <p className="p-5 text-text-muted text-sm">No records yet today.</p>
            : todayAttendance.slice(0, 8).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3 border-b border-midnight-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-text-primary">{a.name}</p>
                  <p className="text-xs text-text-muted">{a.checkInTime ? `In: ${new Date(a.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : 'Not checked in'}</p>
                </div>
                <Badge label={a.status} color={statusColor(a.status.toLowerCase()) as any} />
              </div>
            ))
          }
        </div>
      </div>

      {/* Staff List */}
      <div className="mt-4 bg-midnight-card border border-midnight-border rounded-xl">
        <div className="px-5 py-4 border-b border-midnight-border">
          <h3 className="font-sora font-semibold text-sm">👥 Branch Staff</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#0B1528]">
              {['Name', 'Role', 'Skill', 'Rating', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {staff.map((s: any) => (
                <tr key={s.id} className="border-t border-midnight-border hover:bg-midnight-hover">
                  <td className="px-4 py-3 font-medium text-text-primary">{s.name}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{s.systemRole.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{s.primarySkill || '—'}</td>
                  <td className="px-4 py-3 font-mono text-sky-400 text-xs">{s.averageTaskRating ? `${s.averageTaskRating}/10` : '—'}</td>
                  <td className="px-4 py-3"><Badge label={s.status} color={s.status === 'ACTIVE' ? 'green' : 'gray'} /></td>
                </tr>
              ))}
              {staff.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">No staff in this branch.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

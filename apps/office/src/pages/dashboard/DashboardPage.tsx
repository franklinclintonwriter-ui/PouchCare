import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { KpiCard } from '@/components/ui/KpiCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useUiStore } from '@/stores/uiStore'
import { statusColor, formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { format } from 'date-fns'
import { usePageHeader } from '@/hooks/usePageHeader'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { openSlideOver } = useUiStore()
  const today = format(new Date(), 'EEEE, MMMM d')

  usePageHeader(`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user?.name?.split(' ')[0] || ''} 👋`, `${today} · ${user?.branch || 'Remote'}`)

  const { data: tasks } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => api.get('/tasks?limit=5').then((r) => r.data).catch(() => ({ data: [] })),
  })

  const { data: attendance } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => api.get('/attendance/today').then((r) => r.data.data).catch(() => null),
  })

  const isCheckedIn = attendance?.checkInTime && !attendance?.checkOutTime

  return (
    <div>

      {/* Action Strip */}
      <div className="flex gap-3 mb-6">
        <Button
          variant={isCheckedIn ? 'danger' : 'primary'}
          onClick={() => api.post(isCheckedIn ? '/attendance/checkout' : '/attendance/checkin')}>
          {isCheckedIn ? '⏹ Check Out' : '▶ Check In'}
        </Button>
        <Button variant="ghost" onClick={() => openSlideOver(
          <div className="p-4"><h3 className="font-sora font-semibold text-lg mb-3">Submit Daily Report</h3>
            <p className="text-text-muted text-sm">Report form — connect to POST /reports/daily</p></div>
        )}>📝 Submit Report</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Active Tasks" value="—" icon="✅" color="sky" />
        <KpiCard label="Due Today" value="—" icon="⏰" color="yellow" />
        <KpiCard label="CEO Rating" value="—" icon="⭐" color="green" />
        <KpiCard label="Leave Balance" value="—" icon="🌴" color="sky" />
      </div>

      {/* My Tasks */}
      <div className="bg-midnight-card border border-midnight-border rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-midnight-border">
          <h3 className="font-sora font-semibold text-sm">Active Tasks</h3>
          <a href="/tasks" className="text-xs text-sky-500 hover:underline">View all →</a>
        </div>
        {(tasks?.data || []).length === 0
          ? <div className="py-12 text-center text-text-muted text-sm">No tasks assigned 🎉</div>
          : (tasks?.data || []).map((t: any) => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-4 border-b border-midnight-border last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{t.title}</p>
                <p className="text-xs text-text-muted">{t.deadline ? `Due ${formatDate(t.deadline)}` : 'No deadline'}</p>
              </div>
              <Badge label={t.approvalStatus} color={statusColor(t.approvalStatus) as any} />
            </div>
          ))
        }
      </div>
    </div>
  )
}

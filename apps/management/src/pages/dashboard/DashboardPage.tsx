import { useQuery } from '@tanstack/react-query'
import { KpiCard } from '@/components/ui/KpiCard'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, statusColor } from '@/lib/utils'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { usePageHeader } from '@/hooks/usePageHeader'

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['dashboard-health'],
    queryFn: () => api.get('/analytics/health').then(r => r.data.data),
    staleTime: 60000,
  })

  const { data: revenue } = useQuery({
    queryKey: ['dashboard-revenue'],
    queryFn: () => api.get('/analytics/revenue').then(r => r.data.data),
    staleTime: 120000,
  })

  const { data: pendingTasks } = useQuery({
    queryKey: ['pending-tasks'],
    queryFn: () => api.get('/tasks?approvalStatus=SUBMITTED&limit=5').then(r => r.data).catch(() => ({ data: [] })),
  })

  const { data: staffData } = useQuery({
    queryKey: ['dashboard-staff'],
    queryFn: () => api.get('/staff/members?limit=1').then(r => r.data).catch(() => null),
    staleTime: 120000,
  })

  const revenueChartData = revenue?.monthly?.slice(-6).map((r: any) => ({
    month: r.month,
    revenue: r.totalRevenueUsd,
    expenses: r.totalExpensesUsd || 0,
  })) || []

  usePageHeader(
    `Welcome back, ${user?.name?.split(' ')[0] || 'CEO'} 👋`,
    'Company overview — live data'
  )

  return (
    <div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {healthLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : <>
            <KpiCard
              label="Revenue MTD"
              value={formatCurrency(revenue?.currentMonth?.totalRevenueUsd || 0)}
              change={revenue?.growthRate}
              icon="💰"
              color="sky"
            />
            <KpiCard
              label="Health Score"
              value={`${health?.total || 0} / 100`}
              change={health?.total >= 80 ? 1 : -1}
              icon="❤️"
              color={health?.total >= 80 ? 'green' : health?.total >= 60 ? 'yellow' : 'red'}
            />
            <KpiCard
              label="Active Staff"
              value={staffData?.meta?.total || '—'}
              icon="👥"
              color="green"
            />
            <KpiCard
              label="Pending Approvals"
              value={pendingTasks?.meta?.total || 0}
              icon="📋"
              color="yellow"
            />
          </>
        }
      </div>

      {/* Charts + Approval Queue */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueChartData} />
        </div>
        <div className="bg-midnight-card border border-midnight-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sora font-semibold text-sm">Pending Approvals</h3>
            {(pendingTasks?.meta?.total || 0) > 0 && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                {pendingTasks.meta.total}
              </span>
            )}
          </div>
          {(pendingTasks?.data || []).length === 0
            ? <p className="text-text-muted text-xs">No pending approvals 🎉</p>
            : (pendingTasks?.data || []).slice(0, 5).map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-midnight-border last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{t.title}</p>
                  <p className="text-[11px] text-text-muted">{t.assignedMember?.name || '—'}</p>
                </div>
                <Badge label={t.approvalStatus} color={statusColor(t.approvalStatus) as any} />
              </div>
            ))
          }
        </div>
      </div>

      {/* Health Score Breakdown */}
      {health && (
        <div className="bg-midnight-card border border-midnight-border rounded-xl p-5">
          <h3 className="font-sora font-semibold text-sm mb-4">Health Score Breakdown</h3>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Revenue', value: health.revenue },
              { label: 'Tasks', value: health.tasks },
              { label: 'Attendance', value: health.attendance },
              { label: 'Clients', value: health.clientSatisfaction },
              { label: 'Pipeline', value: health.pipeline },
              { label: 'No Blockers', value: health.noBlockers },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className={`text-2xl font-bold font-mono ${item.value >= 80 ? 'text-green-400' : item.value >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {item.value}
                </div>
                <div className="text-[11px] text-text-muted mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

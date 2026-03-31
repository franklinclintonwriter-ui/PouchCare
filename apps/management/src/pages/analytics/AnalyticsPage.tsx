import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { KpiCard } from '@/components/ui/KpiCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'
import { useState } from 'react'
import { usePageHeader } from '@/hooks/usePageHeader'

const TABS = ['Overview', 'Revenue', 'Staff', 'Clients', 'Leaderboard', 'Forecast']
const TT_STYLE = { background: '#111827', border: '1px solid #1E2A3D', borderRadius: 10, fontSize: 12, color: '#F1F5F9' }

export default function AnalyticsPage() {
  const [tab, setTab] = useState('Overview')

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/analytics/health').then(r => r.data.data).catch(() => null),
    refetchInterval: 60000,
  })

  const { data: revenue } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: () => api.get('/analytics/revenue').then(r => r.data.data).catch(() => ({ data: [], summary: {} })),
  })

  const { data: staffData } = useQuery({
    queryKey: ['staff-analytics'],
    queryFn: () => api.get('/analytics/staff').then(r => r.data.data).catch(() => null),
  })

  const { data: clientData } = useQuery({
    queryKey: ['client-analytics'],
    queryFn: () => api.get('/analytics/clients').then(r => r.data.data).catch(() => null),
  })

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard-analytics'],
    queryFn: () => api.get('/analytics/leaderboard').then(r => r.data.data).catch(() => null),
  })

  const { data: forecast } = useQuery({
    queryKey: ['forecast'],
    queryFn: () => api.get('/analytics/forecast').then(r => r.data.data).catch(() => null),
  })

  const scoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : 'text-red-400'

  usePageHeader('📈 Analytics', 'Company intelligence dashboard')

  return (
    <div>

      <div className="flex gap-1 mb-6 border-b border-midnight-border overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px flex-shrink-0 ${tab === t ? 'border-sky-500 text-sky-500' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'Overview' && (
        <div className="space-y-5">
          {healthLoading ? <Skeleton className="h-40 rounded-xl" /> : health && (
            <div className="bg-midnight-card border border-sky-500/30 rounded-xl p-6 border-l-4 border-l-sky-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-sora font-semibold">🏥 Company Health Score</h3>
                <span className={`font-mono text-4xl font-bold ${scoreColor(health.total)}`}>{health.total}<span className="text-base text-text-muted">/100</span></span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { l: 'Tasks', v: health.breakdown?.tasks },
                  { l: 'Attendance', v: health.breakdown?.attendance },
                  { l: 'Pipeline', v: health.breakdown?.pipeline },
                  { l: 'Clients', v: health.breakdown?.clients },
                ].map(s => (
                  <div key={s.l} className="text-center">
                    <div className="h-1.5 bg-midnight-border rounded-full mb-2 overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${s.v || 0}%` }} />
                    </div>
                    <p className={`font-mono font-bold ${scoreColor(s.v || 0)}`}>{s.v || 0}%</p>
                    <p className="text-xs text-text-muted">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Active Staff" value={staffData?.active || '—'} icon="👥" color="sky" mono={false} />
            <KpiCard label="Active Clients" value={clientData?.active || '—'} icon="🌐" color="green" mono={false} />
            <KpiCard label="New Clients MTD" value={clientData?.newThisMonth || '—'} icon="✨" color="yellow" mono={false} />
            <KpiCard label="On Leave" value={staffData?.onLeave || '—'} icon="🌴" color="red" mono={false} />
          </div>
        </div>
      )}

      {/* REVENUE */}
      {tab === 'Revenue' && (
        <div className="space-y-5">
          {revenue && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <KpiCard label="Total Revenue" value={formatCurrency(revenue.summary?.totalRevenue || 0)} icon="💰" color="sky" mono={false} />
                <KpiCard label="Expenses" value={formatCurrency(revenue.summary?.totalExpenses || 0)} icon="💸" color="red" mono={false} />
                <KpiCard label="Net Profit" value={formatCurrency(revenue.summary?.netProfit || 0)} icon="📈" color="green" mono={false} />
              </div>
              <div className="bg-midnight-card border border-midnight-border rounded-xl p-5">
                <h3 className="font-sora font-semibold text-sm mb-4">Monthly Revenue vs Expenses</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenue.data || []}>
                    <defs>
                      <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} /><stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} /></linearGradient>
                      <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#EF4444" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3D" />
                    <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: any) => [`$${v?.toLocaleString()}`, '']} />
                    <Area type="monotone" dataKey="totalRevenueUsd" stroke="#0EA5E9" strokeWidth={2} fill="url(#revG)" name="Revenue" />
                    <Area type="monotone" dataKey="totalExpenses" stroke="#EF4444" strokeWidth={2} fill="url(#expG)" name="Expenses" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* STAFF */}
      {tab === 'Staff' && staffData && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <KpiCard label="Total Members" value={staffData.total} icon="👥" color="sky" mono={false} />
            <KpiCard label="Active" value={staffData.active} icon="✅" color="green" mono={false} />
            <KpiCard label="On Leave" value={staffData.onLeave} icon="🌴" color="yellow" mono={false} />
          </div>
          <div className="bg-midnight-card border border-midnight-border rounded-xl p-5">
            <h3 className="font-sora font-semibold text-sm mb-4">Top Rated Staff</h3>
            {(staffData.topRated || []).map((s: any, i: number) => (
              <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-midnight-border last:border-0">
                <span className="font-mono text-text-muted text-xs w-5">#{i+1}</span>
                <div className="flex-1"><p className="text-sm font-medium text-text-primary">{s.name}</p><p className="text-xs text-text-muted">{s.branch} · {s.tasksCompleted} tasks</p></div>
                <span className="font-mono font-bold text-sky-400">{s.averageTaskRating}/10</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CLIENTS */}
      {tab === 'Clients' && clientData && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <KpiCard label="Total Clients" value={clientData.total} icon="🌐" color="sky" mono={false} />
            <KpiCard label="Active" value={clientData.active} icon="✅" color="green" mono={false} />
            <KpiCard label="New This Month" value={clientData.newThisMonth} icon="✨" color="yellow" mono={false} />
          </div>
          <div className="bg-midnight-card border border-midnight-border rounded-xl p-5">
            <h3 className="font-sora font-semibold text-sm mb-4">Top Spenders</h3>
            {(clientData.topSpenders || []).map((c: any, i: number) => (
              <div key={c.id} className="flex items-center py-2.5 border-b border-midnight-border last:border-0">
                <span className="font-mono text-text-muted text-xs w-5 flex-shrink-0">#{i+1}</span>
                <div className="flex-1 min-w-0 ml-2"><p className="text-sm font-medium text-text-primary truncate">{c.fullName}</p><p className="text-xs text-text-muted">{c.country} · {c.totalOrders} orders</p></div>
                <span className="font-mono font-bold text-green-400 flex-shrink-0">{formatCurrency(c.totalSpent)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEADERBOARD */}
      {tab === 'Leaderboard' && leaderboard && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-midnight-card border border-midnight-border rounded-xl p-5">
            <h3 className="font-sora font-semibold text-sm mb-4">🏆 Top Staff</h3>
            {(leaderboard.staff || []).map((s: any, i: number) => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-midnight-border last:border-0">
                <span className="text-lg">{i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}</span>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-text-primary truncate">{s.name}</p><p className="text-xs text-text-muted">{s.branch}</p></div>
                <span className="font-mono font-bold text-sky-400">{s.averageTaskRating}/10</span>
              </div>
            ))}
          </div>
          <div className="bg-midnight-card border border-midnight-border rounded-xl p-5">
            <h3 className="font-sora font-semibold text-sm mb-4">💰 Top Referrers</h3>
            {(leaderboard.referrers || []).map((r: any, i: number) => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-midnight-border last:border-0">
                <span className="font-mono text-text-muted text-xs w-5">#{i+1}</span>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-text-primary">Client #{i+1}</p><p className="text-xs text-text-muted">{r.country} · {r.referrals} referrals</p></div>
                <span className="font-mono font-bold text-green-400">{formatCurrency(r.totalCommissionEarned)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORECAST */}
      {tab === 'Forecast' && forecast && (
        <div className="space-y-4">
          <div className="bg-midnight-card border border-sky-500/20 rounded-xl p-5 border-l-4 border-l-sky-500">
            <h3 className="font-sora font-semibold text-sm mb-1">3-Month Revenue Forecast</h3>
            <p className="text-xs text-text-muted mb-4">Based on {forecast.basis?.months} months avg of {formatCurrency(forecast.basis?.avgRevenue)} · 5% growth model</p>
            <div className="grid grid-cols-3 gap-4">
              {(forecast.forecast || []).map((f: any) => (
                <div key={`${f.month}${f.year}`} className="bg-midnight border border-midnight-border rounded-xl p-4 text-center">
                  <p className="text-xs text-text-muted mb-1">{f.month} {f.year}</p>
                  <p className="font-mono font-bold text-xl text-sky-400">{formatCurrency(f.projected)}</p>
                  <p className="text-[10px] text-text-muted mt-1">{formatCurrency(f.low)} – {formatCurrency(f.high)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

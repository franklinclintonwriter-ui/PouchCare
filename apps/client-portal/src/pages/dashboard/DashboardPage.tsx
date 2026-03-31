import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { KpiCard } from '@/components/ui/KpiCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency, formatDate, statusColor } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: me } = useQuery({ queryKey: ['portal-me'], queryFn: () => api.get('/portal/me').then(r => r.data.data) })
  const { data: orders } = useQuery({ queryKey: ['recent-orders'], queryFn: () => api.get('/portal/orders?limit=5').then(r => r.data).catch(() => ({ data: [] })) })
  const { data: commSummary } = useQuery({ queryKey: ['commission-summary'], queryFn: () => api.get('/portal/commissions/summary').then(r => r.data.data).catch(() => null) })

  const greeting = new Date().getHours() < 12 ? 'morning' : 'afternoon'
  const name = user?.fullName?.split(' ')[0] || 'there'

  usePageHeader(`Good ${greeting}, ${name} 👋`, "Here's your account overview")

  return (
    <div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Wallet Balance" value={formatCurrency(me?.walletBalance || 0)} icon="💰" color="sky" mono={false} />
        <KpiCard label="Total Orders" value={me?.totalOrders || 0} icon="📦" color="green" mono={false} />
        <KpiCard label="Commission Earned" value={formatCurrency(me?.totalCommissionEarned || 0)} icon="💸" color="yellow" mono={false} />
        <KpiCard label="Referrals" value={me?.totalReferrals || 0} icon="🔗" color="sky" mono={false} />
      </div>

      {(commSummary?.available || 0) >= 50 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-green-400 font-semibold text-sm">💰 Commission Ready to Withdraw</p>
            <p className="font-mono font-bold text-xl text-green-400 mt-0.5">{formatCurrency(commSummary.available)}</p>
          </div>
          <Link to="/referrals"><Button size="sm" variant="ghost">Withdraw →</Button></Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link to="/services" className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 hover:bg-sky-500/15 transition-all">
          <span className="text-2xl block mb-2">🛍️</span>
          <p className="font-semibold text-text-primary text-sm">Browse Services</p>
          <p className="text-xs text-text-muted">SEO, Web Dev, Design & more</p>
        </Link>
        <Link to="/wallet" className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 hover:bg-green-500/15 transition-all">
          <span className="text-2xl block mb-2">💳</span>
          <p className="font-semibold text-text-primary text-sm">Add Funds</p>
          <p className="text-xs text-text-muted">Payoneer, USDT, Binance</p>
        </Link>
      </div>

      <div className="bg-midnight-card border border-midnight-border rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-midnight-border">
          <h3 className="font-sora font-semibold text-sm">Recent Orders</h3>
          <Link to="/orders" className="text-xs text-sky-500 hover:underline">View all →</Link>
        </div>
        {(orders?.data || []).length === 0
          ? <div className="py-10 text-center text-text-muted text-sm">No orders yet. <Link to="/services" className="text-sky-500 hover:underline">Browse services →</Link></div>
          : (orders?.data || []).map((o: any) => (
            <div key={o.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-midnight-border last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{o.serviceName}</p>
                <p className="text-xs text-text-muted">PO-{o.orderId} · {formatDate(o.orderDate)}</p>
              </div>
              <div className="text-right flex-shrink-0 flex items-center gap-2">
                <p className="font-mono text-sm font-bold text-sky-400">{formatCurrency(o.amountUsd)}</p>
                <Badge label={o.status} color={statusColor(o.status.toLowerCase()) as any} />
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

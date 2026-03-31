import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/ui/KpiCard'
import { useUiStore } from '@/stores/uiStore'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate, statusColor } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

const TABS = ['Members', 'Orders', 'Commissions', 'Payouts', 'Deposits']

function MemberDetail({ member, onClose }: { member: any; onClose: () => void }) {
  const toast = useToast(); const qc = useQueryClient()
  const suspend = useMutation({
    mutationFn: () => api.put(`/admin/portal/members/${member.id}/status`, { status: member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['portal-members'] }); onClose() },
  })
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="font-sora font-semibold text-lg">{member.fullName}</h2><p className="text-xs text-text-muted">{member.email} · {member.country}</p></div>
        <button onClick={onClose} className="text-text-muted text-2xl">×</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          ['Wallet', formatCurrency(member.walletBalance)], ['Total Spent', formatCurrency(member.totalSpent)],
          ['Total Orders', member.totalOrders], ['Referrals', member.totalReferrals],
          ['Commission Earned', formatCurrency(member.totalCommissionEarned)], ['Referral Code', member.referralCode],
          ['Email Verified', member.emailVerified ? '✅ Yes' : '❌ No'], ['Registered', formatDate(member.registrationDate)],
        ].map(([l, v]) => (
          <div key={String(l)} className="bg-midnight rounded-lg p-3">
            <p className="text-xs text-text-muted mb-0.5">{l}</p>
            <p className="text-sm font-medium text-text-primary">{String(v)}</p>
          </div>
        ))}
      </div>
      <Button variant={member.status === 'ACTIVE' ? 'danger' : 'primary'} className="w-full" onClick={() => suspend.mutate()} loading={suspend.isPending}>
        {member.status === 'ACTIVE' ? 'Suspend Member' : 'Reactivate Member'}
      </Button>
    </div>
  )
}

function ProcessPayoutForm({ payout, onClose }: { payout: any; onClose: () => void }) {
  const toast = useToast(); const qc = useQueryClient()
  const [txId, setTxId] = useState('')
  const process = useMutation({
    mutationFn: (status: string) => api.put(`/portal/commissions/${payout.id}/process`, { status, transactionId: txId }),
    onSuccess: () => { toast.success('Payout processed'); qc.invalidateQueries({ queryKey: ['portal-payouts'] }); onClose() },
  })
  return (
    <div>
      <div className="flex items-center justify-between mb-5"><h2 className="font-sora font-semibold">Process Payout</h2><button onClick={onClose} className="text-text-muted text-2xl">×</button></div>
      <div className="space-y-3 mb-5">
        {[['Member', payout.memberName], ['Amount', formatCurrency(payout.amountUsd)], ['Method', payout.paymentMethod], ['Details', payout.paymentDetails]].map(([l, v]) => (
          <div key={String(l)} className="flex justify-between text-sm"><span className="text-text-muted">{l}</span><span className="text-text-primary font-medium">{String(v)}</span></div>
        ))}
      </div>
      <div className="mb-4">
        <label className="text-xs text-text-muted uppercase tracking-wide block mb-1.5">Transaction ID</label>
        <input value={txId} onChange={e => setTxId(e.target.value)} placeholder="TX ID from payment platform"
          className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 placeholder:text-text-muted" />
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => process.mutate('COMPLETED')} loading={process.isPending}>✅ Mark Paid</Button>
        <Button variant="danger" className="flex-1" onClick={() => process.mutate('REJECTED')}>✗ Reject</Button>
      </div>
    </div>
  )
}

export default function PortalPage() {
  const [tab, setTab] = useState('Members')
  const { openSlideOver, closeSlideOver } = useUiStore()

  const { data: members } = useQuery({ queryKey: ['portal-members'], queryFn: () => api.get('/admin/portal/members').then(r => r.data).catch(() => ({ data: [] })) })
  const { data: orders } = useQuery({ queryKey: ['portal-orders-admin'], queryFn: () => api.get('/admin/portal/orders').then(r => r.data).catch(() => ({ data: [] })) })
  const { data: commissions } = useQuery({ queryKey: ['portal-commissions-admin'], queryFn: () => api.get('/admin/portal/commissions').then(r => r.data).catch(() => ({ data: [] })) })
  const { data: payouts } = useQuery({ queryKey: ['portal-payouts'], queryFn: () => api.get('/admin/portal/payouts').then(r => r.data).catch(() => ({ data: [] })) })
  const { data: deposits } = useQuery({ queryKey: ['portal-deposits'], queryFn: () => api.get('/portal/wallet/transactions?type=DEPOSIT&status=Pending').then(r => r.data).catch(() => ({ data: [] })) })

  const pendingPayouts = (payouts?.data || []).length
  const pendingDeposits = (deposits?.data || []).filter((d: any) => d.status === 'Pending').length

  usePageHeader('🌐 Portal Admin', 'Manage clients, orders & commissions')

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard label="Total Members" value={members?.meta?.total || '—'} icon="👤" color="sky" mono={false} />
        <KpiCard label="Total Orders" value={orders?.meta?.total || '—'} icon="📦" color="green" mono={false} />
        <KpiCard label="Pending Payouts" value={pendingPayouts} icon="💸" color={pendingPayouts > 0 ? 'yellow' : 'sky'} mono={false} />
        <KpiCard label="Pending Deposits" value={pendingDeposits} icon="💰" color={pendingDeposits > 0 ? 'yellow' : 'sky'} mono={false} />
      </div>

      <div className="flex gap-1 mb-5 border-b border-midnight-border">
        {TABS.map(t => {
          const badge = t === 'Payouts' && pendingPayouts > 0 ? pendingPayouts : t === 'Deposits' && pendingDeposits > 0 ? pendingDeposits : null
          return (
            <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${tab === t ? 'border-sky-500 text-sky-500' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
              {t}{badge && <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">{badge}</span>}
            </button>
          )
        })}
      </div>

      {/* Members */}
      {tab === 'Members' && (
        <div className="bg-midnight-card border border-midnight-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#0B1528]">{['Name', 'Email', 'Country', 'Wallet', 'Orders', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>)}</tr></thead>
            <tbody>
              {(members?.data || []).map((m: any) => (
                <tr key={m.id} onClick={() => openSlideOver(<MemberDetail member={m} onClose={closeSlideOver} />)}
                  className="border-t border-midnight-border hover:bg-midnight-hover cursor-pointer">
                  <td className="px-4 py-3 font-medium text-text-primary">{m.fullName}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{m.email}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{m.country || '—'}</td>
                  <td className="px-4 py-3 font-mono text-sky-400 text-xs font-bold">{formatCurrency(m.walletBalance)}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{m.totalOrders}</td>
                  <td className="px-4 py-3"><Badge label={m.status} color={m.status === 'ACTIVE' ? 'green' : m.status === 'SUSPENDED' ? 'red' : 'yellow'} /></td>
                </tr>
              ))}
              {!(members?.data || []).length && <tr><td colSpan={6} className="py-10 text-center text-text-muted">No members yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders */}
      {tab === 'Orders' && (
        <div className="bg-midnight-card border border-midnight-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#0B1528]">{['Order', 'Member', 'Service', 'Amount', 'Date', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>)}</tr></thead>
            <tbody>
              {(orders?.data || []).map((o: any) => (
                <tr key={o.id} className="border-t border-midnight-border hover:bg-midnight-hover">
                  <td className="px-4 py-3 font-mono text-xs text-sky-400">PO-{o.orderId}</td>
                  <td className="px-4 py-3 text-text-primary text-sm">{o.memberName}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{o.serviceName}</td>
                  <td className="px-4 py-3 font-mono text-green-400 font-bold">{formatCurrency(o.amountUsd)}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{formatDate(o.orderDate)}</td>
                  <td className="px-4 py-3"><Badge label={o.status} color={statusColor(o.status.toLowerCase()) as any} /></td>
                  <td className="px-4 py-3">
                    {o.status === 'Processing' && (
                      <button onClick={() => api.put(`/admin/portal/orders/${o.id}/status`, { status: 'Delivered' })}
                        className="text-xs text-sky-400 hover:underline">Mark Delivered</button>
                    )}
                  </td>
                </tr>
              ))}
              {!(orders?.data || []).length && <tr><td colSpan={7} className="py-10 text-center text-text-muted">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Payouts */}
      {tab === 'Payouts' && (
        <div className="space-y-2">
          {(payouts?.data || []).map((p: any) => (
            <div key={p.id} className="bg-midnight-card border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">{p.memberName}</p>
                <p className="text-xs text-text-muted">{p.paymentMethod} · {p.paymentDetails}</p>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="font-mono font-bold text-sky-400">{formatCurrency(p.amountUsd)}</p>
                  <p className="text-xs text-text-muted">{formatDate(p.requestedDate)}</p>
                </div>
                <Button size="sm" onClick={() => openSlideOver(<ProcessPayoutForm payout={p} onClose={closeSlideOver} />)}>Process</Button>
              </div>
            </div>
          ))}
          {!(payouts?.data || []).length && (
            <div className="text-center py-16 text-text-muted"><span className="text-4xl block mb-3">💸</span><p>No pending payouts 🎉</p></div>
          )}
        </div>
      )}

      {/* Deposits */}
      {tab === 'Deposits' && (
        <div className="space-y-2">
          {(deposits?.data || []).filter((d: any) => d.status === 'Pending').map((d: any) => (
            <div key={d.id} className="bg-midnight-card border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">Deposit Request</p>
                <p className="text-xs text-text-muted">{d.paymentMethod}</p>
              </div>
              <div className="text-right flex items-center gap-3">
                <p className="font-mono font-bold text-green-400">{formatCurrency(d.amountUsd)}</p>
                <Button size="sm" variant="ghost" onClick={() => api.put(`/portal/wallet/deposit/${d.id}/approve`)}>✅ Approve</Button>
              </div>
            </div>
          ))}
          {!(deposits?.data || []).filter((d: any) => d.status === 'Pending').length && (
            <div className="text-center py-16 text-text-muted"><span className="text-4xl block mb-3">💰</span><p>No pending deposits</p></div>
          )}
        </div>
      )}

      {/* Commissions */}
      {tab === 'Commissions' && (
        <div className="bg-midnight-card border border-midnight-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#0B1528]">{['Referrer', 'Order', 'Amount', 'Commission', 'Status', 'Release Date'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>)}</tr></thead>
            <tbody>
              {(commissions?.data || []).map((c: any) => (
                <tr key={c.id} className="border-t border-midnight-border">
                  <td className="px-4 py-3 text-text-primary text-sm">{c.referredMember || '—'}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{c.orderId?.slice(-8) || '—'}</td>
                  <td className="px-4 py-3 font-mono text-green-400">{formatCurrency(c.orderAmount)}</td>
                  <td className="px-4 py-3 font-mono font-bold text-sky-400">{formatCurrency(c.commissionAmount)}</td>
                  <td className="px-4 py-3"><Badge label={c.status} color={c.status === 'AVAILABLE' ? 'green' : c.status === 'PAID_OUT' ? 'sky' : 'yellow'} /></td>
                  <td className="px-4 py-3 text-text-muted text-xs">{c.holdReleaseDate ? formatDate(c.holdReleaseDate) : '—'}</td>
                </tr>
              ))}
              {!(commissions?.data || []).length && <tr><td colSpan={6} className="py-10 text-center text-text-muted">No commissions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { KpiCard } from '@/components/ui/KpiCard'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

const TABS = ['Overview', 'My Referrals', 'Commissions', 'Payouts', 'Leaderboard']

function PayoutForm({ available, onClose }: { available: number; onClose: () => void }) {
  const toast = useToast(); const qc = useQueryClient()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()
  const sub = useMutation({
    mutationFn: (d: any) => api.post('/portal/commissions/payout-request', d),
    onSuccess: () => { toast.success('Payout requested!'); qc.invalidateQueries({ queryKey: ['commission-summary', 'payout-history'] }); onClose() },
    onError: (e: any) => toast.error('Failed', e.response?.data?.error),
  })
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><h2 className="font-sora font-semibold text-lg">💸 Request Payout</h2><button onClick={onClose} className="text-text-muted text-2xl">×</button></div>
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-5">
        <p className="text-xs text-text-muted">Available</p>
        <p className="font-mono font-bold text-2xl text-green-400">{formatCurrency(available)}</p>
        <p className="text-xs text-text-muted mt-1">Min payout: $50</p>
      </div>
      <form onSubmit={handleSubmit((d) => sub.mutate(d))} className="space-y-4">
        <div><label className="text-xs text-text-muted uppercase tracking-wide block mb-1.5">Payment Method</label>
          <select {...register('paymentMethod')} className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer">
            <option value="Payoneer">💼 Payoneer</option>
            <option value="USDT TRC20">🔷 USDT TRC20</option>
            <option value="Binance">🟡 Binance</option>
          </select>
        </div>
        <Input label="Amount (USD, min $50) *" type="number" min={50} placeholder="50" {...register('amountUsd', { required: true, valueAsNumber: true })} />
        <Input label="Payment Details *" placeholder="Email or wallet address" {...register('paymentDetails', { required: true })} />
        <Button type="submit" className="w-full" loading={isSubmitting}>Submit Payout Request</Button>
      </form>
    </div>
  )
}

export default function ReferralsPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState('Overview')
  const [copied, setCopied] = useState(false)
  const { openSlideOver, closeSlideOver } = useUiStore()

  const { data: stats } = useQuery({ queryKey: ['referral-stats'], queryFn: () => api.get('/portal/referrals/stats').then(r => r.data.data).catch(() => null) })
  const { data: referrals } = useQuery({ queryKey: ['my-referrals'], queryFn: () => api.get('/portal/referrals').then(r => r.data).catch(() => ({ data: [] })) })
  const { data: commSummary } = useQuery({ queryKey: ['commission-summary'], queryFn: () => api.get('/portal/commissions/summary').then(r => r.data.data).catch(() => null) })
  const { data: commissions } = useQuery({ queryKey: ['my-commissions'], queryFn: () => api.get('/portal/commissions').then(r => r.data).catch(() => ({ data: [] })) })
  const { data: payouts } = useQuery({ queryKey: ['payout-history'], queryFn: () => api.get('/portal/commissions/payouts').then(r => r.data).catch(() => ({ data: [] })) })
  const { data: lb } = useQuery({ queryKey: ['referral-leaderboard'], queryFn: () => api.get('/portal/referrals/leaderboard').then(r => r.data.data).catch(() => []) })

  const code = user?.referralCode || stats?.referralCode || ''
  const link = `https://pouchcare.com.bd/register?ref=${code}`

  const copy = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  usePageHeader('🔗 Referral Center', 'Earn 20% commission on every referral order')

  return (
    <div>
      <div className="bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-xl p-5 mb-5">
        <p className="text-sm font-semibold mb-3">Your Referral Link</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-midnight border border-midnight-border rounded-lg px-3 py-2.5 text-sm text-text-secondary font-mono truncate">{link}</div>
          <Button size="sm" onClick={copy} variant={copied ? 'secondary' : 'primary'}>{copied ? '✓ Copied!' : 'Copy'}</Button>
        </div>
        <p className="text-xs text-text-muted mt-2">When someone registers & orders, you earn 20% commission (released after 14 days).</p>
      </div>

      <div className="flex gap-1 mb-5 border-b border-midnight-border overflow-x-auto">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px flex-shrink-0 ${tab === t ? 'border-sky-500 text-sky-500' : 'border-transparent text-text-muted hover:text-text-primary'}`}>{t}</button>)}
      </div>

      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Total Referrals" value={stats?.totalReferrals || 0} icon="👥" color="sky" mono={false} />
            <KpiCard label="Total Earned" value={formatCurrency(commSummary?.total || 0)} icon="💰" color="green" mono={false} />
            <KpiCard label="Available" value={formatCurrency(commSummary?.available || 0)} icon="✅" color="sky" mono={false} />
            <KpiCard label="Pending Hold" value={formatCurrency(commSummary?.pending || 0)} icon="⏳" color="yellow" mono={false} />
          </div>
          {(commSummary?.available || 0) >= 50 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
              <div><p className="text-green-400 font-semibold">Ready: {formatCurrency(commSummary.available)}</p><p className="text-xs text-green-300 mt-0.5">Min $50 · 48h processing</p></div>
              <Button size="sm" onClick={() => openSlideOver(<PayoutForm available={commSummary.available} onClose={closeSlideOver} />)}>Request Payout</Button>
            </div>
          )}
        </div>
      )}

      {tab === 'My Referrals' && (
        <div className="space-y-2">
          {(referrals?.data || []).map((r: any) => (
            <div key={r.id} className="bg-midnight-card border border-midnight-border rounded-xl p-4 flex items-center justify-between">
              <div><p className="font-medium text-text-primary">{r.referredName || 'Anonymous'}</p><p className="text-xs text-text-muted">{r.registrationDate ? formatDate(r.registrationDate) : '—'} · {r.totalOrders} orders</p></div>
              <Badge label={r.status} color={r.status === 'Active' ? 'green' : 'gray'} />
            </div>
          ))}
          {!(referrals?.data || []).length && <div className="text-center py-16 text-text-muted"><span className="text-4xl block mb-3">🔗</span><p>No referrals yet. Share your link!</p></div>}
        </div>
      )}

      {tab === 'Commissions' && (
        <div className="space-y-2">
          {(commissions?.data || []).map((c: any) => (
            <div key={c.id} className="bg-midnight-card border border-midnight-border rounded-xl p-4 flex items-center justify-between">
              <div><p className="text-sm font-medium text-text-primary">Commission from {c.referredMember || 'referral'}</p><p className="text-xs text-text-muted">{formatDate(c.createdAt)}{c.holdReleaseDate ? ` · Releases ${formatDate(c.holdReleaseDate)}` : ''}</p></div>
              <div className="text-right"><p className="font-mono font-bold text-sky-400">{formatCurrency(c.commissionAmount)}</p><Badge label={c.status} color={c.status === 'AVAILABLE' ? 'green' : c.status === 'PAID_OUT' ? 'sky' : 'yellow'} /></div>
            </div>
          ))}
          {!(commissions?.data || []).length && <div className="text-center py-12 text-text-muted">No commissions yet.</div>}
        </div>
      )}

      {tab === 'Payouts' && (
        <div>
          <div className="flex justify-end mb-3">
            {(commSummary?.available || 0) >= 50 && <Button size="sm" onClick={() => openSlideOver(<PayoutForm available={commSummary!.available} onClose={closeSlideOver} />)}>+ Request Payout</Button>}
          </div>
          <div className="space-y-2">
            {(payouts?.data || []).map((p: any) => (
              <div key={p.id} className="bg-midnight-card border border-midnight-border rounded-xl p-4 flex items-center justify-between">
                <div><p className="font-medium text-text-primary">{p.paymentMethod}</p><p className="text-xs text-text-muted">{formatDate(p.requestedDate)}</p></div>
                <div className="text-right"><p className="font-mono font-bold text-sky-400">{formatCurrency(p.amountUsd)}</p><Badge label={p.status} color={p.status === 'COMPLETED' ? 'green' : p.status === 'REJECTED' ? 'red' : 'yellow'} /></div>
              </div>
            ))}
            {!(payouts?.data || []).length && <div className="text-center py-12 text-text-muted">No payout history.</div>}
          </div>
        </div>
      )}

      {tab === 'Leaderboard' && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted mb-3">Top referrers (names blurred for privacy)</p>
          {(lb || []).map((r: any) => (
            <div key={r.rank} className="bg-midnight-card border border-midnight-border rounded-xl p-4 flex items-center gap-4">
              <span className="text-xl">{r.rank <= 3 ? ['🥇','🥈','🥉'][r.rank-1] : `#${r.rank}`}</span>
              <div className="flex-1"><p className="text-sm font-medium text-text-primary">{r.name}</p><p className="text-xs text-text-muted">{r.country} · {r.referrals} referrals</p></div>
              <p className="font-mono font-bold text-green-400">{formatCurrency(r.earned)}</p>
            </div>
          ))}
          {!(lb || []).length && <div className="text-center py-12 text-text-muted">No leaderboard data yet.</div>}
        </div>
      )}
    </div>
  )
}

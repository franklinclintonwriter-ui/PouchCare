import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useUiStore } from '@/stores/uiStore'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

const PM = [{ v: 'Payoneer', l: '💼 Payoneer', d: 'Send to: payments@pouchcare.com' }, { v: 'USDT TRC20', l: '🔷 USDT TRC20', d: 'Wallet: TX...' }, { v: 'Binance', l: '🟡 Binance', d: 'ID: 123456789' }]
const TX_I: Record<string, string> = { DEPOSIT:'💰', ORDER_PAYMENT:'📦', COMMISSION_CREDIT:'💸', REFUND:'↩️', PAYOUT:'🏦' }
const TX_C: Record<string, string> = { DEPOSIT:'text-green-400', ORDER_PAYMENT:'text-red-400', COMMISSION_CREDIT:'text-sky-400', PAYOUT:'text-yellow-400' }

function DepositModal({ onClose }: { onClose: () => void }) {
  const toast = useToast(); const qc = useQueryClient()
  const [method, setMethod] = useState('Payoneer')
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()
  const sub = useMutation({
    mutationFn: (d: any) => api.post('/portal/wallet/deposit', { ...d, paymentMethod: method }),
    onSuccess: () => { toast.success('Deposit submitted!', 'Admin verifies within 24h'); qc.invalidateQueries({ queryKey: ['wallet-txs'] }); onClose() },
    onError: (e: any) => toast.error('Failed', e.response?.data?.error),
  })
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><h2 className="font-sora font-semibold text-lg">💳 Add Funds</h2><button onClick={onClose} className="text-text-muted text-2xl">×</button></div>
      <div className="space-y-2 mb-5">
        {PM.map(m => <button key={m.v} onClick={() => setMethod(m.v)} className={`w-full text-left rounded-xl p-4 border transition-all ${method === m.v ? 'border-sky-500 bg-sky-500/10' : 'border-midnight-border hover:border-white/20'}`}><p className="font-medium text-sm text-text-primary">{m.l}</p><p className="text-xs text-text-muted mt-0.5">{m.d}</p></button>)}
      </div>
      <form onSubmit={handleSubmit((d) => sub.mutate(d))} className="space-y-4">
        <Input label="Amount (USD) *" type="number" min={10} step={1} placeholder="100" {...register('amountUsd', { required: true, valueAsNumber: true })} />
        <Input label="Proof URL (screenshot)" placeholder="https://..." {...register('proofUrl')} />
        <Button type="submit" className="w-full" loading={isSubmitting}>Submit Deposit Request</Button>
      </form>
    </div>
  )
}

export default function WalletPage() {
  const { openSlideOver, closeSlideOver } = useUiStore()
  const [txType, setTxType] = useState('All')

  const { data: wallet } = useQuery({ queryKey: ['wallet-balance'], queryFn: () => api.get('/portal/wallet').then(r => r.data.data) })
  const { data: txs, isLoading } = useQuery({
    queryKey: ['wallet-txs', txType],
    queryFn: () => api.get(`/portal/wallet/transactions${txType !== 'All' ? `?type=${txType}` : ''}`).then(r => r.data).catch(() => ({ data: [] })),
  })

  usePageHeader('💰 Wallet', undefined,
    <Button size="sm" onClick={() => openSlideOver(<DepositModal onClose={closeSlideOver} />)}>+ Add Funds</Button>
  )

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <div className="bg-midnight-card border border-sky-500/30 rounded-xl p-5 border-l-4 border-l-sky-500">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Available Balance</p>
          <p className="font-mono font-bold text-3xl text-sky-400">{formatCurrency(wallet?.walletBalance || 0)}</p>
        </div>
        <div className="bg-midnight-card border border-midnight-border rounded-xl p-5">
          <p className="text-xs text-text-muted uppercase mb-1">Total Deposited</p>
          <p className="font-mono font-bold text-xl text-green-400">{formatCurrency(wallet?.totalDeposited || 0)}</p>
        </div>
        <div className="bg-midnight-card border border-midnight-border rounded-xl p-5">
          <p className="text-xs text-text-muted uppercase mb-1">Total Spent</p>
          <p className="font-mono font-bold text-xl text-red-400">{formatCurrency(wallet?.totalSpent || 0)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-sora font-semibold text-sm">Transaction History</h3>
        <div className="flex gap-1.5 flex-wrap">
          {['All','DEPOSIT','ORDER_PAYMENT','COMMISSION_CREDIT','PAYOUT'].map(t => (
            <button key={t} onClick={() => setTxType(t)} className={`px-2.5 py-1 rounded text-xs border transition-all ${txType === t ? 'bg-sky-500 text-white border-sky-500' : 'text-text-muted border-midnight-border hover:border-white/20'}`}>
              {t === 'All' ? 'All' : t.replace(/_/g,' ')}
            </button>
          ))}
        </div>
      </div>
      {isLoading
        ? <div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-14 rounded-xl"/>)}</div>
        : <div className="bg-midnight-card border border-midnight-border rounded-xl divide-y divide-midnight-border">
          {(txs?.data||[]).map((tx:any)=>(
            <div key={tx.id} className="flex items-center gap-4 p-4">
              <span className="text-xl flex-shrink-0">{TX_I[tx.type]||'💫'}</span>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-text-primary">{tx.type.replace(/_/g,' ')}</p><p className="text-xs text-text-muted">{formatDate(tx.txDate)}</p></div>
              <div className="text-right flex-shrink-0">
                <p className={`font-mono font-bold text-sm ${TX_C[tx.type]||'text-text-primary'}`}>{tx.amountUsd>0?'+':''}{formatCurrency(tx.amountUsd)}</p>
                <p className="text-xs text-text-muted font-mono">Bal: {formatCurrency(tx.balanceAfter)}</p>
              </div>
              <Badge label={tx.status} color={tx.status==='Confirmed'?'green':tx.status==='Pending'?'yellow':'red'} />
            </div>
          ))}
          {!(txs?.data||[]).length&&<div className="py-12 text-center text-text-muted text-sm">No transactions yet.</div>}
        </div>
      }
    </div>
  )
}

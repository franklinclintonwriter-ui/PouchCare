import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/useToast'
import { usePageHeader } from '@/hooks/usePageHeader'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user, updateBalance } = useAuthStore()
  const toast = useToast()
  const [qty, setQty] = useState(1)
  const [req, setReq] = useState('')

  const { data: svc, isLoading } = useQuery({ queryKey: ['service', slug], queryFn: () => api.get(`/services/${slug}`).then(r => r.data.data) })
  const { data: me } = useQuery({ queryKey: ['portal-me'], queryFn: () => api.get('/portal/me').then(r => r.data.data) })

  const orderMut = useMutation({
    mutationFn: () => api.post('/portal/orders', { serviceId: svc.id, quantity: qty, requirements: req }),
    onSuccess: (res) => { updateBalance((me?.walletBalance||0) - svc.basePriceUsd*qty); toast.success('Order placed!', `PO-${res.data.data.orderId} submitted`); navigate('/orders') },
    onError: (e: any) => toast.error('Failed', e.response?.data?.error),
  })

  usePageHeader(isLoading ? 'Loading...' : svc ? `${svc.icon || '⚡'} ${svc.name}` : 'Service Details', svc?.category)

  if (isLoading) return <div className="space-y-4">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-20 rounded-xl"/>)}</div>
  if (!svc) return <p className="text-center py-16 text-text-muted">Service not found.</p>

  const total = svc.basePriceUsd * qty
  const canAfford = (me?.walletBalance || 0) >= total

  return (
    <div>
      <button onClick={() => navigate('/services')} className="text-xs text-text-muted hover:text-sky-400 mb-4 flex items-center gap-1">← Back to services</button>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-midnight-card border border-midnight-border rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <span className="text-4xl">{svc.icon || '⚡'}</span>
              <div>
                <h2 className="font-sora text-xl font-bold">{svc.name}</h2>
                <p className="text-sm text-text-muted">{svc.category} · {svc.turnaroundDays ? `${svc.turnaroundDays}d delivery` : 'Custom timeline'}</p>
              </div>
            </div>
            <p className="text-text-secondary leading-relaxed">{svc.fullDescription || svc.shortDescription || 'Professional service delivery with guaranteed quality.'}</p>
          </div>
          <div className="bg-midnight-card border border-midnight-border rounded-xl p-5">
            <h3 className="font-sora font-semibold text-sm mb-3">📝 Your Requirements</h3>
            <textarea value={req} onChange={e => setReq(e.target.value)} rows={4}
              placeholder="Describe in detail: website URL, keywords, target audience, specific instructions..."
              className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2.5 text-sm outline-none focus:border-sky-500 resize-none placeholder:text-text-muted" />
          </div>
        </div>
        <div>
          <div className="bg-midnight-card border border-midnight-border rounded-xl p-5 sticky top-6">
            <h3 className="font-sora font-semibold mb-4">📦 Place Order</h3>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm"><span className="text-text-muted">Price per unit</span><span className="font-mono font-bold">{formatCurrency(svc.basePriceUsd)}</span></div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">Quantity</span>
                <div className="flex items-center gap-2 bg-midnight border border-midnight-border rounded-lg p-1">
                  <button onClick={() => setQty(Math.max(1, qty-1))} className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-text-primary">−</button>
                  <span className="font-mono text-sm w-6 text-center">{qty}</span>
                  <button onClick={() => setQty(qty+1)} className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-text-primary">+</button>
                </div>
              </div>
              <div className="border-t border-midnight-border pt-3 flex justify-between">
                <span className="text-text-muted text-sm">Total</span>
                <span className="font-mono font-bold text-xl text-sky-400">{formatCurrency(total)}</span>
              </div>
            </div>
            <div className={`rounded-lg p-3 mb-4 text-sm ${canAfford ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <div className="flex justify-between">
                <span className={canAfford ? 'text-green-400' : 'text-red-400'}>Wallet Balance</span>
                <span className={`font-mono font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(me?.walletBalance || 0)}</span>
              </div>
              {!canAfford && <p className="text-xs text-red-400 mt-1">Insufficient balance. <button onClick={() => navigate('/wallet')} className="underline">Add funds →</button></p>}
            </div>
            <Button className="w-full" onClick={() => orderMut.mutate()} loading={orderMut.isPending} disabled={!canAfford || !req.trim()}>
              {!req.trim() ? 'Add requirements first' : !canAfford ? 'Insufficient Balance' : `Order · ${formatCurrency(total)}`}
            </Button>
            <p className="text-xs text-text-muted text-center mt-2">Deducted from wallet immediately</p>
          </div>
        </div>
      </div>
    </div>
  )
}

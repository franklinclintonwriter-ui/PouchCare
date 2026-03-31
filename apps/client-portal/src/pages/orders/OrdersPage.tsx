import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useUiStore } from '@/stores/uiStore'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate, statusColor } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

function OrderDetail({ order, onClose }: { order: any; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const toast = useToast(); const qc = useQueryClient()
  const revMut = useMutation({
    mutationFn: () => api.post(`/portal/orders/${order.id}/revision`, { reason }),
    onSuccess: () => { toast.success('Revision requested'); qc.invalidateQueries({ queryKey: ['my-orders'] }); onClose() },
    onError: (e: any) => toast.error('Failed', e.response?.data?.error),
  })
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="font-sora font-semibold text-lg">{order.serviceName}</h2><p className="text-xs text-text-muted font-mono">PO-{order.orderId}</p></div>
        <button onClick={onClose} className="text-text-muted text-2xl">×</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[['Amount', formatCurrency(order.amountUsd)], ['Quantity', order.quantity], ['Ordered', formatDate(order.orderDate)], ['Deadline', order.deadline ? formatDate(order.deadline) : '—'], ['Revisions', order.revisionCount]].map(([l, v]) => (
          <div key={String(l)} className="bg-midnight rounded-lg p-3"><p className="text-xs text-text-muted mb-0.5">{l}</p><p className="text-sm font-medium text-text-primary">{String(v)}</p></div>
        ))}
      </div>
      {order.deliveryLink && (
        <a href={order.deliveryLink} target="_blank" rel="noopener noreferrer" className="block bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4 hover:bg-green-500/15 transition-all">
          <p className="text-green-400 font-semibold text-sm">✅ Delivery Ready</p>
          <p className="text-xs text-green-300 mt-0.5">Click to view delivered work →</p>
        </a>
      )}
      {order.status === 'Delivered' && (
        <div className="border-t border-midnight-border pt-4">
          <h3 className="font-sora font-semibold text-sm mb-3">Request Revision</h3>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="What needs to be changed?" className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 resize-none placeholder:text-text-muted mb-3" />
          <Button className="w-full" onClick={() => revMut.mutate()} loading={revMut.isPending} disabled={!reason.trim()}>Submit Revision</Button>
        </div>
      )}
    </div>
  )
}

const STATUSES = ['All', 'Pending', 'Processing', 'Delivered', 'Completed', 'Revision Requested', 'Cancelled']

export default function OrdersPage() {
  const [status, setStatus] = useState('All')
  const { openSlideOver, closeSlideOver } = useUiStore()

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', status],
    queryFn: () => api.get(`/portal/orders${status !== 'All' ? `?status=${status}` : ''}`).then(r => r.data).catch(() => ({ data: [], meta: { total: 0 } })),
  })

  usePageHeader('📦 My Orders', `${data?.meta?.total || 0} total`)

  return (
    <div>
      <div className="flex gap-1.5 flex-wrap mb-5">
        {STATUSES.map(s => <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${status === s ? 'bg-sky-500 text-white border-sky-500' : 'text-text-muted border-midnight-border hover:border-white/20'}`}>{s}</button>)}
      </div>
      {isLoading
        ? <div className="space-y-2">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-20 rounded-xl"/>)}</div>
        : <div className="space-y-2">
          {(data?.data || []).map((o: any) => (
            <div key={o.id} onClick={() => openSlideOver(<OrderDetail order={o} onClose={closeSlideOver} />)}
              className="bg-midnight-card border border-midnight-border rounded-xl p-4 cursor-pointer hover:border-sky-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{o.serviceName}</p>
                  <p className="text-xs text-text-muted mt-0.5">PO-{o.orderId} · {formatDate(o.orderDate)} · Qty {o.quantity}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono font-bold text-sky-400">{formatCurrency(o.amountUsd)}</p>
                  <Badge label={o.status} color={statusColor(o.status.toLowerCase()) as any} />
                </div>
              </div>
              {o.deliveryLink && <p className="text-xs text-green-400 mt-2">✅ Delivery ready — click to view</p>}
            </div>
          ))}
          {!(data?.data || []).length && <div className="text-center py-16 text-text-muted"><span className="text-4xl block mb-3">📦</span><p>No orders yet.</p><Link to="/services" className="text-sky-500 hover:underline text-sm mt-2 block">Browse services →</Link></div>}
        </div>
      }
    </div>
  )
}

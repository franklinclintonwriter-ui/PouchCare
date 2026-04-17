import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, RotateCcw, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import {
  useAdminOrder,
  useAdvanceOrder,
  useRefundOrder,
  ORDER_STATUS_DAG,
  type AdminOrderStatus,
} from '@/api/admin-orders'
import { PageTransition } from '@/components/ui/PageTransition'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useCurrency } from '@/hooks/useCurrency'
import { usePermission } from '@/hooks/usePermission'

const STATUS_RAIL: AdminOrderStatus[] = ['PENDING', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED']

export default function OrderDetail() {
  const params = useParams<{ id: string }>()
  const id = decodeURIComponent(params.id ?? '')
  const { data, isLoading } = useAdminOrder(id)
  const advance = useAdvanceOrder()
  const refund = useRefundOrder()
  const { formatCurrency } = useCurrency()
  const perm = usePermission()
  const canRefund = perm.isCEO || perm.isOps

  const [refundOpen, setRefundOpen] = useState(false)
  const [refundForm, setRefundForm] = useState({ amountUsd: '', method: 'WALLET' as 'WALLET' | 'INVOICE_VOID' | 'EXTERNAL', reason: '' })

  useHeaderConfig(useMemo(() => ({
    title: data?.displayId ?? 'Order',
    breadcrumbs: [{ label: 'Admin' }, { label: 'Orders', href: '/admin/orders' }, { label: data?.displayId ?? '…' }],
  }), [data?.displayId]))

  const allowedNext = data ? ORDER_STATUS_DAG[data.status] ?? [] : []

  const handleAdvance = async (to: AdminOrderStatus) => {
    if (!data) return
    try {
      await advance.mutateAsync({ id: data.id, to })
      toast.success(`Status → ${to}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Advance failed')
    }
  }

  const handleRefund = async () => {
    const amt = Number(refundForm.amountUsd)
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Enter a positive amount')
      return
    }
    if (!refundForm.reason.trim()) {
      toast.error('Reason required')
      return
    }
    try {
      await refund.mutateAsync({
        id: data!.id,
        amountUsd: amt,
        method: refundForm.method,
        reason: refundForm.reason.trim(),
        idempotencyKey: `${data!.id}-refund-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      })
      toast.success('Refund recorded')
      setRefundOpen(false)
      setRefundForm({ amountUsd: '', method: 'WALLET', reason: '' })
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Refund failed')
    }
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      </PageTransition>
    )
  }
  if (!data) {
    return (
      <PageTransition>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">Order not found.</div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <Link to="/admin/orders" className="mb-3 inline-flex items-center text-xs text-gray-500 hover:text-gray-700">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to orders
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-gray-400">{data.displayId}</span>
                <Badge variant="default" size="sm">{data.kind}</Badge>
                <Badge variant="info" size="sm">{data.status}</Badge>
                <Badge variant={data.paymentStatus === 'PAID' ? 'success' : 'warning'} size="sm">
                  {data.paymentStatus}
                </Badge>
              </div>
              <h2 className="mt-2 text-xl font-semibold">{data.service.name}</h2>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {data.client.fullName} · <span className="text-gray-400">{data.client.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {allowedNext.map((t) => (
                <Button key={t} size="sm" onClick={() => handleAdvance(t)} disabled={advance.isPending}>
                  <ArrowRight className="mr-1 h-3.5 w-3.5" />
                  {t}
                </Button>
              ))}
              {data.status === 'COMPLETED' && canRefund && (
                <Button size="sm" variant="ghost" onClick={() => setRefundOpen(true)}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Refund
                </Button>
              )}
            </div>
          </div>

          {/* Status rail */}
          <div className="mt-5 flex items-center gap-2">
            {STATUS_RAIL.map((s, i) => {
              const reached = STATUS_RAIL.indexOf(data.status) >= i
              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      reached
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className={`text-xs ${reached ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>{s}</span>
                  {i < STATUS_RAIL.length - 1 && <div className="h-px w-8 bg-gray-200 dark:bg-gray-800" />}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Requirements</h3>
              <p className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                {data.requirements || <span className="text-gray-400">No requirements provided.</span>}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Delivery</h3>
              {data.deliveryLink ? (
                <a className="text-sm text-primary-600 hover:underline" href={data.deliveryLink} target="_blank" rel="noreferrer">
                  {data.deliveryLink}
                </a>
              ) : (
                <p className="text-sm text-gray-400">Not delivered yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Summary</h3>
              <div className="space-y-2 text-sm">
                <Row label="Amount" value={formatCurrency(data.amountUsd)} />
                <Row label="Quantity" value={String(data.quantity)} />
                <Row label="Revisions" value={String(data.revisionCount)} />
                <Row label="Ordered" value={new Date(data.orderedAt).toLocaleString()} />
                {data.deliveredAt && <Row label="Delivered" value={new Date(data.deliveredAt).toLocaleString()} />}
                {typeof data.rating === 'number' && <Row label="Rating" value={`${data.rating} / 5`} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={refundOpen} onClose={() => setRefundOpen(false)} title={`Refund ${data.displayId}`}>
        <div className="space-y-3">
          <Input
            label="Amount (USD)"
            value={refundForm.amountUsd}
            onChange={(e) => setRefundForm({ ...refundForm, amountUsd: e.target.value })}
            type="number"
            placeholder={String(data.amountUsd)}
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Method</label>
            <select
              value={refundForm.method}
              onChange={(e) => setRefundForm({ ...refundForm, method: e.target.value as any })}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="WALLET">Wallet credit</option>
              <option value="INVOICE_VOID">Void invoice</option>
              <option value="EXTERNAL">External (manual)</option>
            </select>
          </div>
          <Input
            label="Reason"
            value={refundForm.reason}
            onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
            placeholder="Audit-visible reason"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleRefund} disabled={refund.isPending}>
              {refund.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Refund'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  )
}

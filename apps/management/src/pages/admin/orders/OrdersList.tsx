import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Package, Download, Plus, X, ArrowRight, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import {
  useAdminOrders,
  useBulkOrders,
  type AdminOrder,
  type AdminOrderStatus,
  type OrderKind,
} from '@/api/admin-orders'
import { PageTransition } from '@/components/ui/PageTransition'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useCurrency } from '@/hooks/useCurrency'

const STATUS_OPTIONS: { value: AdminOrderStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'IN_REVISION', label: 'In revision' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'DISPUTED', label: 'Disputed' },
]

const KIND_OPTIONS: { value: OrderKind | ''; label: string }[] = [
  { value: '', label: 'All kinds' },
  { value: 'portal', label: 'Portal' },
  { value: 'sales', label: 'Sales' },
  { value: 'apk', label: 'Web-to-APK' },
]

function statusVariant(s: AdminOrderStatus) {
  switch (s) {
    case 'PENDING': return 'warning' as const
    case 'IN_PROGRESS': return 'info' as const
    case 'DELIVERED': return 'info' as const
    case 'COMPLETED': return 'success' as const
    case 'CANCELLED': return 'default' as const
    case 'REFUNDED': return 'default' as const
    case 'DISPUTED': return 'danger' as const
    case 'IN_REVISION': return 'warning' as const
    case 'DRAFT': return 'default' as const
  }
}

export default function OrdersList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { formatCurrency } = useCurrency()

  const page = Number(searchParams.get('page') ?? '1') || 1
  const q = searchParams.get('q') ?? ''
  const status = (searchParams.get('status') as AdminOrderStatus | '' | null) ?? ''
  const kind = (searchParams.get('kind') as OrderKind | '' | null) ?? ''

  const [searchInput, setSearchInput] = useState(q)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const bulk = useBulkOrders()

  const runBulk = async (action: 'advance' | 'cancel', to?: AdminOrderStatus) => {
    if (selectedIds.size === 0) return
    try {
      const res = await bulk.mutateAsync({ ids: Array.from(selectedIds), action, to })
      const failed = res.total - res.okCount
      if (failed === 0) toast.success(`${res.okCount} order(s) updated`)
      else toast.warning(`${res.okCount} updated, ${failed} skipped (illegal transition or not found)`)
      setSelectedIds(new Set())
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Bulk action failed')
    }
  }

  const { data, isLoading } = useAdminOrders({
    page,
    limit: 20,
    q: q || undefined,
    status: status || undefined,
    kind: kind || undefined,
  })

  const setParam = (k: string, v: string | undefined) => {
    const next = new URLSearchParams(searchParams)
    if (!v) next.delete(k)
    else next.set(k, v)
    if (k !== 'page') next.delete('page')
    setSearchParams(next, { replace: true })
  }

  useHeaderConfig(useMemo(() => ({
    title: 'Orders',
    breadcrumbs: [{ label: 'Admin' }, { label: 'Orders' }],
  }), []))

  const rows = data?.data ?? []

  const columns: Column<AdminOrder>[] = [
    {
      key: 'displayId', label: 'Order', sticky: true,
      render: (r) => (
        <div>
          <div className="font-mono text-xs text-gray-400">{r.displayId}</div>
          <div className="text-sm font-medium">{r.service.name}</div>
        </div>
      ),
    },
    {
      key: 'client', label: 'Client',
      render: (r) => (
        <div>
          <div className="font-medium">{r.client.fullName}</div>
          <div className="text-xs text-gray-500">{r.client.email}</div>
        </div>
      ),
    },
    { key: 'kind', label: 'Kind', render: (r) => <Badge variant="default" size="sm">{r.kind}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={statusVariant(r.status)} size="sm">{r.status}</Badge> },
    { key: 'paymentStatus', label: 'Payment', render: (r) => <Badge variant={r.paymentStatus === 'PAID' ? 'success' : 'warning'} size="sm">{r.paymentStatus}</Badge> },
    { key: 'amountUsd', label: 'Amount', align: 'right', render: (r) => <span className="font-medium">{formatCurrency(r.amountUsd)}</span> },
    {
      key: 'orderedAt', label: 'Ordered',
      render: (r) => <span className="text-sm text-gray-500">{new Date(r.orderedAt).toLocaleDateString()}</span>,
    },
  ]

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            onSearch={() => setParam('q', searchInput || undefined)}
            placeholder="Search by client or service…"
            className="min-w-[240px]"
          />
          <Select
            value={status}
            onChange={(e) => setParam('status', e.target.value || undefined)}
            options={STATUS_OPTIONS}
            placeholder="Status"
            className="w-[160px]"
          />
          <Select
            value={kind}
            onChange={(e) => setParam('kind', e.target.value || undefined)}
            options={KIND_OPTIONS}
            placeholder="Kind"
            className="w-[140px]"
          />
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open('/v1/admin/orders/export.csv', '_blank')}
            >
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => navigate('/admin/orders/new')}>
              <Plus className="mr-1.5 h-4 w-4" /> New order
            </Button>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm dark:border-primary-900/40 dark:bg-primary-900/20">
            <span className="font-medium text-primary-700 dark:text-primary-300">
              {selectedIds.size} selected
            </span>
            <Button size="sm" variant="ghost" onClick={() => runBulk('advance', 'IN_PROGRESS')} disabled={bulk.isPending}>
              <ArrowRight className="mr-1 h-3.5 w-3.5" /> Mark In progress
            </Button>
            <Button size="sm" variant="ghost" onClick={() => runBulk('advance', 'COMPLETED')} disabled={bulk.isPending}>
              <ArrowRight className="mr-1 h-3.5 w-3.5" /> Complete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => runBulk('cancel')} disabled={bulk.isPending}>
              <Ban className="mr-1 h-3.5 w-3.5" /> Cancel
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              <X className="mr-1 h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        )}

        <DataTable<AdminOrder>
          columns={columns}
          data={rows}
          isLoading={isLoading}
          emptyIcon={<Package className="h-10 w-10 text-gray-300" />}
          emptyTitle="No orders match"
          emptyDescription="Try clearing filters."
          onRowClick={(r) => navigate(`/admin/orders/${encodeURIComponent(r.id)}`)}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          getRowId={(r) => r.id}
          pagination={data?.meta ? {
            page: data.meta.page,
            limit: data.meta.limit,
            total: data.meta.total,
            totalPages: data.meta.totalPages,
          } : undefined}
          onPageChange={(p) => setParam('page', String(p))}
        />
      </div>
    </PageTransition>
  )
}

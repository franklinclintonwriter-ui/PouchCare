import { useMemo } from 'react'
import { Users, Package, DollarSign, LifeBuoy } from 'lucide-react'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import { useAdminOverview } from '@/api/admin-overview'
import { PageTransition } from '@/components/ui/PageTransition'
import { KPICard } from '@/components/ui/KPICard'
import { useCurrency } from '@/hooks/useCurrency'

export default function AdminOverview() {
  const { data, isLoading } = useAdminOverview()
  const { formatCurrency } = useCurrency()

  useHeaderConfig(
    useMemo(
      () => ({
        title: 'Admin Overview',
        breadcrumbs: [{ label: 'Admin' }, { label: 'Overview' }],
      }),
      [],
    ),
  )

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KPICard
            title="Clients"
            value={data?.clients.total ?? 0}
            change={data ? data.clients.activePct : undefined}
            changeLabel="active"
            icon={<Users className="h-5 w-5" />}
            loading={isLoading}
          />
          <KPICard
            title="Orders"
            value={data?.orders.total ?? 0}
            changeLabel={`${data?.orders.byStatus?.IN_PROGRESS ?? 0} in progress`}
            icon={<Package className="h-5 w-5" />}
            iconBg="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            loading={isLoading}
          />
          <KPICard
            title="Revenue MTD"
            value={formatCurrency(data?.revenue.mtdUsd ?? 0)}
            icon={<DollarSign className="h-5 w-5" />}
            iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            loading={isLoading}
          />
          <KPICard
            title="Open Tickets"
            value={data?.support.open ?? 0}
            changeLabel={`${data?.support.overdueSla ?? 0} SLA overdue`}
            icon={<LifeBuoy className="h-5 w-5" />}
            iconBg="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            loading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Orders by status
            </h3>
            <div className="space-y-2">
              {Object.entries(data?.orders.byStatus ?? {}).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{k}</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{v}</span>
                </div>
              ))}
              {(!data || Object.keys(data.orders.byStatus).length === 0) && (
                <div className="text-sm text-gray-400">No orders yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Quick links
            </h3>
            <ul className="space-y-2 text-sm">
              <li><a className="text-primary-600 hover:underline" href="/admin/clients">Clients →</a></li>
              <li><a className="text-primary-600 hover:underline" href="/admin/orders">Orders →</a></li>
              <li><a className="text-primary-600 hover:underline" href="/admin/orders?status=PENDING">Pending orders →</a></li>
              <li><a className="text-primary-600 hover:underline" href="/admin/orders?status=DELIVERED">Delivered (need review) →</a></li>
            </ul>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Generated {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : '—'}
        </p>
      </div>
    </PageTransition>
  )
}

import { useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePortalOrders } from '@/api/portal';
import { useCurrency } from '@/hooks/useCurrency';
import { PageTransition } from '@/components/ui/PageTransition';
import { Tabs } from '@/components/ui/Tabs';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { PortalOrder } from '@/types/models';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function PortalOrders() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const onSearchChange = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const onStatusChange = useCallback((v: string) => { setStatusFilter(v); setPage(1); }, []);

  useHeaderConfig(useMemo(() => ({
    title: 'My Orders',
    breadcrumbs: [
      { label: 'Dashboard', href: '/portal' },
      { label: 'Orders' },
    ],
    actions: [
      {
        type: 'search' as const,
        placeholder: 'Search orders…',
        value: search,
        onChange: onSearchChange,
      },
      ...(tab === 'all' ? [{
        type: 'filter' as const,
        label: 'Status',
        options: STATUS_OPTIONS,
        value: statusFilter,
        onChange: onStatusChange,
      }] : []),
    ],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [search, statusFilter, tab]));

  const params = useMemo(() => {
    const status = tab === 'active' ? 'PROCESSING' : tab === 'completed' ? 'COMPLETED' : tab === 'cancelled' ? 'CANCELLED' : statusFilter || undefined;
    return { page, limit: 20, q: search || undefined, status };
  }, [tab, search, statusFilter, page]);

  const { data, isLoading } = usePortalOrders(params);

  // Counts for tabs (use full data query)
  const { data: allData } = usePortalOrders({ limit: 100 });
  const counts = useMemo(() => {
    const all = allData?.data ?? [];
    return {
      all: allData?.meta.total ?? 0,
      active: all.filter(o => ['PENDING', 'PROCESSING'].includes(o.status)).length,
      completed: all.filter(o => o.status === 'COMPLETED').length,
      cancelled: all.filter(o => o.status === 'CANCELLED').length,
    };
  }, [allData]);

  const columns: Column<PortalOrder>[] = [
    { key: 'number', label: 'Order #', sticky: true, render: (r) => <span className="font-mono text-xs font-medium">{r.number}</span> },
    { key: 'serviceName', label: 'Service' },
    { key: 'amount', label: 'Amount', align: 'right', render: (r) => formatCurrency(r.amount) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: 'placedDate', label: 'Placed', render: (r) => <span className="text-xs text-gray-500">{r.placedDate}</span> },
    { key: 'deliveryDate', label: 'Delivery', render: (r) => <span className="text-xs text-gray-500">{r.deliveryDate ?? '—'}</span> },
  ];

  const tabs = [
    { label: 'All', value: 'all', count: counts.all },
    { label: 'Active', value: 'active', count: counts.active },
    { label: 'Completed', value: 'completed', count: counts.completed },
    { label: 'Cancelled', value: 'cancelled', count: counts.cancelled },
  ];

  return (
    <PageTransition>
      <div className="space-y-4">
        <Tabs tabs={tabs} value={tab} onChange={(v) => { setTab(v); setPage(1); }} />

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          pagination={data?.meta}
          onPageChange={setPage}
          onRowClick={(r) => navigate(`/portal/orders/${r.id}`)}
          emptyTitle="No orders found"
          emptyDescription="Place your first order to get started."
        />
      </div>
    </PageTransition>
  );
}

import { useState, useMemo, useCallback } from 'react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCommissions } from '@/api/portal';
import { useCurrency } from '@/hooks/useCurrency';
import { PageTransition } from '@/components/ui/PageTransition';
import { StatsRow } from '@/components/shared/StatsRow';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Filter } from 'lucide-react';
import type { CommissionRecord } from '@/types/models';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending Hold', value: 'PENDING_HOLD' },
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'Paid Out', value: 'PAID_OUT' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function Commissions() {
  const { formatCurrency } = useCurrency();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const onStatusChange = useCallback((v: string) => { setStatusFilter(v); setPage(1); }, []);

  useHeaderConfig(useMemo(() => ({
    title: 'Commissions',
    breadcrumbs: [
      { label: 'Dashboard', href: '/portal' },
      { label: 'Commissions' },
    ],
    actions: [
      { type: 'filter' as const, label: 'Status', icon: Filter, options: STATUS_OPTIONS, value: statusFilter, onChange: onStatusChange },
    ],
  }), [statusFilter, onStatusChange]));

  const { data, isLoading } = useCommissions({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });

  // Stats from all commissions
  const { data: allData } = useCommissions({ limit: 100 });
  const stats = useMemo(() => {
    const all = allData?.data ?? [];
    const total = all.reduce((s, c) => s + c.amount, 0);
    const available = all.filter(c => c.status === 'AVAILABLE').reduce((s, c) => s + c.amount, 0);
    const pending = all.filter(c => c.status === 'PENDING_HOLD').reduce((s, c) => s + c.amount, 0);
    const paid = all.filter(c => c.status === 'PAID_OUT').reduce((s, c) => s + c.amount, 0);
    return { total, available, pending, paid };
  }, [allData]);

  const columns: Column<CommissionRecord>[] = [
    { key: 'orderRef', label: 'Order Ref', render: (r) => <span className="font-mono text-xs font-medium">{r.orderRef}</span> },
    { key: 'amount', label: 'Amount', align: 'right', render: (r) => formatCurrency(r.amount) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: 'earnedDate', label: 'Earned', render: (r) => <span className="text-xs text-gray-500">{r.earnedDate}</span> },
    { key: 'availableDate', label: 'Available', render: (r) => <span className="text-xs text-gray-500">{r.availableDate ?? '—'}</span> },
    { key: 'paidDate', label: 'Paid', render: (r) => <span className="text-xs text-gray-500">{r.paidDate ?? '—'}</span> },
  ];

  return (
    <PageTransition>
      <div className="space-y-4">
        <StatsRow
          loading={isLoading}
          items={[
            { title: 'Total Earned', value: formatCurrency(stats.total) },
            { title: 'Available', value: formatCurrency(stats.available) },
            { title: 'Pending Hold', value: formatCurrency(stats.pending) },
            { title: 'Paid Out', value: formatCurrency(stats.paid) },
          ]}
        />

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          pagination={data?.meta}
          onPageChange={setPage}
          emptyTitle="No commissions"
          emptyDescription="Commissions from referral orders will appear here."
        />
      </div>
    </PageTransition>
  );
}

import { useState, useMemo } from 'react';
import { Coins, Clock, CheckCircle, Banknote, CircleDot } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useAdminCommissions } from '@/api/admin-portal';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatsRow } from '@/components/shared/StatsRow';
import { formatCurrency } from '@/lib/format';
import type { CommissionRecord } from '@/types/models';

export default function PortalCommissions() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminCommissions({
    status: status || undefined,
    page,
    limit: 20,
  });

  const commissions = data?.data ?? [];
  const meta = data?.meta;

  const stats = useMemo(() => {
    const total = commissions.reduce((sum, c) => sum + c.amount, 0);
    const pendingHold = commissions.filter(c => c.status === 'PENDING_HOLD').reduce((sum, c) => sum + c.amount, 0);
    const available = commissions.filter(c => c.status === 'AVAILABLE').reduce((sum, c) => sum + c.amount, 0);
    const paidOut = commissions.filter(c => c.status === 'PAID_OUT').reduce((sum, c) => sum + c.amount, 0);
    return [
      { title: 'Total Commissions', value: formatCurrency(total), icon: <Coins />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { title: 'Pending Hold', value: formatCurrency(pendingHold), icon: <Clock />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
      { title: 'Available', value: formatCurrency(available), icon: <CheckCircle />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
      { title: 'Paid Out', value: formatCurrency(paidOut), icon: <Banknote />, iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    ];
  }, [commissions]);

  const headerConfig = useMemo(() => ({
    title: 'Commissions',
    breadcrumbs: [
      { label: 'Admin', href: '/admin' },
      { label: 'Portal', href: '/admin/portal' },
      { label: 'Commissions' },
    ],
    actions: [
      {
        type: 'filter' as const,
        label: 'Status',
        icon: CircleDot,
        options: [
          { label: 'All Statuses', value: '' },
          { label: 'Pending Hold', value: 'PENDING_HOLD' },
          { label: 'Available', value: 'AVAILABLE' },
          { label: 'Paid Out', value: 'PAID_OUT' },
          { label: 'Cancelled', value: 'CANCELLED' },
          { label: 'Fraud Hold', value: 'FRAUD_HOLD' },
        ],
        value: status,
        onChange: setStatus,
      },
    ],
  }), [status]);

  useHeaderConfig(headerConfig);

  const columns: Column<CommissionRecord>[] = [
    {
      key: 'memberName',
      label: 'Member',
      render: (row) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.memberName}</span>
      ),
    },
    {
      key: 'orderRef',
      label: 'Order Ref',
      render: (row) => (
        <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">{row.orderRef}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'earnedDate',
      label: 'Earned',
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(row.earnedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'availableDate',
      label: 'Available',
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {row.availableDate
            ? new Date(row.availableDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '--'}
        </span>
      ),
    },
    {
      key: 'paidDate',
      label: 'Paid',
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {row.paidDate
            ? new Date(row.paidDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '--'}
        </span>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <StatsRow items={stats} loading={isLoading} />

        <DataTable
          columns={columns}
          data={commissions}
          isLoading={isLoading}
          pagination={meta}
          onPageChange={setPage}
          emptyTitle="No commissions found"
          emptyDescription="Try adjusting your filters"
        />
      </div>
    </PageTransition>
  );
}

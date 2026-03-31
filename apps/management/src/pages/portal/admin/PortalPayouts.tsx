import { useState, useMemo } from 'react';
import { Clock, Loader, CheckCircle2, DollarSign, CircleDot } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useAdminPayouts, useProcessPayout } from '@/api/admin-portal';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { StatsRow } from '@/components/shared/StatsRow';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/mocks/generators';
import type { PayoutRecord } from '@/types/models';
import { toast } from 'sonner';

const methodVariant: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'default'> = {
  PAYONEER: 'primary',
  USDT_TRC20: 'success',
  BINANCE: 'warning',
  BANK_TRANSFER: 'info',
  CASH: 'default',
};

const methodLabel: Record<string, string> = {
  PAYONEER: 'Payoneer',
  USDT_TRC20: 'USDT TRC20',
  BINANCE: 'Binance',
  BANK_TRANSFER: 'Bank',
  CASH: 'Cash',
};

export default function PortalPayouts() {
  const [status, setStatus] = useState('');
  const processPayout = useProcessPayout();

  const { data, isLoading } = useAdminPayouts({
    status: status || undefined,
  });

  const payouts = data?.data ?? [];
  const meta = data?.meta;

  const stats = useMemo(() => {
    const pending = payouts.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
    const processing = payouts.filter(p => p.status === 'PROCESSING').reduce((sum, p) => sum + p.amount, 0);
    const completed = payouts.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);
    const total = payouts.reduce((sum, p) => sum + p.amount, 0);
    return [
      { title: 'Pending Total', value: formatCurrency(pending), icon: <Clock />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
      { title: 'Processing', value: formatCurrency(processing), icon: <Loader />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { title: 'Completed', value: formatCurrency(completed), icon: <CheckCircle2 />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
      { title: 'Total Ever Paid', value: formatCurrency(total), icon: <DollarSign />, iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    ];
  }, [payouts]);

  const headerConfig = useMemo(() => ({
    title: 'Payouts',
    breadcrumbs: [
      { label: 'Admin', href: '/admin' },
      { label: 'Portal', href: '/admin/portal' },
      { label: 'Payouts' },
    ],
    actions: [
      {
        type: 'filter' as const,
        label: 'Status',
        icon: CircleDot,
        options: [
          { label: 'All Statuses', value: '' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Processing', value: 'PROCESSING' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Rejected', value: 'REJECTED' },
        ],
        value: status,
        onChange: setStatus,
      },
    ],
  }), [status]);

  useHeaderConfig(headerConfig);

  const columns: Column<PayoutRecord>[] = [
    {
      key: 'memberName',
      label: 'Member',
      render: (row) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.memberName}</span>
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
      key: 'method',
      label: 'Method',
      render: (row) => (
        <Badge variant={methodVariant[row.method] ?? 'default'} size="sm">
          {methodLabel[row.method] ?? row.method}
        </Badge>
      ),
    },
    {
      key: 'accountDetails',
      label: 'Account',
      render: (row) => (
        <span className="font-mono text-sm text-gray-500 dark:text-gray-400">{row.accountDetails}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'requestedDate',
      label: 'Requested',
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(row.requestedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'processedDate',
      label: 'Processed',
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {row.processedDate
            ? new Date(row.processedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '--'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            isLoading={processPayout.isPending}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await processPayout.mutateAsync({ id: row.id, status: 'COMPLETED' });
                toast.success('Payout approved');
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed');
              }
            }}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            isLoading={processPayout.isPending}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await processPayout.mutateAsync({ id: row.id, status: 'REJECTED' });
                toast.success('Payout rejected');
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed');
              }
            }}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <StatsRow items={stats} loading={isLoading} />

        <DataTable
          columns={columns}
          data={payouts}
          isLoading={isLoading}
          pagination={meta}
          emptyTitle="No payouts found"
          emptyDescription="Try adjusting your filters"
        />
      </div>
    </PageTransition>
  );
}

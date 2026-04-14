import { useState, useMemo } from 'react';
import { DollarSign, Clock, CheckCircle2, XCircle, CircleDot } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useAdminDeposits, useApproveDeposit, useRejectDeposit, type DepositRecord } from '@/api/admin-portal';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatsRow } from '@/components/shared/StatsRow';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

export default function PortalDeposits() {
  const { formatCurrency } = useCurrency();
  const [status, setStatus] = useState('Pending');
  const approveDeposit = useApproveDeposit();
  const rejectDeposit = useRejectDeposit();

  const { data, isLoading } = useAdminDeposits({ status: status || undefined });

  const deposits = data?.data ?? [];
  const meta = data?.meta;

  const stats = useMemo(() => {
    const pending = deposits.filter(d => d.status === 'Pending').reduce((s, d) => s + d.amountUsd, 0);
    const confirmed = deposits.filter(d => d.status === 'Confirmed').reduce((s, d) => s + d.amountUsd, 0);
    const failed = deposits.filter(d => d.status === 'Failed').reduce((s, d) => s + d.amountUsd, 0);
    const total = deposits.reduce((s, d) => s + d.amountUsd, 0);
    return [
      { title: 'Pending Deposits', value: formatCurrency(pending), icon: <Clock />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
      { title: 'Confirmed', value: formatCurrency(confirmed), icon: <CheckCircle2 />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
      { title: 'Rejected', value: formatCurrency(failed), icon: <XCircle />, iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
      { title: 'Total (Shown)', value: formatCurrency(total), icon: <DollarSign />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    ];
  }, [deposits]);

  const headerConfig = useMemo(() => ({
    title: 'Wallet Deposits',
    breadcrumbs: [
      { label: 'Admin', href: '/admin/portal' },
      { label: 'Portal', href: '/admin/portal/members' },
      { label: 'Deposits' },
    ],
    actions: [
      {
        type: 'filter' as const,
        label: 'Status',
        icon: CircleDot,
        options: [
          { label: 'Pending', value: 'Pending' },
          { label: 'Confirmed', value: 'Confirmed' },
          { label: 'Failed', value: 'Failed' },
          { label: 'All', value: '' },
        ],
        value: status,
        onChange: setStatus,
      },
    ],
  }), [status]);

  useHeaderConfig(headerConfig);

  const columns: Column<DepositRecord>[] = [
    {
      key: 'memberName',
      label: 'Member',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.memberName}</p>
          <p className="text-xs text-gray-400">{row.memberEmail}</p>
        </div>
      ),
    },
    {
      key: 'amountUsd',
      label: 'Amount',
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(row.amountUsd)}</span>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      render: (row) => <span className="text-sm text-gray-600 dark:text-gray-400">{row.paymentMethod}</span>,
    },
    {
      key: 'proofUrl',
      label: 'Proof',
      render: (row) => row.proofUrl ? (
        <a href={row.proofUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline dark:text-primary-400">
          View
        </a>
      ) : <span className="text-xs text-gray-400">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'transactionDate',
      label: 'Requested',
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(row.transactionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => row.status !== 'Pending' ? null : (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            isLoading={approveDeposit.isPending}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await approveDeposit.mutateAsync(row.id);
                toast.success('Deposit approved');
              } catch {
                toast.error('Failed to approve deposit');
              }
            }}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            isLoading={rejectDeposit.isPending}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await rejectDeposit.mutateAsync(row.id);
                toast.success('Deposit rejected');
              } catch {
                toast.error('Failed to reject deposit');
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
          data={deposits}
          isLoading={isLoading}
          pagination={meta}
          getRowId={(row) => row.id}
          emptyTitle="No deposits found"
          emptyDescription="Try changing the status filter"
        />
      </div>
    </PageTransition>
  );
}

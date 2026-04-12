import { useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useReferralFraudFlags } from '@/api/portal';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';

export default function ReferralFraud() {
  const { data, isLoading } = useReferralFraudFlags();
  const rows = data ?? [];

  const headerConfig = useMemo(() => ({
    title: 'Referral Fraud',
    breadcrumbs: [
      { label: 'Admin', href: '/admin' },
      { label: 'Portal', href: '/admin/portal' },
      { label: 'Referral Fraud' },
    ],
    actions: [],
  }), []);
  useHeaderConfig(headerConfig);

  const columns: Column<(typeof rows)[number]>[] = [
    { key: 'id', label: 'ID', sticky: true, render: (r) => <span className="font-mono text-xs">{r.id.slice(0, 8).toUpperCase()}</span> },
    { key: 'orderId', label: 'Order', render: (r) => <span className="font-mono text-xs">{r.orderId ?? '-'}</span> },
    { key: 'earnerId', label: 'Earner', render: (r) => <span className="font-mono text-xs">{r.earnerId ? r.earnerId.slice(0, 8).toUpperCase() : '-'}</span> },
    {
      key: 'commissionAmountUsd',
      label: 'Amount',
      align: 'right',
      render: (r) => <span className="text-sm font-medium">{r.commissionAmountUsd != null ? `$${r.commissionAmountUsd.toFixed(2)}` : '-'}</span>,
    },
    {
      key: 'fraudFlag',
      label: 'Flag',
      align: 'center',
      render: () => <Badge variant="danger" size="sm"><ShieldAlert className="mr-1 h-3.5 w-3.5" />Flagged</Badge>,
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (r) => <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>,
    },
  ];

  return (
    <PageTransition>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        getRowId={(r) => r.id}
        emptyTitle="No flagged commissions found"
      />
    </PageTransition>
  );
}


import { useState, useMemo } from 'react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useSalesOrders } from '@/api/crm';
import { PageTransition } from '@/components/ui/PageTransition';
import { StatsRow } from '@/components/shared/StatsRow';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/mocks/generators';
import { ShoppingCart, DollarSign, CheckCircle, Clock, CircleDot } from 'lucide-react';
import type { SalesOrder } from '@/types/models';

export default function SalesOrders() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSalesOrders({ q: search, status, page, limit: 20 });
  const orders = data?.data ?? [];
  const meta = data?.meta;

  const { data: allData } = useSalesOrders({});
  const allOrders = allData?.data ?? [];

  const stats = useMemo(() => {
    const totalOrders = allOrders.length;
    const totalValue = allOrders.reduce((s, o) => s + o.total, 0);
    const paid = allOrders.filter(o => o.status === 'PAID').reduce((s, o) => s + o.total, 0);
    const pending = allOrders.filter(o => o.status === 'UNPAID' || o.status === 'PARTIAL').length;
    return { totalOrders, totalValue, paid, pending };
  }, [allOrders]);

  useHeaderConfig({
    title: 'Sales Orders',
    breadcrumbs: [{ label: 'CRM' }, { label: 'Sales Orders' }],
    actions: [
      { type: 'search', placeholder: 'Search orders...', value: search, onChange: setSearch },
      {
        type: 'filter', label: 'Status', icon: CircleDot, value: status, onChange: setStatus,
        options: [
          { label: 'All Statuses', value: '' },
          { label: 'Paid', value: 'PAID' },
          { label: 'Unpaid', value: 'UNPAID' },
          { label: 'Partial', value: 'PARTIAL' },
          { label: 'Overdue', value: 'OVERDUE' },
        ],
      },
    ],
  });

  const columns: Column<SalesOrder>[] = [
    { key: 'number', label: 'Order #', sticky: true, render: (row) => (
      <span className="font-semibold text-gray-900 dark:text-gray-100">{row.number}</span>
    )},
    { key: 'clientName', label: 'Client' },
    { key: 'total', label: 'Total', align: 'right', render: (row) => (
      <span className="font-medium">{formatCurrency(row.total)}</span>
    )},
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'date', label: 'Date' },
    { key: 'assigneeName', label: 'Assignee' },
  ];

  return (
    <PageTransition className="space-y-6">
      <StatsRow
        loading={isLoading}
        items={[
          { title: 'Total Orders', value: stats.totalOrders, icon: <ShoppingCart className="h-4 w-4" />, iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
          { title: 'Total Value', value: formatCurrency(stats.totalValue), icon: <DollarSign className="h-4 w-4" />, iconBg: 'bg-purple-100 dark:bg-purple-900/30' },
          { title: 'Paid', value: formatCurrency(stats.paid), icon: <CheckCircle className="h-4 w-4" />, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { title: 'Pending', value: stats.pending, icon: <Clock className="h-4 w-4" />, iconBg: 'bg-amber-100 dark:bg-amber-900/30' },
        ]}
      />

      <DataTable<SalesOrder>
        columns={columns}
        data={orders}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        getRowId={(row) => row.id}
      />
    </PageTransition>
  );
}

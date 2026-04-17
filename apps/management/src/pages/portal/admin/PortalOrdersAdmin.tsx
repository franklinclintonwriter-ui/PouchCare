import { useState, useMemo } from 'react';
import { ShoppingBag, Loader, PackageCheck, DollarSign, CircleDot } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useAdminPortalOrders, useUpdateOrderStatus } from '@/api/admin-portal';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatsRow } from '@/components/shared/StatsRow';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/hooks/useCurrency';
import type { PortalOrder } from '@/types/models';
import { toast } from 'sonner';

export default function PortalOrdersAdmin() {
  const { formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const updateOrder = useUpdateOrderStatus();

  const { data, isLoading } = useAdminPortalOrders({
    q: search || undefined,
    status: status || undefined,
    page,
    limit: 20,
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;

  const stats = useMemo(() => {
    const total = meta?.total ?? 0;
    const processing = orders.filter(o => o.status === 'PROCESSING').length;
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;
    const revenue = orders.reduce((sum, o) => sum + o.amount, 0);
    return [
      { title: 'Total Orders', value: total, icon: <ShoppingBag />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { title: 'Processing', value: processing, icon: <Loader />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
      { title: 'Delivered', value: delivered, icon: <PackageCheck />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
      { title: 'Total Revenue', value: formatCurrency(revenue), icon: <DollarSign />, iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    ];
  }, [orders, meta]);

  const headerConfig = useMemo(() => ({
    title: 'Portal Orders',
    breadcrumbs: [
      { label: 'Admin', href: '/admin/portal' },
      { label: 'Portal', href: '/admin/portal' },
      { label: 'Orders' },
    ],
    actions: [
      { type: 'search' as const, placeholder: 'Search orders...', value: search, onChange: setSearch },
      {
        type: 'filter' as const,
        label: 'Status',
        icon: CircleDot,
        options: [
          { label: 'All Statuses', value: '' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Processing', value: 'PROCESSING' },
          { label: 'Delivered', value: 'DELIVERED' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Revision', value: 'REVISION_REQUESTED' },
          { label: 'Cancelled', value: 'CANCELLED' },
          { label: 'Refunded', value: 'REFUNDED' },
        ],
        value: status,
        onChange: setStatus,
      },
    ],
  }), [search, status]);

  useHeaderConfig(headerConfig);

  const columns: Column<PortalOrder>[] = [
    {
      key: 'number',
      label: 'Order #',
      sticky: true,
      render: (row) => (
        <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{row.number}</span>
      ),
    },
    {
      key: 'memberName',
      label: 'Member',
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{row.memberName}</span>
      ),
    },
    {
      key: 'serviceName',
      label: 'Service',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{row.serviceName}</span>
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
      key: 'placedDate',
      label: 'Placed',
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(row.placedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'assignedStaff',
      label: 'Staff',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{row.assignedStaff ?? '--'}</span>
      ),
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-1.5 rounded-full bg-blue-500 transition-all"
              style={{ width: `${row.progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{row.progress}%</span>
        </div>
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
            isLoading={updateOrder.isPending}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await updateOrder.mutateAsync({ id: row.id, status: 'PROCESSING' });
                toast.success('Order set to processing');
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed');
              }
            }}
          >
            Process
          </Button>
          <Button
            size="sm"
            variant="ghost"
            isLoading={updateOrder.isPending}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await updateOrder.mutateAsync({ id: row.id, status: 'DELIVERED' });
                toast.success('Order marked delivered');
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed');
              }
            }}
          >
            Deliver
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
          data={orders}
          isLoading={isLoading}
          pagination={meta}
          onPageChange={setPage}
          emptyTitle="No orders found"
          emptyDescription="Try adjusting your search or filters"
        />
      </div>
    </PageTransition>
  );
}

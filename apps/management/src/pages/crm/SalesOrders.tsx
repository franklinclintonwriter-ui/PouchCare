import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useSalesOrders, useDeleteSalesOrder, useUpdateSalesOrder, useCreateSalesOrder } from '@/api/crm';
import { PageTransition } from '@/components/ui/PageTransition';
import { StatsRow } from '@/components/shared/StatsRow';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuthStore } from '@/store/authStore';
import type { StaffUser } from '@/types/auth';
import { ShoppingCart, DollarSign, CheckCircle, Clock, CircleDot } from 'lucide-react';
import type { SalesOrder } from '@/types/models';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/usePermission';

const SENIOR_ROLES = ['CEO', 'CO_MD', 'OP_MANAGER'];

export default function SalesOrders() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const permission = usePermission();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const deleteSalesOrder = useDeleteSalesOrder();
  const updateSalesOrder = useUpdateSalesOrder();
  const createSalesOrder = useCreateSalesOrder();
  const user = useAuthStore((s) => s.user) as StaffUser | null;
  const canDelete = SENIOR_ROLES.includes(user?.systemRole ?? '');
  const canCreate = permission.isOps || permission.isManager;

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

  const handleMarkPaid = async (row: SalesOrder) => {
    try {
      await updateSalesOrder.mutateAsync({ id: row.id, paymentStatus: 'PAID' });
      toast.success('Marked as paid');
    } catch {
      toast.error('Failed to update');
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<SalesOrder | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    clientName: '',
    service: '',
    amountUsd: '',
    paymentStatus: 'UNPAID',
    status: 'New',
    assignedTo: '',
    branch: '',
    deadline: '',
    invoiceReference: '',
    notes: '',
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSalesOrder.mutateAsync(deleteTarget.id);
      toast.success('Order deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  useHeaderConfig({
    title: 'Sales Orders',
    breadcrumbs: [{ label: 'CRM' }, { label: 'Sales Orders' }],
    actions: [
      ...(canCreate ? [{ type: 'button' as const, label: 'New Order', icon: Plus, onClick: () => setCreateOpen(true) }] : []),
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
    {
      key: 'actions' as keyof SalesOrder,
      label: '',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status !== 'PAID' && (
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); handleMarkPaid(row); }}>
              Mark Paid
            </Button>
          )}
          {canDelete && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
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
        onRowClick={(row) => navigate(`/crm/orders/${row.id}`)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Order"
        message={`Delete order "${deleteTarget?.number}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteSalesOrder.isPending}
        onConfirm={handleDelete}
      />

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Order"
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              isLoading={createSalesOrder.isPending}
              onClick={async () => {
                if (!createForm.clientName.trim()) return toast.error('Client name is required');
                const amount = Number(createForm.amountUsd);
                if (!Number.isFinite(amount) || amount <= 0) return toast.error('Amount must be a positive number');
                try {
                  await createSalesOrder.mutateAsync({
                    clientName: createForm.clientName.trim(),
                    service: createForm.service.trim() || undefined,
                    amountUsd: amount,
                    paymentStatus: createForm.paymentStatus,
                    status: createForm.status,
                    assignedTo: createForm.assignedTo.trim() || undefined,
                    branch: createForm.branch.trim() || undefined,
                    deadline: createForm.deadline || undefined,
                    invoiceReference: createForm.invoiceReference.trim() || undefined,
                    notes: createForm.notes || undefined,
                  } as any);
                  setCreateOpen(false);
                  setCreateForm({
                    clientName: '',
                    service: '',
                    amountUsd: '',
                    paymentStatus: 'UNPAID',
                    status: 'New',
                    assignedTo: '',
                    branch: '',
                    deadline: '',
                    invoiceReference: '',
                    notes: '',
                  });
                  toast.success('Order created');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to create order');
                }
              }}
            >
              Create
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label="Client Name" value={createForm.clientName} onChange={(e) => setCreateForm((s) => ({ ...s, clientName: e.target.value }))} />
          <Input label="Service" value={createForm.service} onChange={(e) => setCreateForm((s) => ({ ...s, service: e.target.value }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="number" step="0.01" label="Amount (USD)" value={createForm.amountUsd} onChange={(e) => setCreateForm((s) => ({ ...s, amountUsd: e.target.value }))} />
            <Select
              label="Payment Status"
              value={createForm.paymentStatus}
              onChange={(e) => setCreateForm((s) => ({ ...s, paymentStatus: e.target.value }))}
              options={[
                { label: 'Unpaid', value: 'UNPAID' },
                { label: 'Paid', value: 'PAID' },
                { label: 'Partial', value: 'PARTIAL' },
                { label: 'Refunded', value: 'REFUNDED' },
              ]}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Status" value={createForm.status} onChange={(e) => setCreateForm((s) => ({ ...s, status: e.target.value }))} />
            <Input label="Assignee" value={createForm.assignedTo} onChange={(e) => setCreateForm((s) => ({ ...s, assignedTo: e.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Branch" value={createForm.branch} onChange={(e) => setCreateForm((s) => ({ ...s, branch: e.target.value }))} />
            <Input type="date" label="Deadline" value={createForm.deadline} onChange={(e) => setCreateForm((s) => ({ ...s, deadline: e.target.value }))} />
          </div>
          <Input label="Invoice Reference" value={createForm.invoiceReference} onChange={(e) => setCreateForm((s) => ({ ...s, invoiceReference: e.target.value }))} />
          <Input label="Notes" value={createForm.notes} onChange={(e) => setCreateForm((s) => ({ ...s, notes: e.target.value }))} />
        </div>
      </Modal>
    </PageTransition>
  );
}

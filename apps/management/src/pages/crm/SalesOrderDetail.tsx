import type { ReactNode } from 'react';
import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useSalesOrderRecord, useUpdateSalesOrder, useDeleteSalesOrder } from '@/api/crm';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCurrency } from '@/hooks/useCurrency';
import { usePermission } from '@/hooks/usePermission';
import { CrmScopeNotice } from '@/components/crm/CrmScopeNotice';
import { ShoppingCart, Calendar, User, Building2, FileText, Link2, Trash2, CheckCircle2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function SalesOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { data: order, isLoading } = useSalesOrderRecord(id);
  const updateOrder = useUpdateSalesOrder();
  const deleteOrder = useDeleteSalesOrder();
  const perm = usePermission();
  const canDelete = perm.isCEO || perm.isOps;

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    clientName: '',
    service: '',
    amountUsd: '',
    assignedTo: '',
    branch: '',
    deadline: '',
    deliveryLink: '',
    invoiceReference: '',
    notes: '',
    status: '',
  });
  const title = order ? `SO-${String(order.orderId).padStart(4, '0')}` : 'Sales order';

  const openEdit = useCallback(() => {
    if (order) {
      setEditForm({
        clientName: order.clientName,
        service: order.service || '',
        amountUsd: String(order.amountUsd),
        assignedTo: order.assignedTo || '',
        branch: order.branch || '',
        deadline: order.deadline ? order.deadline.slice(0, 10) : '',
        deliveryLink: order.deliveryLink || '',
        invoiceReference: order.invoiceReference || '',
        notes: order.notes || '',
        status: order.status || '',
      });
    }
    setEditOpen(true);
  }, [order]);

  const handleEditSave = async () => {
    if (!id) return;
    try {
      const assignee = editForm.assignedTo.trim();
      if (assignee && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assignee)) {
        toast.error('Assignee must be a valid staff ID (UUID)');
        return;
      }
      await updateOrder.mutateAsync({
        id,
        clientName: editForm.clientName.trim() || undefined,
        service: editForm.service.trim() || undefined,
        amountUsd: editForm.amountUsd ? Number(editForm.amountUsd) : undefined,
        assignedTo: assignee || undefined,
        branch: editForm.branch.trim() || undefined,
        deadline: editForm.deadline || undefined,
        deliveryLink: editForm.deliveryLink.trim() || undefined,
        invoiceReference: editForm.invoiceReference.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
        status: editForm.status || undefined,
      });
      toast.success('Order updated');
      setEditOpen(false);
    } catch {
      toast.error('Failed to update order');
    }
  };

  const handleMarkPaid = async () => {
    if (!id) return;
    try {
      await updateOrder.mutateAsync({ id, paymentStatus: 'PAID' });
      toast.success('Marked as paid');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteOrder.mutateAsync(id);
      toast.success('Order deleted');
      navigate('/crm/orders');
    } catch {
      toast.error('Failed to delete');
    }
  };

  useHeaderConfig(useMemo(() => ({
    title,
    breadcrumbs: [
      { label: 'CRM' },
      { label: 'Sales Orders', href: '/crm/orders' },
      { label: title },
    ],
    actions: [
      ...(perm.isManager ? [{
        type: 'button' as const,
        label: 'Edit',
        icon: Pencil,
        variant: 'outline' as const,
        onClick: openEdit,
      }] : []),
      ...(order?.paymentStatus !== 'PAID' ? [{
        type: 'button' as const,
        label: 'Mark Paid',
        icon: CheckCircle2,
        variant: 'outline' as const,
        onClick: handleMarkPaid,
      }] : []),
      ...(canDelete ? [{
        type: 'button' as const,
        label: 'Delete',
        icon: Trash2,
        variant: 'danger' as const,
        onClick: () => setDeleteOpen(true),
      }] : []),
    ],
  }), [title, order?.paymentStatus, canDelete, perm.isManager, handleMarkPaid, openEdit]));

  if (isLoading) {
    return (
      <PageTransition className="space-y-6">
        <Card>
          <Skeleton className="h-10 w-64 rounded" />
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><Skeleton className="h-48 w-full rounded" /></Card>
          <Card><Skeleton className="h-48 w-full rounded" /></Card>
        </div>
      </PageTransition>
    );
  }

  if (!order) {
    return (
      <PageTransition>
        <Card>
          <p className="py-10 text-center text-gray-500 dark:text-gray-400">Order not found.</p>
        </Card>
      </PageTransition>
    );
  }

  const orderLabel = `SO-${String(order.orderId).padStart(4, '0')}`;

  return (
    <PageTransition className="space-y-6">
      <CrmScopeNotice />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Order"
        message={`Delete order ${orderLabel}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteOrder.isPending}
        onConfirm={handleDelete}
      />
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{orderLabel}</span>
              <StatusBadge status={order.paymentStatus} />
              {order.status ? (
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {order.status}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{order.clientName}</p>
          </div>
        </div>
        <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(order.amountUsd)}</p>
          <p className="text-sm text-gray-500">Order total (USD)</p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> Client & assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Client" value={order.clientName} />
            <Row label="Branch" value={order.branch ?? '—'} />
            <Row label="Assignee" value={order.assignedTo ?? '—'} icon={<User className="h-3.5 w-3.5" />} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" /> Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Order date" value={fmtDate(order.orderDate)} />
            <Row label="Deadline" value={fmtDate(order.deadline)} />
            <Row label="Delivery" value={fmtDate(order.deliveryDate)} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" /> Service & notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Service" value={order.service ?? '—'} />
            <Row label="Invoice ref" value={order.invoiceReference ?? '—'} />
            <Row label="Revisions" value={String(order.revisionCount ?? 0)} />
            {order.deliveryLink ? (
              <div className="flex items-start gap-2">
                <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <span className="text-gray-500">Delivery link</span>
                  <a
                    href={order.deliveryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 break-all text-primary-600 hover:underline dark:text-primary-400"
                  >
                    {order.deliveryLink}
                  </a>
                </div>
              </div>
            ) : null}
            {order.notes ? (
              <div>
                <span className="text-gray-500">Notes</span>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200">
                  {order.notes}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Sales Order"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button isLoading={updateOrder.isPending} onClick={handleEditSave}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Client Name" value={editForm.clientName} onChange={(e) => setEditForm(f => ({ ...f, clientName: e.target.value }))} />
            <Input label="Service" value={editForm.service} onChange={(e) => setEditForm(f => ({ ...f, service: e.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="number" step="0.01" label="Amount (USD)" value={editForm.amountUsd} onChange={(e) => setEditForm(f => ({ ...f, amountUsd: e.target.value }))} />
            <Select
              label="Status"
              value={editForm.status}
              onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
              options={[
                { label: 'New', value: 'New' },
                { label: 'In Progress', value: 'In Progress' },
                { label: 'Completed', value: 'Completed' },
                { label: 'Cancelled', value: 'Cancelled' },
              ]}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Assignee" value={editForm.assignedTo} onChange={(e) => setEditForm(f => ({ ...f, assignedTo: e.target.value }))} />
            <Input label="Branch" value={editForm.branch} onChange={(e) => setEditForm(f => ({ ...f, branch: e.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="date" label="Deadline" value={editForm.deadline} onChange={(e) => setEditForm(f => ({ ...f, deadline: e.target.value }))} />
            <Input label="Invoice Reference" value={editForm.invoiceReference} onChange={(e) => setEditForm(f => ({ ...f, invoiceReference: e.target.value }))} />
          </div>
          <Input label="Delivery Link" value={editForm.deliveryLink} onChange={(e) => setEditForm(f => ({ ...f, deliveryLink: e.target.value }))} />
          <Textarea label="Notes" value={editForm.notes} onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
        </div>
      </Modal>
    </PageTransition>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="flex items-center gap-1 text-right font-medium text-gray-900 dark:text-gray-100">
        {icon}
        {value}
      </span>
    </div>
  );
}

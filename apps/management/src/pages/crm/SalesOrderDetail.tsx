import type { ReactNode } from 'react';
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useSalesOrderRecord, useUpdateSalesOrder, useDeleteSalesOrder } from '@/api/crm';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatCurrency } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import type { StaffUser } from '@/types/auth';
import { ShoppingCart, Calendar, User, Building2, FileText, Link2, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const SENIOR_ROLES = ['CEO', 'CO_MD', 'OP_MANAGER'];

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
  const { data: order, isLoading } = useSalesOrderRecord(id);
  const updateOrder = useUpdateSalesOrder();
  const deleteOrder = useDeleteSalesOrder();
  const user = useAuthStore((s) => s.user) as StaffUser | null;
  const canDelete = SENIOR_ROLES.includes(user?.systemRole ?? '');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const title = order ? `SO-${String(order.orderId).padStart(4, '0')}` : 'Sales order';

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
  }), [title, order?.paymentStatus, canDelete, handleMarkPaid]));

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

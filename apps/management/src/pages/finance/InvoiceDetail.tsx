import { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, Pencil } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useInvoice, useUpdateInvoice, useDeleteInvoice } from '@/api/finance';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCurrency } from '@/hooks/useCurrency';
import { usePermission } from '@/hooks/usePermission';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Overdue', value: 'OVERDUE' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perm = usePermission();
  const { formatCurrency } = useCurrency();
  const { data: invoice, isLoading } = useInvoice(id ?? '');
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();

  const canEdit = perm.can('finance.access');

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({ clientName: '', clientEmail: '', status: '', dueDate: '', notes: '' });

  const openEdit = useCallback(() => {
    if (invoice) {
      setForm({
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        status: invoice.status,
        dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
        notes: '',
      });
    }
    setEditOpen(true);
  }, [invoice]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateInvoice.mutateAsync({
        id,
        clientName: form.clientName,
        clientEmail: form.clientEmail || undefined,
        status: form.status,
        dueDate: form.dueDate ? new Date(`${form.dueDate}T12:00:00Z`).toISOString() : undefined,
      });
      toast.success('Invoice updated');
      setEditOpen(false);
    } catch {
      toast.error('Failed to update invoice');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteInvoice.mutateAsync(id);
      toast.success('Invoice deleted');
      navigate('/finance/invoices');
    } catch {
      toast.error('Failed to delete invoice');
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  useHeaderConfig(useMemo(() => ({
    title: invoice ? `Invoice ${invoice.number}` : 'Invoice',
    breadcrumbs: [
      { label: 'Finance' },
      { label: 'Invoices', href: '/finance/invoices' },
      { label: invoice?.number ?? '...' },
    ],
    actions: canEdit ? [
      { type: 'button' as const, label: 'Edit', icon: Pencil, variant: 'outline' as const, onClick: openEdit },
      {
        type: 'button' as const,
        label: 'Delete',
        icon: Trash2,
        variant: 'danger' as const,
        onClick: () => setDeleteOpen(true),
      },
    ] : [],
  }), [invoice, canEdit, openEdit]));

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </PageTransition>
    );
  }

  if (!invoice) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-gray-500">Invoice not found</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Number" value={invoice.number} />
            <InfoRow label="Status" value={<StatusBadge status={invoice.status} />} />
            <InfoRow label="Issue Date" value={new Date(invoice.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
            <InfoRow label="Due Date" value={new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Client</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Name" value={invoice.clientName} />
            <InfoRow label="Email" value={invoice.clientEmail} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <InfoRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
            <InfoRow label="Tax" value={formatCurrency(invoice.tax)} border />
            <InfoRow label="Total" value={<span className="font-semibold text-lg">{formatCurrency(invoice.total)}</span>} border />
            <InfoRow label="Amount Paid" value={<span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(invoice.paidAmount)}</span>} />
            <InfoRow label="Balance Due" value={<span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(Math.max(0, invoice.total - invoice.paidAmount))}</span>} />
          </div>
        </CardContent>
      </Card>

      {/* Edit modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Invoice"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button isLoading={updateInvoice.isPending} onClick={handleSave}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Client Name" value={form.clientName} onChange={set('clientName')} />
          <Input label="Client Email" type="email" value={form.clientEmail} onChange={set('clientEmail')} />
          <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={set('status')} />
          <Input label="Due Date" type="date" value={form.dueDate} onChange={set('dueDate')} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Invoice"
        message={`Delete invoice ${invoice.number}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteInvoice.isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}

function InfoRow({ label, value, border }: { label: string; value: React.ReactNode; border?: boolean }) {
  return (
    <div className={`flex items-center justify-between${border ? ' border-b border-gray-100 pb-2 dark:border-gray-700' : ''}`}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

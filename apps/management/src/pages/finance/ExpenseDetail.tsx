import { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useExpense, useUpdateExpense, useDeleteExpense } from '@/api/finance';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrency } from '@/hooks/useCurrency';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Paid', value: 'PAID' },
];

const CATEGORY_OPTIONS = [
  { label: 'Office', value: 'Office' },
  { label: 'Software', value: 'Software' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Travel', value: 'Travel' },
  { label: 'Salary', value: 'Salary' },
  { label: 'Utilities', value: 'Utilities' },
  { label: 'Other', value: 'Other' },
];

export default function ExpenseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perm = usePermission();
  const { formatCurrency } = useCurrency();
  const { data: expense, isLoading } = useExpense(id ?? '');
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const canEdit = perm.can('finance.access');

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({ description: '', category: '', status: '', amount: '' });

  const openEdit = useCallback(() => {
    if (expense) {
      setForm({
        description: expense.description,
        category: expense.category,
        status: expense.status,
        amount: String(expense.amount),
      });
    }
    setEditOpen(true);
  }, [expense]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateExpense.mutateAsync({
        id,
        description: form.description || undefined,
        category: form.category || undefined,
        status: form.status || undefined,
        amount: form.amount ? Number(form.amount) : undefined,
      });
      toast.success('Expense updated');
      setEditOpen(false);
    } catch {
      toast.error('Failed to update expense');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteExpense.mutateAsync(id);
      toast.success('Expense deleted');
      navigate('/finance/expenses');
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  useHeaderConfig(useMemo(() => ({
    title: expense?.description ?? 'Expense',
    breadcrumbs: [
      { label: 'Finance' },
      { label: 'Expenses', href: '/finance/expenses' },
      { label: expense?.description ?? '...' },
    ],
    actions: canEdit ? [
      { type: 'button' as const, label: 'Edit', icon: Pencil, variant: 'outline' as const, onClick: openEdit },
      { type: 'button' as const, label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => setDeleteOpen(true) },
    ] : [],
  }), [expense, canEdit, openEdit]));

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

  if (!expense) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-gray-500">Expense not found</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Expense Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Description" value={expense.description} />
          <InfoRow label="Category" value={expense.category} />
          <InfoRow label="Amount" value={<span className="font-semibold text-lg">{formatCurrency(expense.amount)}</span>} />
          <InfoRow label="Submitted By" value={expense.staffName} />
          <InfoRow label="Date" value={new Date(expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
          <InfoRow label="Status" value={<StatusBadge status={expense.status} />} />
          {expense.receiptUrl && (
            <InfoRow label="Receipt" value={
              <a
                href={expense.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary-600 hover:underline dark:text-primary-400"
              >
                View Receipt <ExternalLink className="h-3 w-3" />
              </a>
            } />
          )}
        </CardContent>
      </Card>

      {/* Edit modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Expense"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button isLoading={updateExpense.isPending} onClick={handleSave}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Description" value={form.description} onChange={set('description')} />
          <Select label="Category" options={CATEGORY_OPTIONS} value={form.category} onChange={set('category')} />
          <Input label="Amount (USD)" type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} />
          <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={set('status')} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Expense"
        message={`Delete expense "${expense.description}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteExpense.isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

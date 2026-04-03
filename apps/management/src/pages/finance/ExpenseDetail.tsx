import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useExpense, useDeleteExpense } from '@/api/finance';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/mocks/generators';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

export default function ExpenseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perm = usePermission();
  const { data: expense, isLoading } = useExpense(id ?? '');
  const deleteExpense = useDeleteExpense();

  const headerConfig = useMemo(() => ({
    title: expense?.description ?? 'Expense',
    breadcrumbs: [
      { label: 'Finance' },
      { label: 'Expenses', href: '/finance/expenses' },
      { label: expense?.description ?? '...' },
    ],
    actions: perm.isOps ? [
      {
        type: 'button' as const,
        label: 'Delete',
        variant: 'danger' as const,
        onClick: async () => {
          if (!id || !confirm('Delete this expense?')) return;
          try {
            await deleteExpense.mutateAsync(id);
            toast.success('Expense deleted');
            navigate('/finance/expenses');
          } catch {
            toast.error('Failed to delete expense');
          }
        },
      },
    ] : [],
  }), [expense, perm.isOps, id]);

  useHeaderConfig(headerConfig);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </PageTransition>
    );
  }

  if (!expense) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-gray-500">Expense not found</p>
          <Button variant="outline" onClick={() => navigate('/finance/expenses')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Expenses
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/finance/expenses')}>
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Description</span>
            <span className="font-medium">{expense.description}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Category</span>
            <span className="text-sm">{expense.category}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Amount</span>
            <span className="font-semibold text-lg">{formatCurrency(expense.amount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Submitted By</span>
            <span className="text-sm">{expense.staffName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Date</span>
            <span className="text-sm">{new Date(expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <StatusBadge status={expense.status} />
          </div>
          {expense.receiptUrl && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Receipt</span>
              <a
                href={expense.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary-600 hover:underline dark:text-primary-400"
              >
                View Receipt <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}

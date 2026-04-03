import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useInvoice, useDeleteInvoice } from '@/api/finance';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/mocks/generators';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perm = usePermission();
  const { data: invoice, isLoading } = useInvoice(id ?? '');
  const deleteInvoice = useDeleteInvoice();

  const headerConfig = useMemo(() => ({
    title: invoice ? `Invoice ${invoice.number}` : 'Invoice',
    breadcrumbs: [
      { label: 'Finance' },
      { label: 'Invoices', href: '/finance/invoices' },
      { label: invoice?.number ?? '...' },
    ],
    actions: perm.isOps ? [
      {
        type: 'button' as const,
        label: 'Delete',
        icon: Trash2,
        variant: 'danger' as const,
        onClick: async () => {
          if (!id || !confirm('Delete this invoice?')) return;
          try {
            await deleteInvoice.mutateAsync(id);
            toast.success('Invoice deleted');
            navigate('/finance/invoices');
          } catch {
            toast.error('Failed to delete invoice');
          }
        },
      },
    ] : [],
  }), [invoice, perm.isOps, id]);

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

  if (!invoice) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-gray-500">Invoice not found</p>
          <Button variant="outline" onClick={() => navigate('/finance/invoices')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/finance/invoices')}>
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
      </Button>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Number</span>
              <span className="font-medium">{invoice.number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <StatusBadge status={invoice.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Issue Date</span>
              <span className="text-sm">{new Date(invoice.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Due Date</span>
              <span className="text-sm">{new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Name</span>
              <span className="font-medium">{invoice.clientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm">{invoice.clientEmail}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-sm text-gray-500">Tax</span>
              <span>{formatCurrency(invoice.tax)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="font-semibold">Total</span>
              <span className="font-semibold text-lg">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Amount Paid</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Balance Due</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatCurrency(Math.max(0, invoice.total - invoice.paidAmount))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePayrollEntry, useMarkPayrollPaid } from '@/api/payroll';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/format';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function PayrollDetail() {
  const { id } = useParams<{ id: string }>();
  const perm = usePermission();
  const { data: entry, isLoading } = usePayrollEntry(id ?? '');
  const markPaid = useMarkPayrollPaid();

  const headerConfig = useMemo(() => ({
    title: entry ? `${entry.staffName} — ${MONTH_NAMES[(entry.month ?? 1) - 1]} ${entry.year}` : 'Payroll Detail',
    breadcrumbs: [
      { label: 'Payroll', href: '/payroll' },
      { label: entry?.staffName ?? '...' },
    ],
    actions: perm.isCEO && entry?.status !== 'PAID' ? [
      {
        type: 'button' as const,
        label: 'Mark as Paid',
        onClick: async () => {
          if (!id) return;
          try {
            await markPaid.mutateAsync(id);
            toast.success('Marked as paid');
          } catch {
            toast.error('Failed to mark as paid');
          }
        },
      },
    ] : [],
  }), [entry, perm.isCEO, id]);

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

  if (!entry) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-gray-500">Payroll record not found</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Staff Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Name</span>
              <span className="font-medium">{entry.staffName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Role</span>
              <Badge variant="default">{entry.role.replace('_', ' ')}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Branch</span>
              <span className="text-sm">{entry.branch}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Month</span>
              <span className="font-medium">{MONTH_NAMES[(entry.month ?? 1) - 1]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Year</span>
              <span className="font-medium">{entry.year}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <StatusBadge status={entry.status} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pay Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-sm text-gray-500">Base Salary</span>
              <span>{formatCurrency(entry.baseSalary)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-sm text-gray-500">Bonus</span>
              <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(entry.bonus)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-sm text-gray-500">Deductions</span>
              <span className="text-red-500 dark:text-red-400">-{formatCurrency(entry.deductions)}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="font-semibold">Net Pay</span>
              <span className="font-bold text-xl text-gray-900 dark:text-gray-100">{formatCurrency(entry.netPay)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}

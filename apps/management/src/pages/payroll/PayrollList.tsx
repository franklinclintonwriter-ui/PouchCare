import { useMemo, useState } from 'react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePayroll } from '@/api/payroll';
import { PageTransition } from '@/components/ui/PageTransition';
import { StatsRow } from '@/components/shared/StatsRow';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/mocks/generators';
import { Wallet, Users, Gift, TrendingUp } from 'lucide-react';
import type { PayrollEntry } from '@/types/models';

const roleVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  CEO: 'danger',
  CO_MD: 'danger',
  OP_MANAGER: 'warning',
  HR_MANAGER: 'info',
  BRANCH_MANAGER: 'primary',
  STAFF: 'default',
  INTERN: 'success',
};

export default function PayrollList() {
  const now = new Date();
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePayroll(now.getMonth() + 1, now.getFullYear(), page, 20);
  const entries = data?.data ?? [];
  const meta = data?.meta;

  const stats = useMemo(() => {
    const totalPayroll = entries.reduce((s, e) => s + e.netPay, 0);
    const avgSalary = entries.length > 0 ? Math.round(totalPayroll / entries.length) : 0;
    const headcount = entries.length;
    const totalBonus = entries.reduce((s, e) => s + e.bonus, 0);
    return { totalPayroll, avgSalary, headcount, totalBonus };
  }, [entries]);

  useHeaderConfig({
    title: 'Payroll',
    breadcrumbs: [{ label: 'Payroll' }],
  });

  const columns: Column<PayrollEntry>[] = [
    { key: 'staffName', label: 'Staff', render: (row) => (
      <span className="font-semibold text-gray-900 dark:text-gray-100">{row.staffName}</span>
    )},
    { key: 'role', label: 'Role', render: (row) => (
      <Badge variant={roleVariant[row.role] ?? 'default'}>{row.role.replace('_', ' ')}</Badge>
    )},
    { key: 'baseSalary', label: 'Base Salary', align: 'right', render: (row) => (
      <span>{formatCurrency(row.baseSalary)}</span>
    )},
    { key: 'bonus', label: 'Bonus', align: 'right', render: (row) => (
      <span className={row.bonus > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}>{formatCurrency(row.bonus)}</span>
    )},
    { key: 'deductions', label: 'Deductions', align: 'right', render: (row) => (
      <span className="text-red-500 dark:text-red-400">-{formatCurrency(row.deductions)}</span>
    )},
    { key: 'netPay', label: 'Net Pay', align: 'right', render: (row) => (
      <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(row.netPay)}</span>
    )},
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <PageTransition className="space-y-6">
      <StatsRow
        loading={isLoading}
        items={[
          { title: 'Total Payroll', value: formatCurrency(stats.totalPayroll), icon: <Wallet className="h-4 w-4" />, iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
          { title: 'Avg Salary', value: formatCurrency(stats.avgSalary), icon: <TrendingUp className="h-4 w-4" />, iconBg: 'bg-purple-100 dark:bg-purple-900/30' },
          { title: 'Headcount', value: stats.headcount, icon: <Users className="h-4 w-4" />, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { title: 'Total Bonus', value: formatCurrency(stats.totalBonus), icon: <Gift className="h-4 w-4" />, iconBg: 'bg-amber-100 dark:bg-amber-900/30' },
        ]}
      />

      <DataTable<PayrollEntry>
        columns={columns}
        data={entries}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        getRowId={(row) => row.id}
      />
    </PageTransition>
  );
}

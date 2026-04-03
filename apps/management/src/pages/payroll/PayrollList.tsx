import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePayroll, useCreatePayroll, useMarkPayrollPaid } from '@/api/payroll';
import { PageTransition } from '@/components/ui/PageTransition';
import { StatsRow } from '@/components/shared/StatsRow';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/mocks/generators';
import { Wallet, Users, Gift, TrendingUp, Plus } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import type { PayrollEntry } from '@/types/models';
import { toast } from 'sonner';

const roleVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  CEO: 'danger',
  CO_MD: 'danger',
  OP_MANAGER: 'warning',
  HR_MANAGER: 'info',
  BRANCH_MANAGER: 'primary',
  STAFF: 'default',
  INTERN: 'success',
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function PayrollList() {
  const navigate = useNavigate();
  const now = new Date();
  const [page, setPage] = useState(1);
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [showCreate, setShowCreate] = useState(false);
  const perm = usePermission();

  const { data, isLoading } = usePayroll(filterMonth, filterYear, page, 20);
  const entries = data?.data ?? [];
  const meta = data?.meta;

  const createPayroll = useCreatePayroll();
  const markPaid = useMarkPayrollPaid();

  const [form, setForm] = useState({
    memberId: '',
    month: MONTHS[now.getMonth()],
    year: now.getFullYear(),
    baseSalary: '',
    bonus: '0',
    deductions: '0',
    paymentMethod: '',
    notes: '',
  });

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
    actions: perm.isOps ? [
      { type: 'button' as const, label: 'Process Payroll', icon: Plus, onClick: () => setShowCreate(true) },
    ] : [],
  });

  const handleCreate = async () => {
    if (!form.memberId || !form.baseSalary) {
      toast.error('Staff ID and base salary are required');
      return;
    }
    try {
      await createPayroll.mutateAsync({
        memberId: form.memberId,
        month: form.month,
        year: Number(form.year),
        baseSalary: Number(form.baseSalary),
        bonus: Number(form.bonus) || 0,
        deductions: Number(form.deductions) || 0,
        paymentMethod: form.paymentMethod || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Payroll record created');
      setShowCreate(false);
      setForm({ memberId: '', month: MONTHS[now.getMonth()], year: now.getFullYear(), baseSalary: '', bonus: '0', deductions: '0', paymentMethod: '', notes: '' });
    } catch {
      toast.error('Failed to create payroll record');
    }
  };

  const handleMarkPaid = async (row: PayrollEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markPaid.mutateAsync(row.id);
      toast.success('Marked as paid');
    } catch {
      toast.error('Failed to mark as paid');
    }
  };

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
    ...(perm.isCEO ? [{
      key: 'actions' as keyof PayrollEntry,
      label: 'Actions',
      render: (row: PayrollEntry) => row.status !== 'PAID' ? (
        <Button
          size="sm"
          variant="outline"
          isLoading={markPaid.isPending}
          onClick={(e) => handleMarkPaid(row, e)}
        >
          Mark Paid
        </Button>
      ) : null,
    }] : []),
  ];

  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

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
        onRowClick={(row) => navigate(`/payroll/${row.id}`)}
      />

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Process Payroll"
        description="Create a new payroll record for a staff member"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button isLoading={createPayroll.isPending} onClick={handleCreate}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Staff Member ID *</label>
            <input className={inputCls} placeholder="Staff UUID" value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Month</label>
              <select className={inputCls} value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Year</label>
              <input className={inputCls} type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Base Salary (USD) *</label>
            <input className={inputCls} type="number" min="0" placeholder="0.00" value={form.baseSalary} onChange={e => setForm(f => ({ ...f, baseSalary: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Bonus (USD)</label>
              <input className={inputCls} type="number" min="0" value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Deductions (USD)</label>
              <input className={inputCls} type="number" min="0" value={form.deductions} onChange={e => setForm(f => ({ ...f, deductions: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Payment Method</label>
            <input className={inputCls} placeholder="e.g. Bank Transfer" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea className={inputCls} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}

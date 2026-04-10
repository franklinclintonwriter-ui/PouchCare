import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePayroll, useCreatePayroll, useMarkPayrollPaid, useUpdatePayroll, useDeletePayroll } from '@/api/payroll';
import { useStaffList } from '@/api/staff';
import { PageTransition } from '@/components/ui/PageTransition';
import { StatsRow } from '@/components/shared/StatsRow';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Dropdown, type DropdownItem } from '@/components/ui/Dropdown';
import { useCurrency } from '@/hooks/useCurrency';
import { Wallet, Users, Gift, TrendingUp, Plus, CalendarRange, RotateCcw, Edit, Trash2 } from 'lucide-react';
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
  const { formatCurrency } = useCurrency();
  const now = new Date();
  const [page, setPage] = useState(1);
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [showCreate, setShowCreate] = useState(false);
  const perm = usePermission();

  useEffect(() => {
    setPage(1);
  }, [filterMonth, filterYear]);

  const { data, isLoading, isError, error } = usePayroll({ month: filterMonth, year: filterYear, page, limit: 20 });
  const entries = data?.data ?? [];
  const meta = data?.meta;

  const createPayroll = useCreatePayroll();
  const markPaid = useMarkPayrollPaid();
  const updatePayroll = useUpdatePayroll();
  const deletePayroll = useDeletePayroll();

  const { data: staffData } = useStaffList({ limit: 500, status: 'Active' });
  const staffList = staffData?.data ?? [];

  const [form, setForm] = useState({
    staffMemberId: '',
    month: MONTHS[now.getMonth()],
    year: now.getFullYear(),
    baseSalary: '',
    bonus: '0',
    deductions: '0',
    paymentMethod: '',
    notes: '',
  });

  const [editEntry, setEditEntry] = useState<PayrollEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<PayrollEntry | null>(null);

  const stats = useMemo(() => {
    const totalPayroll = entries.reduce((s, e) => s + e.netPay, 0);
    const avgSalary = entries.length > 0 ? Math.round(totalPayroll / entries.length) : 0;
    const headcount = entries.length;
    const totalBonus = entries.reduce((s, e) => s + e.bonus, 0);
    return { totalPayroll, avgSalary, headcount, totalBonus };
  }, [entries]);

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => ({ label: String(y - 3 + i), value: String(y - 3 + i) }));
  }, []);

  const monthOptions = useMemo(() =>
    MONTHS.map((m, i) => ({ label: m, value: String(i + 1) })),
  []);

  const onMonthChange = useCallback((v: string) => { setFilterMonth(Number(v)); setPage(1); }, []);
  const onYearChange = useCallback((v: string) => { setFilterYear(Number(v)); setPage(1); }, []);
  const onThisMonth = useCallback(() => { setFilterMonth(now.getMonth() + 1); setFilterYear(now.getFullYear()); setPage(1); }, [now]);

  useHeaderConfig(useMemo(() => ({
    title: 'Payroll',
    breadcrumbs: [{ label: 'Payroll' }],
    actions: [
      { type: 'filter' as const, label: 'Month', icon: CalendarRange, options: monthOptions, value: String(filterMonth), onChange: onMonthChange },
      { type: 'filter' as const, label: 'Year', options: yearOptions, value: String(filterYear), onChange: onYearChange },
      { type: 'button' as const, label: 'This month', icon: RotateCcw, variant: 'outline' as const, onClick: onThisMonth },
      ...(perm.can('payroll.access') ? [
        { type: 'button' as const, label: 'Process Payroll', icon: Plus, onClick: () => setShowCreate(true) },
      ] : []),
    ],
  }), [monthOptions, yearOptions, filterMonth, filterYear, onMonthChange, onYearChange, onThisMonth, perm]));

  const handleCreate = async () => {
    if (!form.staffMemberId || !form.baseSalary) {
      toast.error('Staff member and base salary are required');
      return;
    }
    try {
      await createPayroll.mutateAsync({
        staffMemberId: form.staffMemberId,
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
      setForm({ staffMemberId: '', month: MONTHS[now.getMonth()], year: now.getFullYear(), baseSalary: '', bonus: '0', deductions: '0', paymentMethod: '', notes: '' });
    } catch {
      toast.error('Failed to create payroll record');
    }
  };

  const handleUpdate = async () => {
    if (!editEntry) return;
    try {
      await updatePayroll.mutateAsync({
        id: editEntry.id,
        baseSalary: editEntry.baseSalary,
        bonus: editEntry.bonus,
        deductions: editEntry.deductions,
      });
      toast.success('Payroll record updated');
      setEditEntry(null);
    } catch {
      toast.error('Failed to update payroll record');
    }
  };

  const handleDelete = async () => {
    if (!deleteEntry) return;
    try {
      await deletePayroll.mutateAsync(deleteEntry.id);
      toast.success('Payroll record deleted');
      setDeleteEntry(null);
    } catch {
      toast.error('Failed to delete payroll record');
    }
  };

  const handleMarkPaid = async (row: PayrollEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markPaid.mutateAsync({ id: row.id });
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
    ...(perm.can('payroll.access') ? [{
      key: 'actions' as keyof PayrollEntry,
      label: '',
      width: '100px',
      render: (row: PayrollEntry) => {
        const items: DropdownItem[] = [
          { label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: () => setEditEntry(row) },
          ...(perm.isCEO ? [{ label: 'Delete', icon: <Trash2 className="h-4 w-4" />, onClick: () => setDeleteEntry(row), variant: 'danger' as const }] : []),
        ];
        return (
          <div className="flex items-center gap-1">
            {perm.isCEO && row.status !== 'PAID' && (
              <Button
                size="sm"
                variant="outline"
                isLoading={markPaid.isPending}
                onClick={(e) => handleMarkPaid(row, e)}
              >
                Mark Paid
              </Button>
            )}
            <Dropdown items={items} />
          </div>
        );
      },
    }] : []),
  ];

  return (
    <PageTransition className="space-y-6">
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error instanceof Error ? error.message : 'Failed to load payroll'}
        </div>
      )}

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
          <Select
            label="Staff Member *"
            value={form.staffMemberId}
            onChange={e => setForm(f => ({ ...f, staffMemberId: e.target.value }))}
            options={[
              { label: 'Select staff member...', value: '' },
              ...staffList.map(s => ({ label: `${s.name} (${s.email})`, value: s.id })),
            ]}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Month"
              value={form.month}
              onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
              options={MONTHS.map(m => ({ label: m, value: m }))}
            />
            <Input
              label="Year"
              type="number"
              value={String(form.year)}
              onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
            />
          </div>
          <Input
            label="Base Salary (USD) *"
            type="number"
            min="0"
            placeholder="0.00"
            value={form.baseSalary}
            onChange={e => setForm(f => ({ ...f, baseSalary: e.target.value }))}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Bonus (USD)"
              type="number"
              min="0"
              value={form.bonus}
              onChange={e => setForm(f => ({ ...f, bonus: e.target.value }))}
            />
            <Input
              label="Deductions (USD)"
              type="number"
              min="0"
              value={form.deductions}
              onChange={e => setForm(f => ({ ...f, deductions: e.target.value }))}
            />
          </div>
          <Input
            label="Payment Method"
            placeholder="e.g. Bank Transfer"
            value={form.paymentMethod}
            onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
          />
          <Textarea
            label="Notes"
            rows={2}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!editEntry}
        onClose={() => setEditEntry(null)}
        title="Edit Payroll"
        description={`Edit payroll for ${editEntry?.staffName}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditEntry(null)}>Cancel</Button>
            <Button isLoading={updatePayroll.isPending} onClick={handleUpdate}>Save Changes</Button>
          </>
        }
      >
        {editEntry && (
          <div className="space-y-4">
            <Input
              label="Base Salary (USD)"
              type="number"
              min="0"
              value={String(editEntry.baseSalary)}
              onChange={e => setEditEntry(prev => prev ? { ...prev, baseSalary: Number(e.target.value) } : null)}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Bonus (USD)"
                type="number"
                min="0"
                value={String(editEntry.bonus)}
                onChange={e => setEditEntry(prev => prev ? { ...prev, bonus: Number(e.target.value) } : null)}
              />
              <Input
                label="Deductions (USD)"
                type="number"
                min="0"
                value={String(editEntry.deductions)}
                onChange={e => setEditEntry(prev => prev ? { ...prev, deductions: Number(e.target.value) } : null)}
              />
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-500">
                Net Pay: <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(editEntry.baseSalary + editEntry.bonus - editEntry.deductions)}
                </span>
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteEntry}
        onClose={() => setDeleteEntry(null)}
        title="Delete Payroll Record"
        message={`Are you sure you want to delete the payroll record for ${deleteEntry?.staffName}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deletePayroll.isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}

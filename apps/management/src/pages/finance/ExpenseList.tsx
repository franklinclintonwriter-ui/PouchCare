import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCreateExpense, useExpenses } from '@/api/finance';
import { PageTransition } from '@/components/ui/PageTransition';
import { StatsRow } from '@/components/shared/StatsRow';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/mocks/generators';
import { Receipt, CheckCircle, Clock, Tag, Plus } from 'lucide-react';
import type { Expense } from '@/types/models';
import { toast } from 'sonner';

const categoryVariants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  Marketing: 'primary',
  Development: 'info',
  Operations: 'success',
  Sales: 'warning',
  Support: 'danger',
};

export default function ExpenseList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Operations');
  const createExpense = useCreateExpense();

  const { data, isLoading } = useExpenses({ q: search, category, page, limit: 20 });
  const expenses = data?.data ?? [];
  const meta = data?.meta;

  const { data: allData } = useExpenses({});
  const allExpenses = allData?.data ?? [];

  const stats = useMemo(() => {
    const totalMTD = allExpenses.reduce((s, e) => s + e.amount, 0);
    const approved = allExpenses.filter(e => e.status === 'APPROVED_MGR' || e.status === 'VERIFIED').reduce((s, e) => s + e.amount, 0);
    const pending = allExpenses.filter(e => e.status === 'WAITING' || e.status === 'SUBMITTED').reduce((s, e) => s + e.amount, 0);
    return { totalMTD, approved, pending };
  }, [allExpenses]);

  const categories = useMemo(() => {
    const unique = [...new Set(allExpenses.map(e => e.category))];
    return [{ label: 'All Categories', value: '' }, ...unique.map(c => ({ label: c, value: c }))];
  }, [allExpenses]);

  useHeaderConfig({
    title: 'Expenses',
    breadcrumbs: [{ label: 'Finance' }, { label: 'Expenses' }],
    actions: [
      { type: 'button', label: 'New Expense', icon: Plus, onClick: () => setOpenCreate(true) },
      { type: 'search', placeholder: 'Search expenses...', value: search, onChange: setSearch },
      { type: 'filter', label: 'Category', icon: Tag, value: category, onChange: setCategory, options: categories },
    ],
  });

  const columns: Column<Expense>[] = [
    { key: 'description', label: 'Description', render: (row) => (
      <span className="font-medium text-gray-900 dark:text-gray-100">{row.description}</span>
    )},
    { key: 'category', label: 'Category', render: (row) => (
      <Badge variant={categoryVariants[row.category] ?? 'default'}>{row.category}</Badge>
    )},
    { key: 'amount', label: 'Amount', align: 'right', render: (row) => (
      <span className="font-medium">{formatCurrency(row.amount)}</span>
    )},
    { key: 'staffName', label: 'Staff' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <PageTransition className="space-y-6">
      <StatsRow
        loading={isLoading}
        items={[
          { title: 'Total MTD', value: formatCurrency(stats.totalMTD), icon: <Receipt className="h-4 w-4" />, iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
          { title: 'Approved', value: formatCurrency(stats.approved), icon: <CheckCircle className="h-4 w-4" />, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { title: 'Pending', value: formatCurrency(stats.pending), icon: <Clock className="h-4 w-4" />, iconBg: 'bg-amber-100 dark:bg-amber-900/30' },
        ]}
      />

      <DataTable<Expense>
        columns={columns}
        data={expenses}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/finance/expenses/${row.id}`)}
      />

      <Modal
        isOpen={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Create Expense"
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button
              size="sm"
              isLoading={createExpense.isPending}
              onClick={async () => {
                if (!description.trim() || !amount) return toast.error('Description and amount are required');
                try {
                  await createExpense.mutateAsync({
                    title: description.trim(),
                    category: expCategory,
                    amountUsd: Number(amount),
                    expenseDate: new Date().toISOString(),
                    status: 'Pending',
                  });
                  toast.success('Expense created');
                  setOpenCreate(false);
                  setDescription('');
                  setAmount('');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Create failed');
                }
              }}
            >
              Create
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input label="Category" value={expCategory} onChange={(e) => setExpCategory(e.target.value)} />
          <Input type="number" label="Amount (USD)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </Modal>
    </PageTransition>
  );
}

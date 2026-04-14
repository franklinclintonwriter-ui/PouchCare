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
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/hooks/useCurrency';
import { Receipt, CheckCircle, Clock, Tag, Plus, LayoutGrid, Table2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Expense } from '@/types/models';
import { toast } from 'sonner';

const categoryVariants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  Marketing: 'primary',
  Development: 'info',
  Operations: 'success',
  Sales: 'warning',
  Support: 'danger',
};

type ViewMode = 'table' | 'cards';

export default function ExpenseList() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Operations');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptUrl, setReceiptUrl] = useState('');
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
      {
        type: 'toggle' as const,
        value: viewMode,
        onChange: (v: string) => setViewMode(v === 'cards' ? 'cards' : 'table'),
        options: [
          { value: 'table', label: 'Table', icon: Table2 },
          { value: 'cards', label: 'Cards', icon: LayoutGrid },
        ],
      },
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

      {viewMode === 'table' ? (
        <DataTable<Expense>
          columns={columns}
          data={expenses}
          isLoading={isLoading}
          pagination={meta}
          onPageChange={setPage}
          getRowId={(row) => row.id}
          onRowClick={(row) => navigate(`/finance/expenses/${row.id}`)}
          emptyTitle="No expenses found"
          emptyDescription="Submit your first expense to start tracking."
        />
      ) : (
        <div className="rounded-xl border border-gray-200/80 bg-white shadow-soft dark:border-gray-700/60 dark:bg-gray-800/80">
          {isLoading ? (
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={<Receipt />}
              title="No expenses found"
              description="Submit your first expense to start tracking."
              className="py-12"
            />
          ) : (
            <>
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
                {expenses.map((exp) => (
                  <Card
                    key={exp.id}
                    hover
                    padding="md"
                    onClick={() => navigate(`/finance/expenses/${exp.id}`)}
                    className="min-h-[44px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {exp.description}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                          {exp.staffName}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={exp.status} size="sm" />
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                          {formatCurrency(exp.amount)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs dark:border-gray-700/60">
                      <Badge variant={categoryVariants[exp.category] ?? 'default'} size="sm">
                        {exp.category}
                      </Badge>
                      <span className="text-gray-500 dark:text-gray-400 tabular-nums">
                        {new Date(exp.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>

              {meta && meta.totalPages > 0 ? (
                <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700/60 lg:px-5">
                  <Pagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    total={meta.total}
                    onPageChange={setPage}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

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
                    expenseDate: expDate ? new Date(`${expDate}T12:00:00Z`).toISOString() : new Date().toISOString(),
                    receiptUrl: receiptUrl.trim() || undefined,
                    status: 'WAITING',
                  });
                  toast.success('Expense created');
                  setOpenCreate(false);
                  setDescription('');
                  setAmount('');
                  setExpDate(new Date().toISOString().split('T')[0]);
                  setReceiptUrl('');
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
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Category"
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value)}
              options={[
                { label: 'Operations', value: 'Operations' },
                { label: 'Marketing', value: 'Marketing' },
                { label: 'Development', value: 'Development' },
                { label: 'Sales', value: 'Sales' },
                { label: 'Support', value: 'Support' },
                { label: 'Other', value: 'Other' },
              ]}
            />
            <Input type="number" min="0" step="0.01" label="Amount (USD)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="date" label="Date" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
            <Input label="Receipt URL" placeholder="https://..." value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} />
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}

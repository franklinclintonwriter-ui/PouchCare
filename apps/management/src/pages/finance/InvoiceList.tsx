import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCreateInvoice, useInvoices } from '@/api/finance';
import { PageTransition } from '@/components/ui/PageTransition';
import { StatsRow } from '@/components/shared/StatsRow';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/hooks/useCurrency';
import { DollarSign, FileText, CheckCircle, AlertTriangle, CircleDot, Plus, LayoutGrid, Table2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Invoice } from '@/types/models';
import { toast } from 'sonner';

type ViewMode = 'table' | 'cards';

export default function InvoiceList() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [amountUsd, setAmountUsd] = useState('');
  const [service, setService] = useState('');
  const [dueDate, setDueDate] = useState('');
  const createInvoice = useCreateInvoice();

  const { data, isLoading } = useInvoices({ q: search, status, page, limit: 20 });
  const invoices = data?.data ?? [];
  const meta = data?.meta;

  // Stats from all invoices (unfiltered query for totals)
  const { data: allData } = useInvoices({});
  const allInvoices = allData?.data ?? [];

  const stats = useMemo(() => {
    const total = allInvoices.reduce((s, i) => s + i.total, 0);
    const paid = allInvoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.total, 0);
    const unpaid = allInvoices.filter(i => i.status === 'UNPAID' || i.status === 'PARTIAL').reduce((s, i) => s + i.total - i.paidAmount, 0);
    const overdue = allInvoices.filter(i => i.status === 'OVERDUE').length;
    return { total, paid, unpaid, overdue };
  }, [allInvoices]);

  useHeaderConfig({
    title: 'Invoices',
    breadcrumbs: [{ label: 'Finance' }, { label: 'Invoices' }],
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
      { type: 'button', label: 'New Invoice', icon: Plus, onClick: () => setOpenCreate(true) },
      { type: 'search', placeholder: 'Search invoices...', value: search, onChange: setSearch },
      {
        type: 'filter', label: 'Status', icon: CircleDot, value: status, onChange: setStatus,
        options: [
          { label: 'All Statuses', value: '' },
          { label: 'Paid', value: 'PAID' },
          { label: 'Unpaid', value: 'UNPAID' },
          { label: 'Partial', value: 'PARTIAL' },
          { label: 'Overdue', value: 'OVERDUE' },
          { label: 'Refunded', value: 'REFUNDED' },
        ],
      },
    ],
  });

  const columns: Column<Invoice>[] = [
    { key: 'number', label: 'Invoice #', sticky: true, render: (row) => (
      <span className="font-semibold text-gray-900 dark:text-gray-100">{row.number}</span>
    )},
    { key: 'clientName', label: 'Client' },
    { key: 'total', label: 'Amount', align: 'right', render: (row) => (
      <span className="font-medium">{formatCurrency(row.total)}</span>
    )},
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'issueDate', label: 'Issue Date' },
    { key: 'dueDate', label: 'Due Date' },
  ];

  return (
    <PageTransition className="space-y-6">
      <StatsRow
        loading={isLoading}
        items={[
          { title: 'Total Invoiced', value: formatCurrency(stats.total), icon: <FileText className="h-4 w-4" />, iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
          { title: 'Paid', value: formatCurrency(stats.paid), icon: <CheckCircle className="h-4 w-4" />, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { title: 'Unpaid', value: formatCurrency(stats.unpaid), icon: <DollarSign className="h-4 w-4" />, iconBg: 'bg-amber-100 dark:bg-amber-900/30' },
          { title: 'Overdue', value: stats.overdue, icon: <AlertTriangle className="h-4 w-4" />, iconBg: 'bg-red-100 dark:bg-red-900/30' },
        ]}
      />

      {viewMode === 'table' ? (
        <DataTable<Invoice>
          columns={columns}
          data={invoices}
          isLoading={isLoading}
          pagination={meta}
          onPageChange={setPage}
          getRowId={(row) => row.id}
          onRowClick={(row) => navigate(`/finance/invoices/${row.id}`)}
          emptyTitle="No invoices found"
          emptyDescription="Create your first invoice to get started."
        />
      ) : (
        <div className="rounded-xl border border-gray-200/80 bg-white shadow-soft dark:border-gray-700/60 dark:bg-gray-800/80">
          {isLoading ? (
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title="No invoices found"
              description="Create your first invoice to get started."
              className="py-12"
            />
          ) : (
            <>
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
                {invoices.map((inv) => (
                  <Card
                    key={inv.id}
                    hover
                    padding="md"
                    onClick={() => navigate(`/finance/invoices/${inv.id}`)}
                    className="min-h-[44px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {inv.number}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                          {inv.clientName} · {inv.clientEmail}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={inv.status} size="sm" />
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                          {formatCurrency(inv.total)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs dark:border-gray-700/60">
                      <span className="text-gray-500 dark:text-gray-400 tabular-nums">
                        Issue: {new Date(inv.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 tabular-nums">
                        Due: {new Date(inv.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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
        title="Create Invoice"
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button
              size="sm"
              isLoading={createInvoice.isPending}
              onClick={async () => {
                if (!clientName.trim() || !amountUsd) return toast.error('Client and amount are required');
                try {
                  await createInvoice.mutateAsync({
                    clientName: clientName.trim(),
                    clientEmail: clientEmail || undefined,
                    amountUsd: Number(amountUsd),
                    service: service.trim() || 'General',
                    status: 'UNPAID',
                    issueDate: new Date().toISOString(),
                    dueDate: dueDate || undefined,
                  });
                  toast.success('Invoice created');
                  setOpenCreate(false);
                  setClientName('');
                  setClientEmail('');
                  setAmountUsd('');
                  setService('');
                  setDueDate('');
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
            <Input label="Client Email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="number" min="0" step="0.01" label="Amount (USD)" value={amountUsd} onChange={(e) => setAmountUsd(e.target.value)} required />
            <Input label="Service" placeholder="e.g. Web Development" value={service} onChange={(e) => setService(e.target.value)} />
          </div>
          <Input type="date" label="Due Date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </Modal>
    </PageTransition>
  );
}

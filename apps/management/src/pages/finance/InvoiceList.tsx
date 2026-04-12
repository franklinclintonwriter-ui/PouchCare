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
import { DollarSign, FileText, CheckCircle, AlertTriangle, CircleDot, Plus } from 'lucide-react';
import type { Invoice } from '@/types/models';
import { toast } from 'sonner';

export default function InvoiceList() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
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
                    status: 'Draft',
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

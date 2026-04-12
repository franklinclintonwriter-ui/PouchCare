import { useState, useMemo, useCallback } from 'react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCommissions, useCommissionSummary, usePayoutsData, useRequestPayout } from '@/api/portal';
import { useCurrency } from '@/hooks/useCurrency';
import { PageTransition } from '@/components/ui/PageTransition';
import { StatsRow } from '@/components/shared/StatsRow';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Filter } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { CommissionRecord } from '@/types/models';
import type { PayoutRecord } from '@/types/models';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending Hold', value: 'PENDING_HOLD' },
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'Paid Out', value: 'PAID_OUT' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function Commissions() {
  const { formatCurrency } = useCurrency();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'PAYONEER' | 'USDT_TRC20' | 'BINANCE'>('PAYONEER');
  const [payoutDetails, setPayoutDetails] = useState('');

  const onStatusChange = useCallback((v: string) => { setStatusFilter(v); setPage(1); }, []);
  const { data: summary } = useCommissionSummary();

  useHeaderConfig(useMemo(() => ({
    title: 'Commissions',
    breadcrumbs: [
      { label: 'Dashboard', href: '/portal' },
      { label: 'Commissions' },
    ],
    actions: [
      { type: 'filter' as const, label: 'Status', icon: Filter, options: STATUS_OPTIONS, value: statusFilter, onChange: onStatusChange },
    ],
  }), [statusFilter, onStatusChange]));

  const { data, isLoading } = useCommissions({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });

  // Stats from all commissions
  const { data: allData } = useCommissions({ limit: 100 });
  const { data: payoutsData } = usePayoutsData({ limit: 50 });
  const requestPayout = useRequestPayout();
  const stats = useMemo(() => {
    const all = allData?.data ?? [];
    const total = all.reduce((s, c) => s + c.amount, 0);
    const available = all.filter(c => c.status === 'AVAILABLE').reduce((s, c) => s + c.amount, 0);
    const pending = all.filter(c => c.status === 'PENDING_HOLD').reduce((s, c) => s + c.amount, 0);
    const paid = all.filter(c => c.status === 'PAID_OUT').reduce((s, c) => s + c.amount, 0);
    return { total, available, pending, paid };
  }, [allData]);

  const columns: Column<CommissionRecord>[] = [
    { key: 'orderRef', label: 'Order Ref', render: (r) => <span className="font-mono text-xs font-medium">{r.orderRef}</span> },
    { key: 'amount', label: 'Amount', align: 'right', render: (r) => formatCurrency(r.amount) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: 'earnedDate', label: 'Earned', render: (r) => <span className="text-xs text-gray-500">{r.earnedDate}</span> },
    { key: 'availableDate', label: 'Available', render: (r) => <span className="text-xs text-gray-500">{r.availableDate ?? '—'}</span> },
    { key: 'paidDate', label: 'Paid', render: (r) => <span className="text-xs text-gray-500">{r.paidDate ?? '—'}</span> },
  ];

  const payoutColumns: Column<PayoutRecord>[] = [
    { key: 'requestedDate', label: 'Requested', render: (r) => <span className="text-xs text-gray-500">{r.requestedDate}</span> },
    { key: 'amount', label: 'Amount', align: 'right', render: (r) => formatCurrency(r.amount) },
    { key: 'method', label: 'Method', render: (r) => <span className="text-xs text-gray-600 dark:text-gray-300">{r.method.replace('_', ' ')}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: 'processedDate', label: 'Processed', render: (r) => <span className="text-xs text-gray-500">{r.processedDate ?? '—'}</span> },
  ];

  return (
    <PageTransition>
      <div className="space-y-4">
        <StatsRow
          loading={isLoading}
          items={[
            { title: 'Total Earned', value: formatCurrency(stats.total) },
            { title: 'Available', value: formatCurrency(stats.available) },
            { title: 'Pending Hold', value: formatCurrency(stats.pending) },
            { title: 'Paid Out', value: formatCurrency(stats.paid) },
          ]}
        />

        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const available = summary?.available ?? stats.available;
              setPayoutAmount(available ? String(available.toFixed(2)) : '');
              setPayoutModalOpen(true);
            }}
          >
            Request Payout
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          pagination={data?.meta}
          onPageChange={setPage}
          emptyTitle="No commissions"
          emptyDescription="Commissions from referral orders will appear here."
        />

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Payout History</h2>
          <DataTable
            columns={payoutColumns}
            data={payoutsData?.data ?? []}
            isLoading={false}
            emptyTitle="No payout requests"
            emptyDescription="Payouts you request will appear here once processed."
          />
        </div>

        <Modal
          isOpen={payoutModalOpen}
          onClose={() => setPayoutModalOpen(false)}
          title="Request Payout"
          footer={(
            <>
              <Button variant="outline" size="sm" onClick={() => setPayoutModalOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                isLoading={requestPayout.isPending}
                onClick={async () => {
                  const amount = Number(payoutAmount);
                  if (!Number.isFinite(amount) || amount <= 0) {
                    toast.error('Enter a valid payout amount');
                    return;
                  }
                  if (!payoutDetails.trim()) {
                    toast.error('Payment details are required');
                    return;
                  }
                  try {
                    await requestPayout.mutateAsync({
                      amountUsd: amount,
                      paymentMethod: payoutMethod,
                      paymentDetails: payoutDetails.trim(),
                    });
                    toast.success('Payout request submitted');
                    setPayoutModalOpen(false);
                    setPayoutDetails('');
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Failed to request payout');
                  }
                }}
              >
                Submit Request
              </Button>
            </>
          )}
        >
          <div className="space-y-3">
            <Input
              label="Amount (USD)"
              type="number"
              min={1}
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
            />
            <Select
              label="Payment Method"
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value as typeof payoutMethod)}
              options={[
                { label: 'Payoneer', value: 'PAYONEER' },
                { label: 'USDT TRC20', value: 'USDT_TRC20' },
                { label: 'Binance', value: 'BINANCE' },
              ]}
            />
            <Input
              label="Payment Details"
              placeholder="Account / wallet details for payout"
              value={payoutDetails}
              onChange={(e) => setPayoutDetails(e.target.value)}
            />
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}

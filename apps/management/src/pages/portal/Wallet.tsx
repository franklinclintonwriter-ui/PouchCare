import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useAuthStore } from '@/store/authStore';
import { useCommissionSummary, useDeposit, useWalletTransactions } from '@/api/portal';
import { useCurrency } from '@/hooks/useCurrency';
import { PageTransition } from '@/components/ui/PageTransition';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { WalletCard } from '@/components/shared/WalletCard';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { PortalUser } from '@/types/auth';
import type { WalletTransaction } from '@/types/models';
import { useState } from 'react';
import { toast } from 'sonner';

const TX_BADGE_VARIANT: Record<string, 'success' | 'danger' | 'primary' | 'warning' | 'info' | 'default'> = {
  DEPOSIT: 'success',
  ORDER_PAYMENT: 'danger',
  COMMISSION_CREDIT: 'primary',
  REFUND: 'info',
  PAYOUT: 'warning',
  ADJUSTMENT: 'default',
};

export default function Wallet() {
  const { user } = useAuthStore();
  const { formatCurrency } = useCurrency();
  const portalUser = user as PortalUser;
  const [openDeposit, setOpenDeposit] = useState(false);
  const [amountUsd, setAmountUsd] = useState('50');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [proofUrl, setProofUrl] = useState('');
  const deposit = useDeposit();
  const { data: commissionSummary } = useCommissionSummary();

  useHeaderConfig({
    title: 'Wallet',
    breadcrumbs: [
      { label: 'Dashboard', href: '/portal' },
      { label: 'Wallet' },
    ],
  });

  const { data: transactions, isLoading } = useWalletTransactions();

  const onDeposit = async () => {
    try {
      await deposit.mutateAsync({
        amountUsd: Number(amountUsd),
        paymentMethod,
        proofUrl: proofUrl || undefined,
      });
      toast.success('Deposit request submitted');
      setOpenDeposit(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Deposit failed');
    }
  };

  const columns: Column<WalletTransaction>[] = [
    { key: 'createdAt', label: 'Date', render: (r) => <span className="text-xs text-gray-500">{r.createdAt}</span> },
    {
      key: 'type',
      label: 'Type',
      render: (r) => (
        <Badge variant={TX_BADGE_VARIANT[r.type] ?? 'default'} size="sm">
          {r.type.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    { key: 'description', label: 'Description', render: (r) => <span className="text-xs capitalize">{r.description}</span> },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      render: (r) => (
        <span className={r.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
          {r.amount >= 0 ? '+' : ''}{formatCurrency(r.amount)}
        </span>
      ),
    },
    {
      key: 'balanceAfter',
      label: 'Balance',
      align: 'right',
      render: (r) => <span className="text-xs font-medium">{formatCurrency(r.balanceAfter)}</span>,
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-5">
        <WalletCard
          balance={portalUser?.walletBalance ?? 0}
          pendingCommissions={(commissionSummary?.pending ?? 0) + (commissionSummary?.available ?? 0)}
          totalEarned={commissionSummary?.total ?? 0}
          onDeposit={() => setOpenDeposit(true)}
          onWithdraw={() => {}}
        />

        <DataTable
          columns={columns}
          data={transactions ?? []}
          isLoading={isLoading}
          emptyTitle="No transactions"
          emptyDescription="Your wallet transactions will appear here."
        />
      </div>

      <Modal
        isOpen={openDeposit}
        onClose={() => setOpenDeposit(false)}
        title="Request Deposit"
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setOpenDeposit(false)}>Cancel</Button>
            <Button size="sm" onClick={onDeposit} isLoading={deposit.isPending}>Submit</Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label="Amount (USD)" type="number" min={5} value={amountUsd} onChange={(e) => setAmountUsd(e.target.value)} />
          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
              { label: 'Payoneer', value: 'PAYONEER' },
              { label: 'USDT TRC20', value: 'USDT_TRC20' },
              { label: 'Binance', value: 'BINANCE' },
            ]}
          />
          <Input label="Proof URL (optional)" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} />
        </div>
      </Modal>
    </PageTransition>
  );
}

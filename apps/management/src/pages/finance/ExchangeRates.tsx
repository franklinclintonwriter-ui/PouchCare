import { useMemo, useState } from 'react';
import { Banknote, Plus } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCreateExchangeRate, useExchangeRates } from '@/api/admin-resources';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { ExchangeRate } from '@/api/admin-resources';
import { toast } from 'sonner';

export default function ExchangeRates() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [usdToBdt, setUsdToBdt] = useState('');
  const [usdToAed, setUsdToAed] = useState('');
  const [bdtToAed, setBdtToAed] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');

  const { data, isLoading } = useExchangeRates({ page, limit: 20 });
  const createRate = useCreateExchangeRate();

  useHeaderConfig(useMemo(() => ({
    title: 'Exchange Rates',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Finance' }, { label: 'Exchange Rates' }],
    actions: [{ type: 'button' as const, label: 'Add Rate', icon: Plus, onClick: () => setOpen(true) }],
  }), []));

  const columns: Column<ExchangeRate>[] = [
    { key: 'effectiveDate', label: 'Effective Date', render: (r) => new Date(r.effectiveDate).toLocaleDateString() },
    { key: 'usdToBdt', label: 'USD -> BDT', align: 'right' },
    { key: 'usdToAed', label: 'USD -> AED', align: 'right', render: (r) => r.usdToAed ?? '-' },
    { key: 'bdtToAed', label: 'BDT -> AED', align: 'right', render: (r) => r.bdtToAed ?? '-' },
  ];

  return (
    <PageTransition>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        pagination={data?.meta}
        onPageChange={setPage}
        emptyIcon={<Banknote />}
        emptyTitle="No exchange rates"
        emptyDescription="Create rates to support finance conversion flows."
      />

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Add Exchange Rate"
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              isLoading={createRate.isPending}
              onClick={async () => {
                if (!usdToBdt || !effectiveDate) return toast.error('USD->BDT and effective date are required');
                try {
                  await createRate.mutateAsync({
                    usdToBdt: Number(usdToBdt),
                    usdToAed: usdToAed ? Number(usdToAed) : undefined,
                    bdtToAed: bdtToAed ? Number(bdtToAed) : undefined,
                    effectiveDate,
                  });
                  setOpen(false);
                  setUsdToBdt('');
                  setUsdToAed('');
                  setBdtToAed('');
                  setEffectiveDate('');
                  toast.success('Exchange rate saved');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to save exchange rate');
                }
              }}
            >
              Save
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input type="date" label="Effective Date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
          <Input type="number" step="0.0001" label="USD -> BDT" value={usdToBdt} onChange={(e) => setUsdToBdt(e.target.value)} />
          <Input type="number" step="0.0001" label="USD -> AED" value={usdToAed} onChange={(e) => setUsdToAed(e.target.value)} />
          <Input type="number" step="0.0001" label="BDT -> AED" value={bdtToAed} onChange={(e) => setBdtToAed(e.target.value)} />
        </div>
      </Modal>
    </PageTransition>
  );
}

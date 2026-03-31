import { useMemo, useState } from 'react';
import { Building, Plus } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useClientAccounts, useCreateClientAccount } from '@/api/admin-resources';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/mocks/generators';
import { toast } from 'sonner';
import type { ClientAccount } from '@/api/admin-resources';

export default function ClientAccounts() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');

  const { data, isLoading } = useClientAccounts({ page, limit: 20 });
  const createClient = useCreateClientAccount();

  useHeaderConfig(useMemo(() => ({
    title: 'Client Accounts',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'CRM' }, { label: 'Client Accounts' }],
    actions: [{ type: 'button' as const, label: 'New Client', icon: Plus, onClick: () => setOpen(true) }],
  }), []));

  const rows = data?.data ?? [];
  const columns: Column<ClientAccount>[] = [
    { key: 'clientName', label: 'Client', sticky: true, render: (r) => <span className="font-medium">{r.clientName}</span> },
    { key: 'email', label: 'Email' },
    { key: 'country', label: 'Country', render: (r) => <span>{r.country || '-'}</span> },
    { key: 'totalOrders', label: 'Orders', align: 'right' },
    { key: 'totalSpentUsd', label: 'Spent', align: 'right', render: (r) => formatCurrency(r.totalSpentUsd || 0) },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'Active' ? 'success' : 'default'} size="sm">{r.status}</Badge> },
  ];

  return (
    <PageTransition>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        pagination={data?.meta}
        onPageChange={setPage}
        emptyIcon={<Building />}
        emptyTitle="No client accounts"
        emptyDescription="Create client records for CRM and finance tracking."
      />

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Create Client Account"
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              isLoading={createClient.isPending}
              onClick={async () => {
                if (!clientName.trim() || !email.trim()) return toast.error('Client name and email are required');
                try {
                  await createClient.mutateAsync({
                    clientName: clientName.trim(),
                    email: email.trim(),
                    country: country || undefined,
                  });
                  setOpen(false);
                  setClientName('');
                  setEmail('');
                  setCountry('');
                  toast.success('Client account created');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to create client account');
                }
              }}
            >
              Create
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
      </Modal>
    </PageTransition>
  );
}

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, AlertTriangle, Plus, Pencil, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useDomains, useCreateDomain, useUpdateDomain, useDeleteDomain } from '@/api/assets';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageTransition } from '@/components/ui/PageTransition';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuthStore } from '@/store/authStore';
import type { StaffUser } from '@/types/auth';
import type { Domain } from '@/types/models';
import { toast } from 'sonner';

const SENIOR_ROLES = ['CEO', 'CO_MD', 'OP_MANAGER'];

const emptyForm = { domainName: '', registrar: '', expiryDate: '', dnsProvider: '', annualCost: '', status: 'active' };

export default function Domains() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { data, isLoading } = useDomains();
  const domains = data?.data ?? [];
  const createDomain = useCreateDomain();
  const updateDomain = useUpdateDomain();
  const deleteDomain = useDeleteDomain();
  const user = useAuthStore((s) => s.user) as StaffUser | null;
  const canManage = SENIOR_ROLES.includes(user?.systemRole ?? '');

  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<Domain | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null);

  const openCreate = () => { setEditRow(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row: Domain) => {
    setEditRow(row);
    setForm({
      domainName: row.domain,
      registrar: row.registrar,
      expiryDate: row.expiryDate ? row.expiryDate.slice(0, 10) : '',
      dnsProvider: row.dnsProvider,
      annualCost: String(row.annualCost),
      status: row.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.domainName.trim()) return toast.error('Domain name is required');
    const payload = {
      domainName: form.domainName.trim(),
      registrar: form.registrar || undefined,
      expiryDate: form.expiryDate || undefined,
      hostingServer: form.dnsProvider || undefined,
      annualRenewalCost: form.annualCost ? Number(form.annualCost) : undefined,
      status: form.status || 'active',
    };
    try {
      if (editRow) {
        await updateDomain.mutateAsync({ id: editRow.id, ...payload });
        toast.success('Domain updated');
      } else {
        await createDomain.mutateAsync(payload);
        toast.success('Domain added');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDomain.mutateAsync(deleteTarget.id);
      toast.success('Domain deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const headerConfig = useMemo(() => ({
    title: 'Domains',
    breadcrumbs: [
      { label: 'Assets', href: '/assets' },
      { label: 'Domains', icon: Globe },
    ],
    actions: canManage
      ? [{ type: 'button' as const, label: 'Add Domain', icon: Plus, onClick: openCreate }]
      : [],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [canManage]);
  useHeaderConfig(headerConfig);

  const now = new Date();
  const expiringDomains = domains.filter((d) => {
    const diff = (new Date(d.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff < 30;
  });

  const columns: Column<Domain>[] = [
    {
      key: 'domain',
      label: 'Domain',
      sticky: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{row.domain}</span>
      ),
    },
    { key: 'registrar', label: 'Registrar' },
    {
      key: 'expiryDate',
      label: 'Expiry',
      render: (row) => {
        const diff = (new Date(row.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        const isExpiring = diff < 30;
        return (
          <span className={isExpiring ? 'font-medium text-red-600 dark:text-red-400' : ''}>
            {row.expiryDate ? row.expiryDate.slice(0, 10) : '-'}
          </span>
        );
      },
    },
    {
      key: 'autoRenew',
      label: 'Auto-Renew',
      align: 'center',
      render: (row) => (
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            row.autoRenew ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'dnsProvider', label: 'DNS' },
    {
      key: 'annualCost',
      label: 'Cost',
      align: 'right',
      render: (row) => (
        <span className="font-medium">{formatCurrency(row.annualCost)}/yr</span>
      ),
    },
    ...(canManage ? [{
      key: 'actions' as keyof Domain,
      label: '',
      align: 'right' as const,
      render: (row: Domain) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <PageTransition className="space-y-4">
      {expiringDomains.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-700/40 dark:bg-amber-900/10">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {expiringDomains.length} domain{expiringDomains.length > 1 ? 's' : ''} expiring within 30 days
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {expiringDomains.map((d) => d.domain).join(', ')}
              </p>
            </div>
          </div>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={domains}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyTitle="No domains found"
        onRowClick={(row) => navigate(`/assets/domains/${row.id}`)}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? 'Edit Domain' : 'Add Domain'}
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" isLoading={createDomain.isPending || updateDomain.isPending} onClick={handleSave}>
              {editRow ? 'Update' : 'Add'}
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label="Domain Name" placeholder="example.com" value={form.domainName} onChange={(e) => setForm(f => ({ ...f, domainName: e.target.value }))} />
          <Input label="Registrar" placeholder="Namecheap, GoDaddy..." value={form.registrar} onChange={(e) => setForm(f => ({ ...f, registrar: e.target.value }))} />
          <Input type="date" label="Expiry Date" value={form.expiryDate} onChange={(e) => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
          <Input label="DNS / Hosting Server" value={form.dnsProvider} onChange={(e) => setForm(f => ({ ...f, dnsProvider: e.target.value }))} />
          <Input type="number" label="Annual Cost (USD)" value={form.annualCost} onChange={(e) => setForm(f => ({ ...f, annualCost: e.target.value }))} />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Domain"
        message={`Delete domain "${deleteTarget?.domain}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteDomain.isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}

import { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe, Pencil, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useDomain, useUpdateDomain, useDeleteDomain } from '@/api/assets';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCurrency } from '@/hooks/useCurrency';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Expired', value: 'expired' },
  { label: 'Transferred', value: 'transferred' },
];

export default function DomainDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perm = usePermission();
  const { formatCurrency } = useCurrency();
  const { data: d, isLoading } = useDomain(id);
  const updateDomain = useUpdateDomain();
  const deleteDomain = useDeleteDomain();

  const canEdit = perm.can('assets.devices');

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({
    domainName: '',
    registrar: '',
    expiryDate: '',
    status: 'active',
    hostingServer: '',
    annualRenewalCost: '',
  });

  const openEdit = useCallback(() => {
    if (d) {
      setForm({
        domainName: d.domain,
        registrar: d.registrar,
        expiryDate: d.expiryDate ? d.expiryDate.slice(0, 10) : '',
        status: d.status,
        hostingServer: d.dnsProvider,
        annualRenewalCost: String(d.annualCost),
      });
    }
    setEditOpen(true);
  }, [d]);

  const handleSave = async () => {
    if (!id || !form.domainName.trim()) {
      toast.error('Domain name is required');
      return;
    }
    try {
      await updateDomain.mutateAsync({
        id,
        domainName: form.domainName.trim(),
        registrar: form.registrar || undefined,
        expiryDate: form.expiryDate ? new Date(`${form.expiryDate}T12:00:00Z`).toISOString() : undefined,
        status: form.status || undefined,
        hostingServer: form.hostingServer || undefined,
        annualRenewalCost: form.annualRenewalCost ? Number(form.annualRenewalCost) : undefined,
      });
      toast.success('Domain updated');
      setEditOpen(false);
    } catch {
      toast.error('Failed to update domain');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteDomain.mutateAsync(id);
      toast.success('Domain deleted');
      navigate('/assets/domains');
    } catch {
      toast.error('Failed to delete domain');
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  useHeaderConfig(useMemo(() => ({
    title: d?.domain ?? 'Domain',
    breadcrumbs: [
      { label: 'Assets', href: '/assets/domains' },
      { label: 'Domains', href: '/assets/domains' },
      { label: d?.domain ?? '…' },
    ],
    actions: canEdit ? [
      { type: 'button' as const, label: 'Edit', icon: Pencil, variant: 'outline' as const, onClick: openEdit },
      { type: 'button' as const, label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => setDeleteOpen(true) },
    ] : [],
  }), [d, canEdit, openEdit]));

  if (isLoading) {
    return (
      <PageTransition>
        <Skeleton className="h-40 w-full rounded-xl" />
      </PageTransition>
    );
  }

  if (!d) {
    return (
      <PageTransition>
        <Card>
          <p className="py-8 text-center text-gray-500">Domain not found.</p>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2 dark:bg-primary-900/30">
              <Globe className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{d.domain}</CardTitle>
              <StatusBadge status={d.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Registrar" value={d.registrar} />
          <Field label="Expiry" value={d.expiryDate ? d.expiryDate.slice(0, 10) : '—'} />
          <Field label="DNS / hosting" value={d.dnsProvider} />
          <Field label="Annual cost" value={`${formatCurrency(d.annualCost)}/yr`} />
          <Field label="Auto-renew" value={d.autoRenew ? 'Yes' : 'No'} />
        </CardContent>
      </Card>

      {/* Edit modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Domain"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button isLoading={updateDomain.isPending} onClick={handleSave}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Domain Name" value={form.domainName} onChange={set('domainName')} required />
          <Input label="Registrar" value={form.registrar} onChange={set('registrar')} />
          <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={set('expiryDate')} />
          <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={set('status')} />
          <Input label="DNS / Hosting" value={form.hostingServer} onChange={set('hostingServer')} />
          <Input label="Annual Cost (USD)" type="number" min="0" step="0.01" value={form.annualRenewalCost} onChange={set('annualRenewalCost')} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Domain"
        message={`Delete "${d.domain}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteDomain.isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-medium text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

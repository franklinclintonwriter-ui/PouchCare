import { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe2, Pencil, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useWebsite, useUpdateWebsite, useDeleteWebsite } from '@/api/assets';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePermission } from '@/hooks/usePermission';
import { formatCompact } from '@/lib/format';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { label: 'Live', value: 'live' },
  { label: 'Staging', value: 'staging' },
  { label: 'Down', value: 'down' },
  { label: 'Maintenance', value: 'maintenance' },
];

export default function WebsiteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perm = usePermission();
  const { data: w, isLoading } = useWebsite(id);
  const updateWebsite = useUpdateWebsite();
  const deleteWebsite = useDeleteWebsite();

  const canEdit = perm.can('assets.devices');

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    url: '',
    hostedOn: '',
    domainLinked: '',
    status: 'live',
    monthlyTraffic: '',
  });

  const openEdit = useCallback(() => {
    if (w) {
      setForm({
        name: w.name,
        url: w.url,
        hostedOn: w.serverName,
        domainLinked: w.domainName,
        status: w.status,
        monthlyTraffic: String(w.monthlyTraffic),
      });
    }
    setEditOpen(true);
  }, [w]);

  const handleSave = async () => {
    if (!id || !form.name.trim()) {
      toast.error('Website name is required');
      return;
    }
    try {
      await updateWebsite.mutateAsync({
        id,
        name: form.name.trim(),
        url: form.url || undefined,
        hostedOn: form.hostedOn || undefined,
        domainLinked: form.domainLinked || undefined,
        status: form.status || undefined,
        monthlyTraffic: form.monthlyTraffic ? Number(form.monthlyTraffic) : undefined,
      });
      toast.success('Website updated');
      setEditOpen(false);
    } catch {
      toast.error('Failed to update website');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteWebsite.mutateAsync(id);
      toast.success('Website deleted');
      navigate('/assets/websites');
    } catch {
      toast.error('Failed to delete website');
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  useHeaderConfig(useMemo(() => ({
    title: w?.name ?? 'Website',
    breadcrumbs: [
      { label: 'Assets', href: '/assets/websites' },
      { label: 'Websites', href: '/assets/websites' },
      { label: w?.name ?? '…' },
    ],
    actions: canEdit ? [
      { type: 'button' as const, label: 'Edit', icon: Pencil, variant: 'outline' as const, onClick: openEdit },
      { type: 'button' as const, label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => setDeleteOpen(true) },
    ] : [],
  }), [w, canEdit, openEdit]));

  if (isLoading) {
    return (
      <PageTransition>
        <Skeleton className="h-40 w-full rounded-xl" />
      </PageTransition>
    );
  }

  if (!w) {
    return (
      <PageTransition>
        <Card>
          <p className="py-8 text-center text-gray-500">Website not found.</p>
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
              <Globe2 className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{w.name}</CardTitle>
              <StatusBadge status={w.status} className="mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-xs text-gray-500">URL</p>
            <a href={w.url} target="_blank" rel="noopener noreferrer" className="break-all text-primary-600 hover:underline dark:text-primary-400">
              {w.url}
            </a>
          </div>
          <Field label="Server" value={w.serverName} />
          <Field label="Domain" value={w.domainName} />
          <Field label="Monthly traffic" value={formatCompact(w.monthlyTraffic)} />
          <Field label="Last deploy" value={w.lastDeploy} />
        </CardContent>
      </Card>

      {/* Edit modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Website"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button isLoading={updateWebsite.isPending} onClick={handleSave}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Website Name" value={form.name} onChange={set('name')} required />
          <Input label="URL" placeholder="https://example.com" value={form.url} onChange={set('url')} />
          <Input label="Hosted On (Server)" value={form.hostedOn} onChange={set('hostedOn')} />
          <Input label="Domain Linked" value={form.domainLinked} onChange={set('domainLinked')} />
          <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={set('status')} />
          <Input label="Monthly Traffic" type="number" min="0" value={form.monthlyTraffic} onChange={set('monthlyTraffic')} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Website"
        message={`Delete "${w.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteWebsite.isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

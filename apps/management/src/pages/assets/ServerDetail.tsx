import { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Server, Pencil, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useServer, useUpdateServer, useDeleteServer } from '@/api/assets';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
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
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' },
  { label: 'Maintenance', value: 'maintenance' },
];

export default function ServerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perm = usePermission();
  const { formatCurrency } = useCurrency();
  const { data: s, isLoading } = useServer(id);
  const updateServer = useUpdateServer();
  const deleteServer = useDeleteServer();

  const canEdit = perm.can('assets.devices');

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    provider: '',
    type: '',
    status: 'online',
    ipAddress: '',
    ramGb: '',
    storageGb: '',
    monthlyCostUsd: '',
  });

  const openEdit = useCallback(() => {
    if (s) {
      setForm({
        name: s.name,
        provider: s.provider,
        type: s.specs.cpu,
        status: s.status,
        ipAddress: s.ip,
        ramGb: s.specs.ram.replace(/[^\d.]/g, ''),
        storageGb: s.specs.disk.replace(/[^\d.]/g, ''),
        monthlyCostUsd: String(s.monthlyCost),
      });
    }
    setEditOpen(true);
  }, [s]);

  const handleSave = async () => {
    if (!id || !form.name.trim()) {
      toast.error('Server name is required');
      return;
    }
    try {
      await updateServer.mutateAsync({
        id,
        name: form.name.trim(),
        provider: form.provider || undefined,
        type: form.type || undefined,
        status: form.status || undefined,
        ipAddress: form.ipAddress || undefined,
        ramGb: form.ramGb ? Number(form.ramGb) : undefined,
        storageGb: form.storageGb ? Number(form.storageGb) : undefined,
        monthlyCostUsd: form.monthlyCostUsd ? Number(form.monthlyCostUsd) : undefined,
      });
      toast.success('Server updated');
      setEditOpen(false);
    } catch {
      toast.error('Failed to update server');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteServer.mutateAsync(id);
      toast.success('Server deleted');
      navigate('/assets/servers');
    } catch {
      toast.error('Failed to delete server');
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  useHeaderConfig(useMemo(() => ({
    title: s?.name ?? 'Server',
    breadcrumbs: [
      { label: 'Assets', href: '/assets/servers' },
      { label: 'Servers', href: '/assets/servers' },
      { label: s?.name ?? '…' },
    ],
    actions: canEdit ? [
      { type: 'button' as const, label: 'Edit', icon: Pencil, variant: 'outline' as const, onClick: openEdit },
      { type: 'button' as const, label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => setDeleteOpen(true) },
    ] : [],
  }), [s, canEdit, openEdit]));

  if (isLoading) {
    return (
      <PageTransition>
        <Skeleton className="h-48 w-full rounded-xl" />
      </PageTransition>
    );
  }

  if (!s) {
    return (
      <PageTransition>
        <Card>
          <p className="py-8 text-center text-gray-500">Server not found.</p>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
              <Server className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{s.name}</CardTitle>
              <p className="text-sm text-gray-500">{s.provider}</p>
              <StatusBadge status={s.status} className="mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <span className="font-mono text-gray-700 dark:text-gray-300">{s.ip}</span>
            <Badge variant="success" size="sm">{s.uptime}% uptime</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(['cpu', 'ram', 'disk'] as const).map((k) => (
              <div key={k}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="uppercase text-gray-500">{k}</span>
                  <span>{s.usage[k]}%</span>
                </div>
                <ProgressBar value={s.usage[k]} size="sm" />
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-3 dark:border-gray-700/40">
            <span className="text-sm text-gray-500">Monthly</span>
            <span className="font-semibold">{formatCurrency(s.monthlyCost)}/mo</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">CPU spec</span>
              <p className="font-medium">{s.specs.cpu}</p>
            </div>
            <div>
              <span className="text-gray-500">RAM / Disk</span>
              <p className="font-medium">{s.specs.ram} / {s.specs.disk}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Server"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button isLoading={updateServer.isPending} onClick={handleSave}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Server Name" value={form.name} onChange={set('name')} required />
          <Input label="Provider" placeholder="e.g. Hetzner, AWS, DigitalOcean" value={form.provider} onChange={set('provider')} />
          <Input label="Type / CPU" placeholder="e.g. Dedicated, VPS, 4 vCPU" value={form.type} onChange={set('type')} />
          <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={set('status')} />
          <Input label="IP Address" placeholder="e.g. 192.168.1.1" value={form.ipAddress} onChange={set('ipAddress')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="RAM (GB)" type="number" min="0" value={form.ramGb} onChange={set('ramGb')} />
            <Input label="Storage (GB)" type="number" min="0" value={form.storageGb} onChange={set('storageGb')} />
          </div>
          <Input label="Monthly Cost (USD)" type="number" min="0" step="0.01" value={form.monthlyCostUsd} onChange={set('monthlyCostUsd')} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Server"
        message={`Delete "${s.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteServer.isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}

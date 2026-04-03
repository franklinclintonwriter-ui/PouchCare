import { useState, useMemo } from 'react';
import { Server, Plus, Pencil, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useServers, useCreateServer, useUpdateServer, useDeleteServer } from '@/api/assets';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageTransition } from '@/components/ui/PageTransition';
import { formatCurrency } from '@/mocks/generators';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';
import type { StaffUser } from '@/types/auth';
import type { ServerAsset } from '@/types/models';
import { toast } from 'sonner';

const SENIOR_ROLES = ['CEO', 'CO_MD', 'OP_MANAGER'];
const emptyForm = { name: '', provider: '', ipAddress: '', type: '', ramGb: '', storageGb: '', monthlyCostUsd: '', status: 'online' };

export default function Servers() {
  const { data: servers, isLoading } = useServers();
  const createServer = useCreateServer();
  const updateServer = useUpdateServer();
  const deleteServer = useDeleteServer();
  const user = useAuthStore((s) => s.user) as StaffUser | null;
  const canManage = SENIOR_ROLES.includes(user?.systemRole ?? '');

  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<ServerAsset | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setEditRow(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row: ServerAsset) => {
    setEditRow(row);
    setForm({
      name: row.name,
      provider: row.provider,
      ipAddress: row.ip,
      type: row.specs.cpu,
      ramGb: row.specs.ram.replace(' GB', ''),
      storageGb: row.specs.disk.replace(' GB', ''),
      monthlyCostUsd: String(row.monthlyCost),
      status: row.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Server name is required');
    const payload = {
      name: form.name.trim(),
      provider: form.provider || undefined,
      ipAddress: form.ipAddress || undefined,
      type: form.type || undefined,
      ramGb: form.ramGb ? Number(form.ramGb) : undefined,
      storageGb: form.storageGb ? Number(form.storageGb) : undefined,
      monthlyCostUsd: form.monthlyCostUsd ? Number(form.monthlyCostUsd) : undefined,
      status: form.status || 'online',
    };
    try {
      if (editRow) {
        await updateServer.mutateAsync({ id: editRow.id, ...payload });
        toast.success('Server updated');
      } else {
        await createServer.mutateAsync(payload);
        toast.success('Server added');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async (row: ServerAsset) => {
    if (!confirm(`Delete server "${row.name}"?`)) return;
    try {
      await deleteServer.mutateAsync(row.id);
      toast.success('Server deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const headerConfig = useMemo(() => ({
    title: 'Servers',
    breadcrumbs: [
      { label: 'Assets', href: '/assets' },
      { label: 'Servers', icon: Server },
    ],
    actions: canManage
      ? [{ type: 'button' as const, label: 'Add Server', icon: Plus, onClick: openCreate }]
      : [],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [canManage]);
  useHeaderConfig(headerConfig);

  return (
    <PageTransition>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="mb-3 h-5 w-32 rounded" />
                <Skeleton className="mb-2 h-4 w-24 rounded" />
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                </div>
              </Card>
            ))
          : servers?.map((server) => (
              <Card key={server.id} hover>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
                      <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle>{server.name}</CardTitle>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{server.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusBadge status={server.status} size="sm" />
                    {canManage && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(server)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(server)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-mono">{server.ip}</span>
                    <Badge variant="success" size="sm">{server.uptime}% uptime</Badge>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">CPU</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{server.usage.cpu}%</span>
                      </div>
                      <ProgressBar
                        value={server.usage.cpu}
                        size="sm"
                        color={server.usage.cpu > 80 ? 'danger' : server.usage.cpu > 60 ? 'warning' : 'success'}
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">RAM</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{server.usage.ram}%</span>
                      </div>
                      <ProgressBar
                        value={server.usage.ram}
                        size="sm"
                        color={server.usage.ram > 80 ? 'danger' : server.usage.ram > 60 ? 'warning' : 'success'}
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Disk</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{server.usage.disk}%</span>
                      </div>
                      <ProgressBar
                        value={server.usage.disk}
                        size="sm"
                        color={server.usage.disk > 80 ? 'danger' : server.usage.disk > 60 ? 'warning' : 'success'}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700/40">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {server.websiteCount} site{server.websiteCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(server.monthlyCost)}/mo
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? 'Edit Server' : 'Add Server'}
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" isLoading={createServer.isPending || updateServer.isPending} onClick={handleSave}>
              {editRow ? 'Update' : 'Add'}
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label="Server Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Provider" placeholder="AWS, DigitalOcean..." value={form.provider} onChange={(e) => setForm(f => ({ ...f, provider: e.target.value }))} />
          <Input label="IP Address" value={form.ipAddress} onChange={(e) => setForm(f => ({ ...f, ipAddress: e.target.value }))} />
          <Input label="Type / CPU" placeholder="t3.large, 4 vCPU..." value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" label="RAM (GB)" value={form.ramGb} onChange={(e) => setForm(f => ({ ...f, ramGb: e.target.value }))} />
            <Input type="number" label="Storage (GB)" value={form.storageGb} onChange={(e) => setForm(f => ({ ...f, storageGb: e.target.value }))} />
          </div>
          <Input type="number" label="Monthly Cost (USD)" value={form.monthlyCostUsd} onChange={(e) => setForm(f => ({ ...f, monthlyCostUsd: e.target.value }))} />
        </div>
      </Modal>
    </PageTransition>
  );
}

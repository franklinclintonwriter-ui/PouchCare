import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe2, Plus, Pencil, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useWebsites, useCreateWebsite, useUpdateWebsite, useDeleteWebsite } from '@/api/assets';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageTransition } from '@/components/ui/PageTransition';
import { formatCompact } from '@/lib/format';
import { usePermission } from '@/hooks/usePermission';
import type { WebsiteAsset } from '@/types/models';
import { toast } from 'sonner';
const emptyForm = { name: '', url: '', hostedOn: '', domainLinked: '', status: 'live', monthlyTraffic: '' };

export default function Websites() {
  const navigate = useNavigate();
  const { data, isLoading } = useWebsites();
  const websites = data?.data ?? [];
  const createWebsite = useCreateWebsite();
  const updateWebsite = useUpdateWebsite();
  const deleteWebsite = useDeleteWebsite();
  const perm = usePermission();
  const canManage = perm.isCEO || perm.isOps;

  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<WebsiteAsset | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<WebsiteAsset | null>(null);

  const openCreate = () => { setEditRow(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row: WebsiteAsset) => {
    setEditRow(row);
    setForm({
      name: row.name,
      url: row.url,
      hostedOn: row.serverName,
      domainLinked: row.domainName,
      status: row.status,
      monthlyTraffic: String(row.monthlyTraffic),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Website name is required');
    const payload = {
      name: form.name.trim(),
      url: form.url || undefined,
      hostedOn: form.hostedOn || undefined,
      domainLinked: form.domainLinked || undefined,
      status: form.status || 'live',
      monthlyTraffic: form.monthlyTraffic ? Number(form.monthlyTraffic) : undefined,
    };
    try {
      if (editRow) {
        await updateWebsite.mutateAsync({ id: editRow.id, ...payload });
        toast.success('Website updated');
      } else {
        await createWebsite.mutateAsync(payload);
        toast.success('Website added');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWebsite.mutateAsync(deleteTarget.id);
      toast.success('Website deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const headerConfig = useMemo(() => ({
    title: 'Websites',
    breadcrumbs: [
      { label: 'Assets', href: '/assets' },
      { label: 'Websites', icon: Globe2 },
    ],
    actions: canManage
      ? [{ type: 'button' as const, label: 'Add Website', icon: Plus, onClick: openCreate }]
      : [],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [canManage]);
  useHeaderConfig(headerConfig);

  const columns: Column<WebsiteAsset>[] = [
    {
      key: 'name',
      label: 'Name',
      sticky: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{row.name}</span>
      ),
    },
    {
      key: 'url',
      label: 'URL',
      render: (row) => (
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:underline dark:text-primary-400"
          onClick={(e) => e.stopPropagation()}
        >
          {row.url.replace('https://', '')}
        </a>
      ),
    },
    { key: 'serverName', label: 'Server' },
    { key: 'domainName', label: 'Domain' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'monthlyTraffic',
      label: 'Traffic',
      align: 'right',
      render: (row) => (
        <span className="font-medium">{formatCompact(row.monthlyTraffic)}</span>
      ),
    },
    {
      key: 'lastDeploy',
      label: 'Last Deploy',
      render: (row) => (
        <span className="text-gray-500 dark:text-gray-400">{row.lastDeploy}</span>
      ),
    },
    ...(canManage ? [{
      key: 'actions' as keyof WebsiteAsset,
      label: '',
      align: 'right' as const,
      render: (row: WebsiteAsset) => (
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
      <DataTable
        columns={columns}
        data={websites}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyTitle="No websites found"
        emptyDescription="Add a website to start tracking."
        onRowClick={(row) => navigate(`/assets/websites/${row.id}`)}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? 'Edit Website' : 'Add Website'}
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" isLoading={createWebsite.isPending || updateWebsite.isPending} onClick={handleSave}>
              {editRow ? 'Update' : 'Add'}
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label="Website Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="URL" placeholder="https://example.com" value={form.url} onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))} />
          <Input label="Hosted On (Server)" value={form.hostedOn} onChange={(e) => setForm(f => ({ ...f, hostedOn: e.target.value }))} />
          <Input label="Domain Linked" value={form.domainLinked} onChange={(e) => setForm(f => ({ ...f, domainLinked: e.target.value }))} />
          <Input type="number" label="Monthly Traffic" value={form.monthlyTraffic} onChange={(e) => setForm(f => ({ ...f, monthlyTraffic: e.target.value }))} />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Website"
        message={`Delete website "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteWebsite.isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}

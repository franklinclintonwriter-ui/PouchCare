import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePlugins, useCreatePlugin, type Plugin } from '@/api/plugins';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageTransition } from '@/components/ui/PageTransition';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

const emptyForm = { slug: '', name: '', description: '' };

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'default'> = {
  PUBLISHED: 'success',
  DRAFT: 'warning',
};

export default function PluginList() {
  const navigate = useNavigate();
  const perm = usePermission();
  const { data: plugins, isLoading } = usePlugins();
  const createPlugin = useCreatePlugin();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({});

  const canManage = perm.isCEO;

  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }, []);

  useHeaderConfig({
    title: 'Plugins',
    actions: canManage
      ? [{ type: 'button', label: 'New Plugin', icon: Plus, onClick: openCreate, variant: 'primary' }]
      : [],
  });

  const validate = () => {
    const e: Partial<typeof emptyForm> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.slug.trim()) e.slug = 'Slug is required';
    else if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = 'Slug must be lowercase letters, numbers and hyphens only';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    try {
      const p = await createPlugin.mutateAsync({
        slug: form.slug.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      });
      setModalOpen(false);
      toast.success(`Plugin "${p.name}" created`);
      navigate(`/plugins/${p.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create plugin';
      toast.error(msg);
    }
  };

  const columns: Column<Plugin>[] = [
    {
      key: 'name',
      label: 'Plugin',
      render: (row) => (
        <div>
          <div className="font-medium text-[var(--color-text-primary)]">{row.name}</div>
          <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-mono">{row.slug}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={STATUS_COLORS[row.status] ?? 'default'} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'currentVersion',
      label: 'Version',
      render: (row) => (
        <span className="font-mono text-sm text-[var(--color-text-secondary)]">v{row.currentVersion}</span>
      ),
    },
    {
      key: 'versionCount',
      label: 'Versions',
      render: (row) => (
        <span className="text-sm text-[var(--color-text-secondary)]">{row.versionCount ?? 0}</span>
      ),
    },
    {
      key: 'activationCount',
      label: 'Activations',
      render: (row) => (
        <span className="text-sm text-[var(--color-text-secondary)]">{row.activationCount ?? 0} sites</span>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      render: (row) => (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {new Date(row.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={plugins ?? []}
            onRowClick={(row) => navigate(`/plugins/${row.id}`)}
            emptyTitle="No plugins yet"
            emptyDescription="Create your first plugin to get started."
          />
        )}
      </div>

      {/* Create Plugin Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Plugin"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} isLoading={createPlugin.isPending}>Create Plugin</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Plugin Name"
            placeholder="My Awesome Plugin"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={errors.name}
            required
          />
          <Input
            label="Slug"
            placeholder="my-awesome-plugin"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
            error={errors.slug}
            hint="Lowercase letters, numbers, and hyphens only. Used in download URLs."
            required
          />
          <Textarea
            label="Description"
            placeholder="Brief description of what this plugin does..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
          />
        </div>
      </Modal>
    </PageTransition>
  );
}

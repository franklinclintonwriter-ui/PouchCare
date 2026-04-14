import { useCallback, useEffect, useMemo, useState } from 'react';
import { Briefcase, Plus, Pencil, Trash2, Archive } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import {
  useServices, useCreateService, useUpdateService, useDeleteService,
  useBacklinkPackageRecords, useCreateBacklinkPackage, useUpdateBacklinkPackage, useArchiveBacklinkPackage,
  type BacklinkPackageRecord,
} from '@/api/services';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageTransition } from '@/components/ui/PageTransition';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrency } from '@/hooks/useCurrency';
import { usePermission } from '@/hooks/usePermission';
import type { Service } from '@/types/models';
import { toast } from 'sonner';

const CATEGORY_OPTIONS = ['SEO', 'Development', 'Content', 'Marketing', 'Design', 'Backlinks', 'General'];
const CATEGORY_COLORS: Record<string, 'success' | 'primary' | 'info' | 'warning' | 'danger' | 'default'> = {
  SEO: 'success',
  Development: 'primary',
  Content: 'info',
  Marketing: 'warning',
  Design: 'danger',
  Backlinks: 'primary',
  General: 'default',
};

const TABS = [
  { label: 'Catalog', value: 'catalog' },
  { label: 'Backlink Packages', value: 'backlinks' },
];

// ─── Service catalog form ──────────────────────────────────────────────────
const emptyServiceForm = { name: '', category: 'SEO', shortDescription: '', basePriceUsd: '', status: 'Active' };

function ServiceCatalogTab({ canManage, triggerAdd, onAddTriggered }: { canManage: boolean; triggerAdd?: boolean; onAddTriggered?: () => void }) {
  const { formatCurrency } = useCurrency();
  const { data: services, isLoading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<Service | null>(null);
  const [form, setForm] = useState(emptyServiceForm);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const openCreate = useCallback(() => { setEditRow(null); setForm(emptyServiceForm); setModalOpen(true); }, []);

  useEffect(() => {
    if (triggerAdd) { openCreate(); onAddTriggered?.(); }
  }, [triggerAdd, openCreate, onAddTriggered]);
  const openEdit = (svc: Service) => {
    setEditRow(svc);
    setForm({
      name: svc.name,
      category: svc.category,
      shortDescription: svc.description,
      basePriceUsd: String(svc.priceRange.min),
      status: svc.isActive ? 'Active' : 'Inactive',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Service name is required');
    const payload = {
      name: form.name.trim(),
      category: form.category || 'General',
      shortDescription: form.shortDescription || undefined,
      basePriceUsd: form.basePriceUsd ? Number(form.basePriceUsd) : undefined,
      status: form.status || 'Active',
    };
    try {
      if (editRow) {
        await updateService.mutateAsync({ id: editRow.id, ...payload });
        toast.success('Service updated');
      } else {
        await createService.mutateAsync(payload);
        toast.success('Service created');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteService.mutateAsync(deleteTarget.id);
      toast.success('Service deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </Card>
            ))
          : (services ?? []).map((service) => (
              <Card key={service.id} hover>
                <CardHeader>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                      <div className="h-4 w-4 rounded-full bg-primary-500" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate">{service.name}</CardTitle>
                      <Badge variant={CATEGORY_COLORS[service.category] ?? 'default'} size="sm">
                        {service.category}
                      </Badge>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); openEdit(service); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); setDeleteTarget(service); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {service.description && (
                    <p className="mb-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{service.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(service.priceRange.min)}{service.priceRange.max !== service.priceRange.min ? ` – ${formatCurrency(service.priceRange.max)}` : ''}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{service.orderCount} orders</span>
                  </div>
                  {!service.isActive && <Badge variant="danger" size="sm" className="mt-2">Inactive</Badge>}
                </CardContent>
              </Card>
            ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? 'Edit Service' : 'Add Service'}
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" isLoading={createService.isPending || updateService.isPending} onClick={handleSave}>
              {editRow ? 'Update' : 'Create'}
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label="Service Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          <Select
            label="Category"
            options={CATEGORY_OPTIONS.map(c => ({ label: c, value: c }))}
            value={form.category}
            onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
          />
          <Textarea
            label="Description"
            rows={2}
            value={form.shortDescription}
            onChange={(e) => setForm(f => ({ ...f, shortDescription: e.target.value }))}
          />
          <Input type="number" label="Base Price (USD)" value={form.basePriceUsd} onChange={(e) => setForm(f => ({ ...f, basePriceUsd: e.target.value }))} />
          <Select
            label="Status"
            options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]}
            value={form.status}
            onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Service"
        message={`Delete service "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteService.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}

// ─── Backlink packages tab ─────────────────────────────────────────────────
const emptyBlForm = {
  name: '', type: '', daRange: '', status: 'Active',
  pricePerLink: '', priceX10: '', priceX50: '', priceX100: '', priceX1000: '',
  turnaroundDays: '', featured: false, notes: '',
};

function BacklinkPackagesTab({ canManage, triggerAdd, onAddTriggered }: { canManage: boolean; triggerAdd?: boolean; onAddTriggered?: () => void }) {
  const { formatCurrency } = useCurrency();
  const { data: packages, isLoading } = useBacklinkPackageRecords();
  const createPackage = useCreateBacklinkPackage();
  const updatePackage = useUpdateBacklinkPackage();
  const archivePackage = useArchiveBacklinkPackage();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<BacklinkPackageRecord | null>(null);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [pendingArchive, setPendingArchive] = useState<BacklinkPackageRecord | null>(null);
  const [form, setForm] = useState(emptyBlForm);

  const resetEditor = useCallback(() => { setEditing(null); setForm(emptyBlForm); }, []);
  const openCreate = useCallback(() => { resetEditor(); setEditorOpen(true); }, [resetEditor]);

  useEffect(() => {
    if (triggerAdd) { openCreate(); onAddTriggered?.(); }
  }, [triggerAdd, openCreate, onAddTriggered]);

  function num(value: string) {
    const v = Number(value);
    return Number.isFinite(v) && value.trim() !== '' ? v : undefined;
  }

  async function onSave() {
    if (!form.name.trim()) { toast.error('Package name is required'); return; }
    const pricePerLink = num(form.pricePerLink);
    if (pricePerLink == null || pricePerLink <= 0) { toast.error('Price per link must be > 0'); return; }
    const payload = {
      name: form.name.trim(),
      type: form.type.trim() || undefined,
      daRange: form.daRange.trim() || undefined,
      status: form.status,
      pricePerLink,
      priceX10: num(form.priceX10),
      priceX50: num(form.priceX50),
      priceX100: num(form.priceX100),
      priceX1000: num(form.priceX1000),
      turnaroundDays: num(form.turnaroundDays),
      featured: form.featured,
      notes: form.notes.trim() || undefined,
    };
    try {
      if (editing) {
        await updatePackage.mutateAsync({ id: editing.id, body: payload });
        toast.success('Package updated');
      } else {
        await createPackage.mutateAsync(payload);
        toast.success('Package created');
      }
      setEditorOpen(false);
      resetEditor();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save package');
    }
  }

  const columns: Column<BacklinkPackageRecord>[] = [
    {
      key: 'name', label: 'Package', sticky: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{row.name}</span>
          {row.featured && <Badge variant="primary" size="sm">Featured</Badge>}
        </div>
      ),
    },
    { key: 'type', label: 'Type', render: (row) => <span className="text-gray-600 dark:text-gray-300">{row.type ?? '—'}</span> },
    { key: 'daRange', label: 'DA', render: (row) => <span className="text-gray-600 dark:text-gray-300">{row.daRange ?? '—'}</span> },
    { key: 'pricePerLink', label: 'Per Link', align: 'right', render: (row) => <span className="font-mono">{formatCurrency(row.pricePerLink)}</span> },
    { key: 'priceX10', label: '×10', align: 'right', render: (row) => row.priceX10 != null ? <span className="font-mono">{formatCurrency(row.priceX10)}</span> : <span className="text-gray-400">—</span> },
    { key: 'priceX50', label: '×50', align: 'right', render: (row) => row.priceX50 != null ? <span className="font-mono">{formatCurrency(row.priceX50)}</span> : <span className="text-gray-400">—</span> },
    { key: 'priceX100', label: '×100', align: 'right', render: (row) => row.priceX100 != null ? <span className="font-mono">{formatCurrency(row.priceX100)}</span> : <span className="text-gray-400">—</span> },
    { key: 'priceX1000', label: '×1,000', align: 'right', render: (row) => row.priceX1000 != null ? <span className="font-mono">{formatCurrency(row.priceX1000)}</span> : <span className="text-gray-400">—</span> },
    { key: 'turnaroundDays', label: 'TAT', align: 'center', render: (row) => <span className="text-gray-600 dark:text-gray-300">{row.turnaroundDays ? `${row.turnaroundDays}d` : '—'}</span> },
    {
      key: 'status', label: 'Status',
      render: (row) => <Badge variant={(row.status ?? '').toLowerCase() === 'active' ? 'success' : 'default'} size="sm">{row.status ?? '—'}</Badge>,
    },
    ...(canManage ? [{
      key: 'actions' as const,
      label: '',
      align: 'right' as const,
      render: (row: BacklinkPackageRecord) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" onClick={(e) => {
            e.stopPropagation();
            setEditing(row);
            setForm({
              name: row.name ?? '', type: row.type ?? '', daRange: row.daRange ?? '',
              status: row.status ?? 'Active', pricePerLink: String(row.pricePerLink ?? ''),
              priceX10: row.priceX10 != null ? String(row.priceX10) : '',
              priceX50: row.priceX50 != null ? String(row.priceX50) : '',
              priceX100: row.priceX100 != null ? String(row.priceX100) : '',
              priceX1000: row.priceX1000 != null ? String(row.priceX1000) : '',
              turnaroundDays: row.turnaroundDays != null ? String(row.turnaroundDays) : '',
              featured: !!row.featured, notes: row.notes ?? '',
            });
            setEditorOpen(true);
          }}><Pencil className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={(e) => {
            e.stopPropagation();
            setPendingArchive(row);
            setConfirmArchiveOpen(true);
          }}><Archive className="h-4 w-4" /></Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Active packages are shown on the public pricing page.
      </p>

      <DataTable
        columns={columns}
        data={packages ?? []}
        isLoading={isLoading}
        emptyTitle="No backlink packages"
        emptyDescription="Create a package to show it on the landing site."
        getRowId={(row) => row.id}
        compact
      />

      <Modal
        isOpen={editorOpen}
        onClose={() => { setEditorOpen(false); resetEditor(); }}
        title={editing ? 'Edit Backlink Package' : 'Add Backlink Package'}
        size="lg"
        footer={(
          <>
            <Button variant="outline" onClick={() => { setEditorOpen(false); resetEditor(); }} disabled={createPackage.isPending || updatePackage.isPending}>Cancel</Button>
            <Button onClick={onSave} isLoading={createPackage.isPending || updatePackage.isPending}>Save</Button>
          </>
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} />
          <Select label="Type" value={form.type} onChange={(e) => setForm(s => ({ ...s, type: e.target.value }))}
            options={[
              { label: 'Guest Post', value: 'Guest Post' }, { label: 'Niche Edit', value: 'Niche Edit' },
              { label: 'Web 2.0', value: 'Web 2.0' }, { label: 'Profile', value: 'Profile' }, { label: 'Mixed', value: 'Mixed' },
            ]}
            placeholder="Select type"
          />
          <Input label="DA Range" placeholder="DA 30-40" value={form.daRange} onChange={(e) => setForm(s => ({ ...s, daRange: e.target.value }))} />
          <Select label="Status" value={form.status} onChange={(e) => setForm(s => ({ ...s, status: e.target.value }))}
            options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]}
          />
          <Input label="Price Per Link (USD)" type="number" min={0} value={form.pricePerLink} onChange={(e) => setForm(s => ({ ...s, pricePerLink: e.target.value }))} />
          <Input label="Turnaround Days" type="number" min={0} value={form.turnaroundDays} onChange={(e) => setForm(s => ({ ...s, turnaroundDays: e.target.value }))} />
          <Input label="Price ×10 (USD)" type="number" min={0} value={form.priceX10} onChange={(e) => setForm(s => ({ ...s, priceX10: e.target.value }))} />
          <Input label="Price ×50 (USD)" type="number" min={0} value={form.priceX50} onChange={(e) => setForm(s => ({ ...s, priceX50: e.target.value }))} />
          <Input label="Price ×100 (USD)" type="number" min={0} value={form.priceX100} onChange={(e) => setForm(s => ({ ...s, priceX100: e.target.value }))} />
          <Input label="Price ×1,000 (USD)" type="number" min={0} value={form.priceX1000} onChange={(e) => setForm(s => ({ ...s, priceX1000: e.target.value }))} />
          <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-gray-700/60 sm:col-span-2">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Featured</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Highlighted on public pricing sections.</p>
            </div>
            <Toggle checked={form.featured} onChange={(checked) => setForm(s => ({ ...s, featured: checked }))} />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Notes" value={form.notes} onChange={(e) => setForm(s => ({ ...s, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmArchiveOpen}
        onClose={() => { setConfirmArchiveOpen(false); setPendingArchive(null); }}
        title="Archive package?"
        message={pendingArchive ? `This will hide "${pendingArchive.name}" from the landing site.` : ''}
        confirmLabel="Archive"
        variant="warning"
        isLoading={archivePackage.isPending}
        onConfirm={async () => {
          if (!pendingArchive) return;
          try {
            await archivePackage.mutateAsync(pendingArchive.id);
            toast.success('Package archived');
            setConfirmArchiveOpen(false);
            setPendingArchive(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to archive package');
          }
        }}
      />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function ServiceList() {
  const perm = usePermission();
  const canManage = perm.isCEO || perm.isOps;
  const [tab, setTab] = useState('catalog');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [backlinkOpen, setBacklinkOpen] = useState(false);

  const onTabChange = useCallback((v: string) => setTab(v), []);

  useHeaderConfig(useMemo(() => ({
    title: 'Services',
    breadcrumbs: [{ label: 'Services', icon: Briefcase }],
    actions: canManage ? [
      {
        type: 'button' as const,
        label: tab === 'backlinks' ? 'Add Package' : 'Add Service',
        icon: Plus,
        onClick: () => tab === 'backlinks' ? setBacklinkOpen(true) : setCatalogOpen(true),
      },
    ] : [],
  }), [canManage, tab]));

  return (
    <PageTransition>
      <div className="space-y-4">
        <Tabs tabs={TABS} value={tab} onChange={onTabChange} />
        {tab === 'catalog' && <ServiceCatalogTab canManage={canManage} triggerAdd={catalogOpen} onAddTriggered={() => setCatalogOpen(false)} />}
        {tab === 'backlinks' && <BacklinkPackagesTab canManage={canManage} triggerAdd={backlinkOpen} onAddTriggered={() => setBacklinkOpen(false)} />}
      </div>
    </PageTransition>
  );
}

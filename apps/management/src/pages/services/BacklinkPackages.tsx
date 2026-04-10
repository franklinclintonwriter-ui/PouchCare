import { useMemo, useState } from 'react';
import { Link, Plus, Pencil, Archive } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useArchiveBacklinkPackage, useBacklinkPackageRecords, useCreateBacklinkPackage, useUpdateBacklinkPackage, type BacklinkPackageRecord } from '@/api/services';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageTransition } from '@/components/ui/PageTransition';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrency } from '@/hooks/useCurrency';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

export default function BacklinkPackages() {
  const { formatCurrency } = useCurrency();
  const { data: packages, isLoading } = useBacklinkPackageRecords();
  const createPackage = useCreateBacklinkPackage();
  const updatePackage = useUpdateBacklinkPackage();
  const archivePackage = useArchiveBacklinkPackage();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<BacklinkPackageRecord | null>(null);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [pendingArchive, setPendingArchive] = useState<BacklinkPackageRecord | null>(null);

  const [form, setForm] = useState({
    name: '',
    type: '',
    daRange: '',
    status: 'Active',
    pricePerLink: '',
    priceX10: '',
    priceX50: '',
    priceX100: '',
    priceX1000: '',
    turnaroundDays: '',
    featured: false,
    notes: '',
  });

  const headerConfig = useMemo(() => ({
    title: 'Backlink Packages',
    breadcrumbs: [
      { label: 'Services', href: '/services' },
      { label: 'Backlink Packages', icon: Link },
    ],
    actions: [],
  }), []);
  useHeaderConfig(headerConfig);

  const columns: Column<BacklinkPackageRecord>[] = [
    {
      key: 'name',
      label: 'Package',
      sticky: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{row.name}</span>
          {row.featured && <Badge variant="primary" size="sm">Featured</Badge>}
        </div>
      ),
    },
    { key: 'type', label: 'Type', render: (row) => <span className="text-gray-600 dark:text-gray-300">{row.type ?? '-'}</span> },
    { key: 'daRange', label: 'DA', render: (row) => <span className="text-gray-600 dark:text-gray-300">{row.daRange ?? '-'}</span> },
    { key: 'pricePerLink', label: 'Per Link', align: 'right', render: (row) => <span className="font-mono">{formatCurrency(row.pricePerLink)}</span> },
    { key: 'priceX10', label: '×10', align: 'right', render: (row) => row.priceX10 != null ? <span className="font-mono">{formatCurrency(row.priceX10)}</span> : <span className="text-gray-400">—</span> },
    { key: 'priceX50', label: '×50', align: 'right', render: (row) => row.priceX50 != null ? <span className="font-mono">{formatCurrency(row.priceX50)}</span> : <span className="text-gray-400">—</span> },
    { key: 'priceX100', label: '×100', align: 'right', render: (row) => row.priceX100 != null ? <span className="font-mono">{formatCurrency(row.priceX100)}</span> : <span className="text-gray-400">—</span> },
    { key: 'priceX1000', label: '×1,000', align: 'right', render: (row) => row.priceX1000 != null ? <span className="font-mono">{formatCurrency(row.priceX1000)}</span> : <span className="text-gray-400">—</span> },
    {
      key: 'turnaroundDays',
      label: 'TAT',
      align: 'center',
      render: (row) => <span className="text-gray-600 dark:text-gray-300">{row.turnaroundDays ? `${row.turnaroundDays}d` : '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={(row.status ?? '').toLowerCase() === 'active' ? 'success' : 'default'} size="sm">
          {row.status ?? '—'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(row);
              setForm({
                name: row.name ?? '',
                type: row.type ?? '',
                daRange: row.daRange ?? '',
                status: row.status ?? 'Active',
                pricePerLink: String(row.pricePerLink ?? ''),
                priceX10: row.priceX10 != null ? String(row.priceX10) : '',
                priceX50: row.priceX50 != null ? String(row.priceX50) : '',
                priceX100: row.priceX100 != null ? String(row.priceX100) : '',
                priceX1000: row.priceX1000 != null ? String(row.priceX1000) : '',
                turnaroundDays: row.turnaroundDays != null ? String(row.turnaroundDays) : '',
                featured: !!row.featured,
                notes: row.notes ?? '',
              });
              setEditorOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setPendingArchive(row);
              setConfirmArchiveOpen(true);
            }}
          >
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  function resetEditor() {
    setEditing(null);
    setForm({
      name: '',
      type: '',
      daRange: '',
      status: 'Active',
      pricePerLink: '',
      priceX10: '',
      priceX50: '',
      priceX100: '',
      priceX1000: '',
      turnaroundDays: '',
      featured: false,
      notes: '',
    });
  }

  function num(value: string) {
    const v = Number(value);
    return Number.isFinite(v) ? v : undefined;
  }

  async function onSave() {
    const name = form.name.trim();
    if (!name) {
      toast.error('Package name is required');
      return;
    }
    const pricePerLink = num(form.pricePerLink);
    if (pricePerLink == null || pricePerLink <= 0) {
      toast.error('Price per link must be a number greater than 0');
      return;
    }

    const payload = {
      name,
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

  return (
    <PageTransition>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Create and manage backlink pricing packages. Active packages show on the public landing site.</p>
        </div>
        <Button
          onClick={() => {
            resetEditor();
            setEditorOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Package
        </Button>
      </div>

      <Card padding="none">
        <div className="p-4 sm:p-5">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <div className="space-y-4 text-center">
                    <Skeleton className="mx-auto h-5 w-20 rounded" />
                    <Skeleton className="mx-auto h-8 w-24 rounded" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full rounded" />
                      <Skeleton className="h-3 w-full rounded" />
                      <Skeleton className="h-3 w-full rounded" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={packages ?? []}
              isLoading={isLoading}
              emptyTitle="No backlink packages"
              emptyDescription="Create a package to show it on the landing site."
              getRowId={(row) => row.id}
              compact
            />
          )}
        </div>
      </Card>

      <Modal
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          resetEditor();
        }}
        title={editing ? 'Edit Backlink Package' : 'Add Backlink Package'}
        size="lg"
        footer={(
          <>
            <Button
              variant="outline"
              onClick={() => {
                setEditorOpen(false);
                resetEditor();
              }}
              disabled={createPackage.isPending || updatePackage.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={onSave}
              isLoading={createPackage.isPending || updatePackage.isPending}
            >
              Save
            </Button>
          </>
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
            options={[
              { label: 'Guest Post', value: 'Guest Post' },
              { label: 'Niche Edit', value: 'Niche Edit' },
              { label: 'Web 2.0', value: 'Web 2.0' },
              { label: 'Profile', value: 'Profile' },
              { label: 'Mixed', value: 'Mixed' },
            ]}
          />
          <Input
            label="DA Range"
            placeholder="DA 30-40"
            value={form.daRange}
            onChange={(e) => setForm((s) => ({ ...s, daRange: e.target.value }))}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
            options={[
              { label: 'Active', value: 'Active' },
              { label: 'Inactive', value: 'Inactive' },
            ]}
          />

          <Input
            label="Price Per Link (USD)"
            type="number"
            min={0}
            value={form.pricePerLink}
            onChange={(e) => setForm((s) => ({ ...s, pricePerLink: e.target.value }))}
          />
          <Input
            label="Turnaround Days"
            type="number"
            min={0}
            value={form.turnaroundDays}
            onChange={(e) => setForm((s) => ({ ...s, turnaroundDays: e.target.value }))}
          />

          <Input
            label="Price ×10 (USD)"
            type="number"
            min={0}
            value={form.priceX10}
            onChange={(e) => setForm((s) => ({ ...s, priceX10: e.target.value }))}
          />
          <Input
            label="Price ×50 (USD)"
            type="number"
            min={0}
            value={form.priceX50}
            onChange={(e) => setForm((s) => ({ ...s, priceX50: e.target.value }))}
          />
          <Input
            label="Price ×100 (USD)"
            type="number"
            min={0}
            value={form.priceX100}
            onChange={(e) => setForm((s) => ({ ...s, priceX100: e.target.value }))}
          />
          <Input
            label="Price ×1,000 (USD)"
            type="number"
            min={0}
            value={form.priceX1000}
            onChange={(e) => setForm((s) => ({ ...s, priceX1000: e.target.value }))}
          />

          <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-gray-700/60">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Featured</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Featured packages are highlighted on pricing sections.</p>
            </div>
            <Toggle checked={form.featured} onChange={(checked) => setForm((s) => ({ ...s, featured: checked }))} />
          </div>

          <div className="sm:col-span-2">
            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmArchiveOpen}
        onClose={() => {
          setConfirmArchiveOpen(false);
          setPendingArchive(null);
        }}
        title="Archive package?"
        message={pendingArchive ? `This will hide "${pendingArchive.name}" from the landing site.` : 'This will hide the package from the landing site.'}
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
    </PageTransition>
  );
}

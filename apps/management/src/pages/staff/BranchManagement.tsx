import { useMemo, useState } from 'react';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useBranches, useCreateBranch, useDeleteBranch } from '@/api/admin-resources';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import type { Branch } from '@/api/admin-resources';

export default function BranchManagement() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [manager, setManager] = useState('');

  const { data, isLoading } = useBranches({ page, limit: 20 });
  const createBranch = useCreateBranch();
  const deleteBranch = useDeleteBranch();

  useHeaderConfig(useMemo(() => ({
    title: 'Branch Management',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Staff', href: '/staff' }, { label: 'Branches' }],
    actions: [
      { type: 'button' as const, label: 'New Branch', icon: Plus, onClick: () => setOpen(true) },
    ],
  }), []));

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const onCreate = async () => {
    if (!name.trim()) return toast.error('Branch name is required');
    try {
      await createBranch.mutateAsync({
        name: name.trim(),
        country: country || undefined,
        city: city || undefined,
        branchManager: manager || undefined,
      });
      setOpen(false);
      setName('');
      setCountry('');
      setCity('');
      setManager('');
      toast.success('Branch created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create branch');
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteBranch.mutateAsync(id);
      toast.success('Branch deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const columns: Column<Branch>[] = [
    { key: 'name', label: 'Name', sticky: true, render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'city', label: 'City' },
    { key: 'country', label: 'Country' },
    { key: 'branchManager', label: 'Manager', render: (r) => <span>{r.branchManager || '-'}</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'Active' ? 'success' : 'default'} size="sm">{r.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (r) => (
        <Button variant="ghost" size="sm" icon={<Trash2 />} onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <PageTransition>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        emptyIcon={<Building2 />}
        emptyTitle="No branches found"
        emptyDescription="Create your first branch to get started."
      />

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Create Branch"
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={onCreate} isLoading={createBranch.isPending}>Create</Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label="Branch Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="Branch Manager" value={manager} onChange={(e) => setManager(e.target.value)} />
        </div>
      </Modal>
    </PageTransition>
  );
}

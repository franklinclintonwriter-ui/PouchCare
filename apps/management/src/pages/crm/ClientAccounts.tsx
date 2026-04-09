import { useMemo, useState, useCallback } from 'react';
import { Building, Plus, Pencil, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useClientAccounts, useCreateClientAccount, useUpdateClientAccount, useDeleteClientAccount } from '@/api/admin-resources';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import type { ClientAccount } from '@/api/admin-resources';
import { useAuthStore } from '@/store/authStore';
import type { StaffUser } from '@/types/auth';

const SENIOR_ROLES = ['CEO', 'CO_MD', 'OP_MANAGER'];
const emptyForm = { clientName: '', email: '', country: '' };

export default function ClientAccounts() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editTarget, setEditTarget] = useState<ClientAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientAccount | null>(null);

  const user = useAuthStore((s) => s.user) as StaffUser | null;
  const canManage = SENIOR_ROLES.includes(user?.systemRole ?? '');

  const { data, isLoading } = useClientAccounts({ page, limit: 20 });
  const createClient = useCreateClientAccount();
  const updateClient = useUpdateClientAccount();
  const deleteClient = useDeleteClientAccount();

  const openCreate = useCallback(() => { setEditTarget(null); setForm(emptyForm); setOpen(true); }, []);
  const openEdit = useCallback((row: ClientAccount) => {
    setEditTarget(row);
    setForm({ clientName: row.clientName, email: row.email ?? '', country: row.country ?? '' });
    setOpen(true);
  }, []);

  useHeaderConfig(useMemo(() => ({
    title: 'Client Accounts',
    breadcrumbs: [{ label: 'CRM' }, { label: 'Client Accounts' }],
    actions: canManage ? [{ type: 'button' as const, label: 'New Client', icon: Plus, onClick: openCreate }] : [],
  }), [canManage, openCreate]));

  const handleSave = async () => {
    if (!form.clientName.trim() || !form.email.trim()) return toast.error('Client name and email are required');
    try {
      if (editTarget) {
        await updateClient.mutateAsync({ id: editTarget.id, clientName: form.clientName.trim(), email: form.email.trim(), country: form.country || undefined });
        toast.success('Client account updated');
      } else {
        await createClient.mutateAsync({ clientName: form.clientName.trim(), email: form.email.trim(), country: form.country || undefined });
        toast.success('Client account created');
      }
      setOpen(false);
      setForm(emptyForm);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteClient.mutateAsync(deleteTarget.id);
      toast.success('Client account deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const rows = data?.data ?? [];
  const columns: Column<ClientAccount>[] = [
    { key: 'clientName', label: 'Client', sticky: true, render: (r) => <span className="font-semibold text-gray-900 dark:text-gray-100">{r.clientName}</span> },
    { key: 'email', label: 'Email', render: (r) => <span className="text-gray-600 dark:text-gray-400">{r.email ?? '—'}</span> },
    { key: 'country', label: 'Country', render: (r) => <span>{r.country || '—'}</span> },
    { key: 'totalOrders', label: 'Orders', align: 'right', render: (r) => <span className="font-medium">{r.totalOrders}</span> },
    { key: 'totalSpentUsd', label: 'Spent', align: 'right', render: (r) => <span className="font-medium">{formatCurrency(r.totalSpentUsd || 0)}</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'Active' ? 'success' : 'default'} size="sm">{r.status}</Badge> },
    ...(canManage ? [{
      key: 'actions' as keyof ClientAccount,
      label: '',
      align: 'right' as const,
      render: (r: ClientAccount) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(r)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:text-red-700" onClick={() => setDeleteTarget(r)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <PageTransition>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        pagination={data?.meta}
        onPageChange={setPage}
        emptyIcon={<Building />}
        emptyTitle="No client accounts"
        emptyDescription="Create client records for CRM and finance tracking."
      />

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editTarget ? 'Edit Client Account' : 'Create Client Account'}
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" isLoading={createClient.isPending || updateClient.isPending} onClick={handleSave}>
              {editTarget ? 'Update' : 'Create'}
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label="Client Name *" value={form.clientName} onChange={(e) => setForm(f => ({ ...f, clientName: e.target.value }))} />
          <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Country" value={form.country} onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))} />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Client Account"
        message={`Delete "${deleteTarget?.clientName}"? All associated data will be removed.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteClient.isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}

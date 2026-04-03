import { useState, useMemo } from 'react';
import { Briefcase, Plus, Pencil, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/api/services';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageTransition } from '@/components/ui/PageTransition';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/mocks/generators';
import { useAuthStore } from '@/store/authStore';
import type { StaffUser } from '@/types/auth';
import type { Service } from '@/types/models';
import { toast } from 'sonner';

const SENIOR_ROLES = ['CEO', 'CO_MD', 'OP_MANAGER'];

const categoryColors: Record<string, 'success' | 'primary' | 'info' | 'warning' | 'danger'> = {
  SEO: 'success',
  Development: 'primary',
  Content: 'info',
  Marketing: 'warning',
  Design: 'danger',
};

const emptyForm = { name: '', category: 'SEO', shortDescription: '', basePriceUsd: '', status: 'Active' };

export default function ServiceList() {
  const { data: services, isLoading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const user = useAuthStore((s) => s.user) as StaffUser | null;
  const canManage = SENIOR_ROLES.includes(user?.systemRole ?? '');

  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<Service | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setEditRow(null); setForm(emptyForm); setModalOpen(true); };
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

  const handleDelete = async (svc: Service) => {
    if (!confirm(`Delete service "${svc.name}"?`)) return;
    try {
      await deleteService.mutateAsync(svc.id);
      toast.success('Service deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const headerConfig = useMemo(() => ({
    title: 'Services',
    breadcrumbs: [{ label: 'Services', icon: Briefcase }],
    actions: canManage
      ? [{ type: 'button' as const, label: 'Add Service', icon: Plus, onClick: openCreate }]
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
          : services?.map((service) => (
              <Card key={service.id} hover>
                <CardHeader>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                      <div className="h-4 w-4 rounded-full bg-primary-500" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate">{service.name}</CardTitle>
                      <Badge variant={categoryColors[service.category] ?? 'default'} size="sm">
                        {service.category}
                      </Badge>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(service); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="xs" variant="ghost" className="text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); handleDelete(service); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardHeader>

                <CardContent>
                  {service.description && (
                    <p className="mb-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{service.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(service.priceRange.min)} - {formatCurrency(service.priceRange.max)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {service.orderCount} orders
                    </span>
                  </div>
                  {!service.isActive && (
                    <Badge variant="danger" size="sm" className="mt-2">Inactive</Badge>
                  )}
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
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Category</label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={form.category}
              onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {['SEO', 'Development', 'Content', 'Marketing', 'Design', 'General'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Description</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={form.shortDescription}
              onChange={(e) => setForm(f => ({ ...f, shortDescription: e.target.value }))}
            />
          </div>
          <Input type="number" label="Base Price (USD)" value={form.basePriceUsd} onChange={(e) => setForm(f => ({ ...f, basePriceUsd: e.target.value }))} />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={form.status}
              onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}

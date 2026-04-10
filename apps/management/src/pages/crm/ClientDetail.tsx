import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Mail, MapPin, ShoppingCart, DollarSign, Pencil, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useClientAccount, useUpdateClientAccount, useDeleteClientAccount } from '@/api/admin-resources';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuthStore } from '@/store/authStore';
import type { StaffUser } from '@/types/auth';
import { toast } from 'sonner';

const SENIOR_ROLES = ['CEO', 'CO_MD', 'OP_MANAGER'];

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  const user = useAuthStore((s) => s.user) as StaffUser | null;
  const canManage = SENIOR_ROLES.includes(user?.systemRole ?? '');

  const { data: client, isLoading, isError } = useClientAccount(id);
  const updateClient = useUpdateClientAccount();
  const deleteClient = useDeleteClientAccount();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({ clientName: '', email: '', country: '' });

  const headerConfig = useMemo(() => ({
    title: client?.clientName || 'Client Details',
    breadcrumbs: [
      { label: 'CRM', href: '/crm/clients' },
      { label: 'Clients', href: '/crm/clients' },
      { label: client?.clientName || 'Details' },
    ],
    actions: canManage ? [
      { type: 'button' as const, label: 'Edit', icon: Pencil, variant: 'outline' as const, onClick: () => openEdit() },
    ] : [],
  }), [client, canManage]);

  useHeaderConfig(headerConfig);

  const openEdit = () => {
    if (client) {
      setForm({
        clientName: client.clientName,
        email: client.email,
        country: client.country || '',
      });
      setShowEdit(true);
    }
  };

  const handleUpdate = async () => {
    if (!id || !form.clientName.trim() || !form.email.trim()) {
      toast.error('Client name and email are required');
      return;
    }
    try {
      await updateClient.mutateAsync({
        id,
        clientName: form.clientName.trim(),
        email: form.email.trim(),
        country: form.country || undefined,
      });
      toast.success('Client updated');
      setShowEdit(false);
    } catch {
      toast.error('Failed to update client');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteClient.mutateAsync(id);
      toast.success('Client deleted');
      navigate('/crm/clients');
    } catch {
      toast.error('Failed to delete client');
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isError || !client) {
    return (
      <PageTransition>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Client not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/crm/clients')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/crm/clients')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>

        {/* Header Card */}
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/30">
                  <Building className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{client.clientName}</h2>
                  <Badge variant={client.status === 'Active' ? 'success' : 'default'} className="mt-1">
                    {client.status}
                  </Badge>
                </div>
              </div>
              {canManage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{client.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Country</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{client.country || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{client.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(client.totalSpentUsd)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Account Created</dt>
                <dd className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {new Date(client.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Average Order Value</dt>
                <dd className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {client.totalOrders > 0
                    ? formatCurrency(client.totalSpentUsd / client.totalOrders)
                    : '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Edit Modal */}
        <Modal
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          title="Edit Client"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button isLoading={updateClient.isPending} onClick={handleUpdate}>Save Changes</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Client Name *"
              value={form.clientName}
              onChange={(e) => setForm(f => ({ ...f, clientName: e.target.value }))}
            />
            <Input
              label="Email *"
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            />
            <Input
              label="Country"
              value={form.country}
              onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))}
            />
          </div>
        </Modal>

        {/* Delete Confirm */}
        <ConfirmDialog
          isOpen={showDelete}
          onClose={() => setShowDelete(false)}
          title="Delete Client Account"
          message={`Delete "${client.clientName}"? All associated data will be removed.`}
          confirmLabel="Delete"
          variant="danger"
          isLoading={deleteClient.isPending}
          onConfirm={handleDelete}
        />
      </div>
    </PageTransition>
  );
}

import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Laptop, User, Network, Building2, Pencil, Trash2, Calendar } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useDevice, useUpdateDevice, useDeleteDevice } from '@/api/admin-resources';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Maintenance', value: 'Maintenance' },
];

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perm = usePermission();

  const { data: device, isLoading, isError } = useDevice(id);
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({
    deviceName: '',
    deviceType: '',
    ipAddress: '',
    status: 'Active',
  });

  const headerConfig = useMemo(() => ({
    title: device?.deviceName || 'Device Details',
    breadcrumbs: [
      { label: 'Assets', href: '/assets/devices' },
      { label: 'Devices', href: '/assets/devices' },
      { label: device?.deviceName || 'Details' },
    ],
    actions: perm.can('assets.devices') ? [
      { type: 'button' as const, label: 'Edit', icon: Pencil, variant: 'outline' as const, onClick: () => openEdit() },
    ] : [],
  }), [device, perm]);

  useHeaderConfig(headerConfig);

  const openEdit = () => {
    if (device) {
      setForm({
        deviceName: device.deviceName,
        deviceType: device.deviceType || '',
        ipAddress: device.ipAddress || '',
        status: device.status,
      });
      setShowEdit(true);
    }
  };

  const handleUpdate = async () => {
    if (!id || !form.deviceName.trim()) {
      toast.error('Device name is required');
      return;
    }
    try {
      await updateDevice.mutateAsync({
        id,
        deviceName: form.deviceName.trim(),
        deviceType: form.deviceType || undefined,
        ipAddress: form.ipAddress || undefined,
        status: form.status,
      });
      toast.success('Device updated');
      setShowEdit(false);
    } catch {
      toast.error('Failed to update device');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteDevice.mutateAsync(id);
      toast.success('Device deleted');
      navigate('/assets/devices');
    } catch {
      toast.error('Failed to delete device');
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

  if (isError || !device) {
    return (
      <PageTransition>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Device not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/assets/devices')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Devices
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/assets/devices')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Devices
        </Button>

        {/* Header Card */}
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <Laptop className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{device.deviceName}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    {device.deviceType && (
                      <Badge variant="default">{device.deviceType}</Badge>
                    )}
                    <Badge variant={device.status === 'Active' ? 'success' : device.status === 'Maintenance' ? 'warning' : 'default'}>
                      {device.status}
                    </Badge>
                  </div>
                </div>
              </div>
              {perm.can('assets.devices') && (
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

        {/* Details Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Device Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Network className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">IP Address</p>
                  <p className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {device.ipAddress || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Branch</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {device.branch || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Registered On</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(device.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned To</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Staff Member ID</p>
                  <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {device.staffMemberId}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate(`/staff/${device.staffMemberId}`)}
              >
                View Staff Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Edit Modal */}
        <Modal
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          title="Edit Device"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button isLoading={updateDevice.isPending} onClick={handleUpdate}>Save Changes</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Device Name *"
              value={form.deviceName}
              onChange={(e) => setForm(f => ({ ...f, deviceName: e.target.value }))}
            />
            <Input
              label="Device Type"
              placeholder="e.g. Laptop, Desktop, Phone"
              value={form.deviceType}
              onChange={(e) => setForm(f => ({ ...f, deviceType: e.target.value }))}
            />
            <Input
              label="IP Address"
              placeholder="e.g. 192.168.1.100"
              value={form.ipAddress}
              onChange={(e) => setForm(f => ({ ...f, ipAddress: e.target.value }))}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
            />
          </div>
        </Modal>

        {/* Delete Confirm */}
        <ConfirmDialog
          isOpen={showDelete}
          onClose={() => setShowDelete(false)}
          title="Delete Device"
          message={`Delete "${device.deviceName}"? This cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          isLoading={deleteDevice.isPending}
          onConfirm={handleDelete}
        />
      </div>
    </PageTransition>
  );
}

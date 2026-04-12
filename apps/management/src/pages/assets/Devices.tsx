import { useMemo, useState } from 'react';
import { Laptop, Plus } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCreateDevice, useDevices } from '@/api/admin-resources';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Device } from '@/api/admin-resources';
import { toast } from 'sonner';

export default function Devices() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [staffMemberId, setStaffMemberId] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [ipAddress, setIpAddress] = useState('');

  const { data, isLoading } = useDevices({ page, limit: 20 });
  const createDevice = useCreateDevice();

  useHeaderConfig(useMemo(() => ({
    title: 'Devices',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Assets' }, { label: 'Devices' }],
    actions: [{ type: 'button' as const, label: 'Add Device', icon: Plus, onClick: () => setOpen(true) }],
  }), []));

  const rows = data?.data ?? [];
  const columns: Column<Device>[] = [
    { key: 'deviceName', label: 'Device', sticky: true, render: (r) => <span className="font-medium">{r.deviceName}</span> },
    { key: 'deviceType', label: 'Type', render: (r) => <span>{r.deviceType || '-'}</span> },
    { key: 'ipAddress', label: 'IP', render: (r) => <span className="font-mono text-xs">{r.ipAddress || '-'}</span> },
    { key: 'staffMemberId', label: 'Staff ID', render: (r) => <span className="font-mono text-xs">{r.staffMemberId}</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'Active' ? 'success' : 'default'} size="sm">{r.status}</Badge> },
  ];

  return (
    <PageTransition>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        pagination={data?.meta}
        onPageChange={setPage}
        emptyIcon={<Laptop />}
        emptyTitle="No devices found"
        emptyDescription="Register devices used by staff."
      />

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Add Device"
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              isLoading={createDevice.isPending}
              onClick={async () => {
                if (!deviceName.trim() || !staffMemberId.trim()) return toast.error('Device name and staff member id required');
                try {
                  await createDevice.mutateAsync({
                    deviceName: deviceName.trim(),
                    staffMemberId: staffMemberId.trim(),
                    deviceType: deviceType || undefined,
                    ipAddress: ipAddress || undefined,
                  });
                  setOpen(false);
                  setDeviceName('');
                  setStaffMemberId('');
                  setDeviceType('');
                  setIpAddress('');
                  toast.success('Device added');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to add device');
                }
              }}
            >
              Save
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label="Device Name" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
          <Input label="Staff Member ID" value={staffMemberId} onChange={(e) => setStaffMemberId(e.target.value)} />
          <Select
            label="Device Type"
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            options={[
              { label: '— Select —', value: '' },
              { label: 'Laptop', value: 'Laptop' },
              { label: 'Desktop', value: 'Desktop' },
              { label: 'Phone', value: 'Phone' },
              { label: 'Tablet', value: 'Tablet' },
              { label: 'Monitor', value: 'Monitor' },
              { label: 'Other', value: 'Other' },
            ]}
          />
          <Input label="IP Address" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} />
        </div>
      </Modal>
    </PageTransition>
  );
}

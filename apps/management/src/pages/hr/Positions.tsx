import { useMemo, useState } from 'react';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePositions, useCreatePosition, useUpdatePosition } from '@/api/hr';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageTransition } from '@/components/ui/PageTransition';
import { usePermission } from '@/hooks/usePermission';
import type { Position } from '@/types/models';
import { toast } from 'sonner';

const typeLabels: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
};

const typeVariants: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
  full_time: 'primary',
  part_time: 'info',
  contract: 'warning',
  internship: 'success',
};

const EMPTY_FORM = {
  title: '',
  department: '',
  branch: '',
  employmentType: 'full_time',
  salaryMin: '',
  salaryMax: '',
  status: 'open',
  postedDate: new Date().toISOString().split('T')[0],
};

export default function Positions() {
  const { data, isLoading } = usePositions();
  const positions = data ?? [];
  const perm = usePermission();
  const createPosition = useCreatePosition();
  const updatePosition = useUpdatePosition();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (pos: Position) => {
    setEditing(pos);
    setForm({
      title: pos.title,
      department: pos.department,
      branch: pos.location,
      employmentType: pos.type,
      salaryMin: String(pos.salaryRange.min),
      salaryMax: String(pos.salaryRange.max),
      status: pos.status,
      postedDate: pos.postedDate ? pos.postedDate.split('T')[0] : EMPTY_FORM.postedDate,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Position title is required');
      return;
    }
    const payload = {
      title: form.title,
      department: form.department,
      branch: form.branch,
      employmentType: form.employmentType,
      salaryMin: Number(form.salaryMin) || 0,
      salaryMax: Number(form.salaryMax) || 0,
      status: form.status,
      postedDate: form.postedDate,
    };
    try {
      if (editing) {
        await updatePosition.mutateAsync({ id: editing.id, ...payload });
        toast.success('Position updated');
      } else {
        await createPosition.mutateAsync(payload);
        toast.success('Position created');
      }
      setShowModal(false);
    } catch {
      toast.error(`Failed to ${editing ? 'update' : 'create'} position`);
    }
  };

  const headerConfig = useMemo(() => ({
    title: 'Open Positions',
    breadcrumbs: [
      { label: 'HR', href: '/hr' },
      { label: 'Positions', icon: Users },
    ],
    actions: perm.isHR ? [
      { type: 'button' as const, label: 'Add Position', icon: Plus, onClick: openCreate },
    ] : [],
  }), [perm.isHR]);
  useHeaderConfig(headerConfig);

  const columns: Column<Position>[] = [
    {
      key: 'title',
      label: 'Title',
      sticky: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{row.title}</span>
      ),
    },
    { key: 'department', label: 'Department' },
    { key: 'location', label: 'Location' },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <Badge variant={typeVariants[row.type] ?? 'default'}>
          {typeLabels[row.type] ?? row.type}
        </Badge>
      ),
    },
    {
      key: 'applicationsCount',
      label: 'Applications',
      align: 'center',
      render: (row) => (
        <span className="font-medium">{row.applicationsCount}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'postedDate',
      label: 'Posted',
      render: (row) => (
        <span className="text-gray-500 dark:text-gray-400">
          {new Date(row.postedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    ...(perm.isHR ? [{
      key: 'actions' as keyof Position,
      label: 'Actions',
      render: (row: Position) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const isPending = createPosition.isPending || updatePosition.isPending;

  return (
    <PageTransition>
      <DataTable
        columns={columns}
        data={positions}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyTitle="No positions found"
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Position' : 'New Position'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button isLoading={isPending} onClick={handleSubmit}>
              {editing ? 'Save Changes' : 'Create Position'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Position Title *</label>
            <input className={inputCls} placeholder="e.g. Frontend Developer" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Department</label>
              <input className={inputCls} placeholder="e.g. Engineering" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Location / Branch</label>
              <input className={inputCls} placeholder="e.g. Dhaka" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Employment Type</label>
              <select className={inputCls} value={form.employmentType} onChange={e => setForm(f => ({ ...f, employmentType: e.target.value }))}>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="open">Open</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Min Salary (USD)</label>
              <input className={inputCls} type="number" min="0" value={form.salaryMin} onChange={e => setForm(f => ({ ...f, salaryMin: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Max Salary (USD)</label>
              <input className={inputCls} type="number" min="0" value={form.salaryMax} onChange={e => setForm(f => ({ ...f, salaryMax: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Posted Date</label>
            <input className={inputCls} type="date" value={form.postedDate} onChange={e => setForm(f => ({ ...f, postedDate: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}

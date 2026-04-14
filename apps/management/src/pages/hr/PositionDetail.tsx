import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Calendar, Users, Pencil, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePosition, useUpdatePosition, useDeletePosition, useApplications } from '@/api/hr';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { usePermission } from '@/hooks/usePermission';
import { useCurrency } from '@/hooks/useCurrency';
import type { JobApplication } from '@/types/models';
import { toast } from 'sonner';

const TYPE_OPTIONS = [
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Internship', value: 'internship' },
];

const STATUS_OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'Paused', value: 'paused' },
  { label: 'Closed', value: 'closed' },
];

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

export default function PositionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perm = usePermission();
  const { formatCurrency } = useCurrency();

  const { data: position, isLoading, isError } = usePosition(id);
  const { data: applicationsData } = useApplications({ positionId: id, limit: 100 });
  const updatePosition = useUpdatePosition();
  const deletePosition = useDeletePosition();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({
    title: '',
    department: '',
    branch: '',
    employmentType: 'full_time',
    salaryMin: '',
    salaryMax: '',
    status: 'open',
  });

  const applications = applicationsData?.data?.filter(app => app.positionId === id) ?? [];

  const headerConfig = useMemo(() => ({
    title: position?.title || 'Position Details',
    breadcrumbs: [
      { label: 'HR', href: '/hr/positions' },
      { label: 'Positions', href: '/hr/positions' },
      { label: position?.title || 'Details' },
    ],
    actions: perm.can('hr.recruitment') ? [
      { type: 'button' as const, label: 'Edit', icon: Pencil, variant: 'outline' as const, onClick: () => openEdit() },
    ] : [],
  }), [position, perm]);

  useHeaderConfig(headerConfig);

  const openEdit = () => {
    if (position) {
      setForm({
        title: position.title,
        department: position.department,
        branch: position.location,
        employmentType: position.type,
        salaryMin: String(position.salaryRange.min),
        salaryMax: String(position.salaryRange.max),
        status: position.status,
      });
      setShowEdit(true);
    }
  };

  const handleUpdate = async () => {
    if (!id || !form.title.trim()) return;
    try {
      await updatePosition.mutateAsync({
        id,
        title: form.title,
        department: form.department,
        branch: form.branch,
        employmentType: form.employmentType,
        salaryMin: Number(form.salaryMin) || 0,
        salaryMax: Number(form.salaryMax) || 0,
        status: form.status,
      });
      toast.success('Position updated');
      setShowEdit(false);
    } catch {
      toast.error('Failed to update position');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deletePosition.mutateAsync(id);
      toast.success('Position deleted');
      navigate('/hr/positions');
    } catch {
      toast.error('Failed to delete position');
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const applicationColumns: Column<JobApplication>[] = [
    {
      key: 'applicantName',
      label: 'Applicant',
      sticky: true,
      render: (row) => <span className="font-medium">{row.applicantName}</span>,
    },
    { key: 'applicantEmail', label: 'Email' },
    {
      key: 'stage',
      label: 'Stage',
      render: (row) => <StatusBadge status={row.stage} />,
    },
    {
      key: 'appliedDate',
      label: 'Applied',
      render: (row) => (
        <span className="text-gray-500">
          {new Date(row.appliedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      ),
    },
  ];

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

  if (isError || !position) {
    return (
      <PageTransition>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Position not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/hr/positions')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Positions
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/hr/positions')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Positions
        </Button>

        {/* Header Card */}
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{position.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={typeVariants[position.type] ?? 'default'}>
                    {typeLabels[position.type] ?? position.type}
                  </Badge>
                  <StatusBadge status={position.status} />
                </div>
              </div>
              {perm.can('hr.recruitment') && (
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{position.department}</p>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{position.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Salary Range</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(position.salaryRange.min)} - {formatCurrency(position.salaryRange.max)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Applications</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{position.applicationsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posted Date */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Posted on {new Date(position.postedDate).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Applications */}
        {applications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Applications ({applications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={applicationColumns}
                data={applications}
                onRowClick={(row) => navigate(`/hr/applications/${row.id}`)}
                emptyTitle="No applications"
                emptyDescription="No candidates have applied for this position yet."
              />
            </CardContent>
          </Card>
        )}

        {/* Edit Modal */}
        <Modal
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          title="Edit Position"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button isLoading={updatePosition.isPending} onClick={handleUpdate}>Save Changes</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Position Title *" value={form.title} onChange={set('title')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Department" value={form.department} onChange={set('department')} />
              <Input label="Location" value={form.branch} onChange={set('branch')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Employment Type" options={TYPE_OPTIONS} value={form.employmentType} onChange={set('employmentType')} />
              <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={set('status')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Min Salary (USD)" type="number" value={form.salaryMin} onChange={set('salaryMin')} />
              <Input label="Max Salary (USD)" type="number" value={form.salaryMax} onChange={set('salaryMax')} />
            </div>
          </div>
        </Modal>

        {/* Delete Confirm */}
        <ConfirmDialog
          isOpen={showDelete}
          onClose={() => setShowDelete(false)}
          title="Delete Position"
          message={`Delete "${position.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          isLoading={deletePosition.isPending}
          onConfirm={handleDelete}
        />
      </div>
    </PageTransition>
  );
}

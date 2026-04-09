import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Star } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useApplications, useUpdateApplication } from '@/api/hr';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { PageTransition } from '@/components/ui/PageTransition';
import { usePermission } from '@/hooks/usePermission';
import type { JobApplication } from '@/types/models';
import { toast } from 'sonner';

const stageTabs = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Screening', value: 'screening' },
  { label: 'Interview', value: 'interview' },
  { label: 'Offer', value: 'offer' },
  { label: 'Hired', value: 'hired' },
  { label: 'Rejected', value: 'rejected' },
];

const STAGE_TRANSITIONS: Record<JobApplication['stage'], JobApplication['stage'][]> = {
  new: ['screening', 'rejected'],
  screening: ['interview', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: ['hired', 'rejected'],
  hired: [],
  rejected: ['new'],
};

const STAGE_LABELS: Record<JobApplication['stage'], string> = {
  new: 'New',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-200 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

export default function Applications() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('all');
  const [page, setPage] = useState(1);
  const perm = usePermission();
  const updateApplication = useUpdateApplication();

  const params = useMemo(() => ({
    status: stage === 'all' ? undefined : stage,
    page,
    limit: 20,
  }), [stage, page]);

  const { data, isLoading } = useApplications(params);
  const applications = data?.data ?? [];

  const headerConfig = useMemo(() => ({
    title: 'Applications',
    breadcrumbs: [
      { label: 'HR', href: '/hr' },
      { label: 'Applications', icon: UserCheck },
    ],
    actions: [],
  }), []);
  useHeaderConfig(headerConfig);

  const handleStageChange = async (row: JobApplication, newStage: JobApplication['stage'], e: React.MouseEvent) => {
    e.stopPropagation();
    const statusMap: Record<string, string> = {
      new: 'New', screening: 'Screening', interview: 'Interview',
      offer: 'Offer', hired: 'Hired', rejected: 'Rejected',
    };
    try {
      await updateApplication.mutateAsync({ id: row.id, status: statusMap[newStage] ?? newStage });
      toast.success(`Application moved to ${STAGE_LABELS[newStage]}`);
    } catch {
      toast.error('Failed to update application status');
    }
  };

  const columns: Column<JobApplication>[] = [
    {
      key: 'applicantName',
      label: 'Applicant',
      sticky: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{row.applicantName}</span>
      ),
    },
    { key: 'positionTitle', label: 'Position' },
    {
      key: 'stage',
      label: 'Stage',
      render: (row) => <StatusBadge status={row.stage} />,
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (row) => <StarRating rating={row.rating} />,
    },
    {
      key: 'appliedDate',
      label: 'Applied',
      render: (row) => (
        <span className="text-gray-500 dark:text-gray-400">
          {new Date(row.appliedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      ),
    },
    ...(perm.can('hr.recruitment') ? [{
      key: 'actions' as keyof JobApplication,
      label: 'Actions',
      render: (row: JobApplication) => {
        const transitions = STAGE_TRANSITIONS[row.stage] ?? [];
        if (transitions.length === 0) return null;
        return (
          <div className="flex gap-1">
            {transitions.map(nextStage => (
              <Button
                key={nextStage}
                size="sm"
                variant={nextStage === 'rejected' ? 'ghost' : 'outline'}
                isLoading={updateApplication.isPending}
                onClick={(e) => handleStageChange(row, nextStage, e)}
              >
                {STAGE_LABELS[nextStage]}
              </Button>
            ))}
          </div>
        );
      },
    }] : []),
  ];

  return (
    <PageTransition className="space-y-4">
      <div className="overflow-x-auto">
        <Tabs tabs={stageTabs} value={stage} onChange={(v) => { setStage(v); setPage(1); }} />
      </div>

      <DataTable
        columns={columns}
        data={applications}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        pagination={data?.meta}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/hr/applications/${row.id}`)}
        emptyTitle="No applications found"
      />
    </PageTransition>
  );
}

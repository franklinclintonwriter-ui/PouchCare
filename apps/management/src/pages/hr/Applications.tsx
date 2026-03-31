import { useMemo, useState } from 'react';
import { UserCheck, Star } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useApplications } from '@/api/hr';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import { PageTransition } from '@/components/ui/PageTransition';
import type { JobApplication } from '@/types/models';

const stageTabs = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Screening', value: 'screening' },
  { label: 'Interview', value: 'interview' },
  { label: 'Offer', value: 'offer' },
  { label: 'Hired', value: 'hired' },
  { label: 'Rejected', value: 'rejected' },
];

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
  const [stage, setStage] = useState('all');
  const [page, setPage] = useState(1);

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
        <span className="text-gray-500 dark:text-gray-400">{row.appliedDate}</span>
      ),
    },
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
        emptyTitle="No applications found"
      />
    </PageTransition>
  );
}

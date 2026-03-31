import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useLeaveRequests } from '@/api/leave';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { StatsRow } from '@/components/shared/StatsRow';
import type { LeaveRequest } from '@/types/models';

const leaveTypeBadge: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  ANNUAL: 'primary',
  SICK: 'danger',
  EMERGENCY: 'warning',
  MATERNITY: 'info',
  PATERNITY: 'info',
  UNPAID: 'default',
};

export default function LeaveList() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);

  const statusParam = tab === 'all' ? undefined : tab.toUpperCase();

  const { data, isLoading } = useLeaveRequests({
    status: statusParam,
    page,
    limit: 20,
  });

  const allData = useLeaveRequests({});
  const allLeaves = allData.data?.data ?? [];

  const leaves = data?.data ?? [];
  const meta = data?.meta;

  const stats = useMemo(() => {
    const total = allData.data?.meta?.total ?? 0;
    const pending = allLeaves.filter(l => l.status === 'PENDING').length;
    const approved = allLeaves.filter(l => l.status === 'APPROVED').length;
    const rejected = allLeaves.filter(l => l.status === 'REJECTED').length;
    return [
      { title: 'Total Requests', value: total, icon: <Calendar />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { title: 'Pending', value: pending, icon: <Clock />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
      { title: 'Approved', value: approved, icon: <CheckCircle2 />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
      { title: 'Rejected', value: rejected, icon: <XCircle />, iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    ];
  }, [allLeaves, allData.data?.meta]);

  const tabItems = useMemo(() => [
    { label: 'All', value: 'all', count: allData.data?.meta?.total },
    { label: 'Pending', value: 'pending', count: allLeaves.filter(l => l.status === 'PENDING').length },
    { label: 'Approved', value: 'approved', count: allLeaves.filter(l => l.status === 'APPROVED').length },
  ], [allLeaves, allData.data?.meta]);

  const headerConfig = useMemo(() => ({
    title: 'Leave Requests',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Leave' }],
    actions: [{ type: 'button' as const, label: 'Request Leave', onClick: () => navigate('/leave/request') }],
  }), [navigate]);

  useHeaderConfig(headerConfig);

  const handleTabChange = (val: string) => {
    setTab(val);
    setPage(1);
  };

  const columns: Column<LeaveRequest>[] = [
    {
      key: 'staffName',
      label: 'Staff',
      sticky: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.staffName} src={row.avatarUrl} size="xs" />
          <span className="font-medium text-gray-900 dark:text-gray-100">{row.staffName}</span>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <Badge variant={leaveTypeBadge[row.type] ?? 'default'} size="sm">
          {row.type.charAt(0) + row.type.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      key: 'startDate',
      label: 'Start',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(row.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      ),
    },
    {
      key: 'endDate',
      label: 'End',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(row.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      ),
    },
    {
      key: 'days',
      label: 'Days',
      align: 'center',
      render: (row) => (
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{row.days}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(row.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <StatsRow items={stats} loading={isLoading} />

        <Tabs tabs={tabItems} value={tab} onChange={handleTabChange} />

        <DataTable
          columns={columns}
          data={leaves}
          isLoading={isLoading}
          pagination={meta}
          onPageChange={setPage}
          emptyTitle="No leave requests"
          emptyDescription="No requests found in this category"
        />
      </div>
    </PageTransition>
  );
}

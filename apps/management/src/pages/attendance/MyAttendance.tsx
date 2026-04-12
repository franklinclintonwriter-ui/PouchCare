import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Wifi, LogIn } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useMyAttendance } from '@/api/attendance';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { StatsRow } from '@/components/shared/StatsRow';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import type { AttendanceRecord } from '@/types/models';

const workTypeBadge: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'default'> = {
  OFFICE: 'primary',
  REMOTE: 'info',
  FIELD: 'warning',
  LEAVE: 'danger' as 'warning',
  HOLIDAY: 'success',
};

export default function MyAttendance() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data: records = [], isLoading, isError, refetch } = useMyAttendance();

  const paged = useMemo(() => {
    const limit = 20;
    const start = (page - 1) * limit;
    return records.slice(start, start + limit);
  }, [records, page]);

  const paginationMeta = useMemo(() => ({
    total: records.length,
    page,
    limit: 20,
    totalPages: Math.ceil(records.length / 20),
  }), [records.length, page]);

  const stats = useMemo(() => {
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const remote = records.filter(r => r.workType === 'REMOTE').length;
    return [
      { title: 'Present', value: present, icon: <CheckCircle2 />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
      { title: 'Absent', value: absent, icon: <XCircle />, iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
      { title: 'Late', value: late, icon: <Clock />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
      { title: 'Remote', value: remote, icon: <Wifi />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    ];
  }, [records]);

  const headerConfig = useMemo(() => ({
    title: 'My Attendance',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Attendance' }, { label: 'My Attendance' }],
    actions: [{ type: 'button' as const, label: 'Check In / Out', icon: LogIn, variant: 'outline' as const, onClick: () => navigate('/attendance/check') }],
  }), [navigate]);

  useHeaderConfig(headerConfig);

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'date',
      label: 'Date',
      sticky: true,
      render: (row) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {new Date(row.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      ),
    },
    {
      key: 'checkIn',
      label: 'Check In',
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{row.checkIn}</span>
      ),
    },
    {
      key: 'checkOut',
      label: 'Check Out',
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{row.checkOut || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'workType',
      label: 'Work Type',
      render: (row) => (
        <Badge variant={workTypeBadge[row.workType] ?? 'default'} size="sm">
          {row.workType.charAt(0) + row.workType.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      key: 'hours',
      label: 'Hours',
      align: 'center',
      render: (row) => (
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{row.hours}h</span>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {isError ? (
          <QueryErrorState
            title="Could not load your attendance"
            onRetry={() => void refetch()}
          />
        ) : (
          <>
            <StatsRow items={stats} loading={isLoading} />

            <DataTable
              columns={columns}
              data={paged}
              isLoading={isLoading}
              pagination={paginationMeta}
              onPageChange={setPage}
              emptyTitle="No attendance records"
              emptyDescription="Your attendance history will appear here"
            />
          </>
        )}
      </div>
    </PageTransition>
  );
}

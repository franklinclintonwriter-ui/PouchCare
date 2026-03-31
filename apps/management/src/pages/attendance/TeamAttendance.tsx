import { useMemo } from 'react';
import { Users, CheckCircle2, Clock, XCircle, CircleDot, Laptop, type LucideIcon } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useTeamAttendance } from '@/api/attendance';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { StatsRow } from '@/components/shared/StatsRow';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';
import type { AttendanceRecord } from '@/types/models';

const statusConfig: Record<string, { icon: LucideIcon; color: string }> = {
  PRESENT: { icon: CheckCircle2, color: 'text-emerald-500' },
  ABSENT: { icon: XCircle, color: 'text-red-500' },
  LATE: { icon: Clock, color: 'text-amber-500' },
  HALF_DAY: { icon: CircleDot, color: 'text-orange-500' },
  REMOTE: { icon: Laptop, color: 'text-blue-500' },
};

export default function TeamAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const { data: records = [], isLoading } = useTeamAttendance(today);

  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    return [
      { title: 'Team Size', value: total, icon: <Users />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { title: 'Present', value: present, icon: <CheckCircle2 />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
      { title: 'Late', value: late, icon: <Clock />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
      { title: 'Absent', value: absent, icon: <XCircle />, iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    ];
  }, [records]);

  const headerConfig = useMemo(() => ({
    title: 'Team Attendance',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Attendance' }, { label: 'Team' }],
    actions: [],
  }), []);

  useHeaderConfig(headerConfig);

  const columns: Column<AttendanceRecord>[] = [
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
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
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
      key: 'workType',
      label: 'Work Type',
      render: (row) => (
        <Badge variant={row.workType === 'REMOTE' ? 'info' : row.workType === 'FIELD' ? 'warning' : 'default'} size="sm">
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
        <StatsRow items={stats} loading={isLoading} />

        {/* Staff status grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} padding="sm">
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </Card>
              ))
            : records.map(record => (
                <Card key={record.id} padding="sm">
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <Avatar name={record.staffName} src={record.avatarUrl} size="sm" />
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 text-center truncate w-full">
                      {record.staffName.split(' ')[0]}
                    </p>
                    {(() => {
                      const cfg = statusConfig[record.status];
                      if (!cfg) return null;
                      const Icon = cfg.icon;
                      return <Icon className={cn('h-4 w-4', cfg.color)} />;
                    })()}
                  </div>
                </Card>
              ))
          }
        </div>

        {/* Detailed table */}
        <DataTable
          columns={columns}
          data={records}
          isLoading={isLoading}
          emptyTitle="No attendance data"
          emptyDescription="No team attendance records for today"
        />
      </div>
    </PageTransition>
  );
}

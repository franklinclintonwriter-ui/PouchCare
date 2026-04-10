import { useMemo, useState, useCallback } from 'react';
import { Users, CheckCircle2, Clock, XCircle, CircleDot, Laptop, Calendar, ChevronLeft, ChevronRight, RotateCcw, type LucideIcon } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useTeamAttendance, useUpdateAttendance } from '@/api/attendance';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { StatsRow } from '@/components/shared/StatsRow';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';
import type { AttendanceRecord } from '@/types/models';

const statusConfig: Record<string, { icon: LucideIcon; color: string }> = {
  PRESENT: { icon: CheckCircle2, color: 'text-emerald-500' },
  ABSENT: { icon: XCircle, color: 'text-red-500' },
  LATE: { icon: Clock, color: 'text-amber-500' },
  HALF_DAY: { icon: CircleDot, color: 'text-orange-500' },
  REMOTE: { icon: Laptop, color: 'text-blue-500' },
};

function formatDateDisplay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TeamAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const perm = usePermission();
  const canEdit = perm.isCEO || perm.isManager;

  const { data: records = [], isLoading } = useTeamAttendance(selectedDate);
  const updateAttendance = useUpdateAttendance();

  const goToDate = useCallback((offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  }, [selectedDate]);

  const goToToday = useCallback(() => setSelectedDate(today), [today]);

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
    actions: [
      { type: 'button' as const, label: '', icon: ChevronLeft, variant: 'outline' as const, onClick: () => goToDate(-1) },
      { type: 'button' as const, label: formatDateDisplay(selectedDate), icon: Calendar, variant: 'outline' as const, onClick: () => {} },
      { type: 'button' as const, label: '', icon: ChevronRight, variant: 'outline' as const, onClick: () => goToDate(1), disabled: selectedDate === today },
      ...(selectedDate !== today ? [{ type: 'button' as const, label: 'Today', icon: RotateCcw, variant: 'outline' as const, onClick: goToToday }] : []),
    ],
  }), [selectedDate, today, goToDate, goToToday]);

  useHeaderConfig(headerConfig);

  const handleUpdateRecord = async () => {
    if (!editRecord) return;
    try {
      await updateAttendance.mutateAsync({
        id: editRecord.id,
        status: editRecord.status,
        workType: editRecord.workType,
        hoursWorked: editRecord.hours,
      });
      toast.success('Attendance updated');
      setEditRecord(null);
    } catch {
      toast.error('Failed to update attendance');
    }
  };

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
    ...(canEdit ? [{
      key: 'actions' as const,
      label: '',
      width: '60px',
      render: (row: AttendanceRecord) => (
        <Button variant="ghost" size="sm" onClick={() => setEditRecord(row)}>
          Edit
        </Button>
      ),
    }] : []),
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
          emptyDescription={`No team attendance records for ${formatDateDisplay(selectedDate)}`}
        />

        <Modal
          isOpen={!!editRecord}
          onClose={() => setEditRecord(null)}
          title="Edit Attendance"
          description={`Update attendance for ${editRecord?.staffName}`}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditRecord(null)}>Cancel</Button>
              <Button isLoading={updateAttendance.isPending} onClick={handleUpdateRecord}>Save</Button>
            </>
          }
        >
          {editRecord && (
            <div className="space-y-4">
              <Select
                label="Status"
                value={editRecord.status}
                onChange={e => setEditRecord(prev => prev ? { ...prev, status: e.target.value as AttendanceRecord['status'] } : null)}
                options={[
                  { label: 'Present', value: 'PRESENT' },
                  { label: 'Absent', value: 'ABSENT' },
                  { label: 'Late', value: 'LATE' },
                  { label: 'Half Day', value: 'HALF_DAY' },
                  { label: 'On Leave', value: 'ON_LEAVE' },
                ]}
              />
              <Select
                label="Work Type"
                value={editRecord.workType}
                onChange={e => setEditRecord(prev => prev ? { ...prev, workType: e.target.value as AttendanceRecord['workType'] } : null)}
                options={[
                  { label: 'Office', value: 'OFFICE' },
                  { label: 'Remote', value: 'REMOTE' },
                  { label: 'Field', value: 'FIELD' },
                ]}
              />
              <Input
                label="Hours Worked"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={String(editRecord.hours)}
                onChange={e => setEditRecord(prev => prev ? { ...prev, hours: Number(e.target.value) } : null)}
              />
            </div>
          )}
        </Modal>
      </div>
    </PageTransition>
  );
}

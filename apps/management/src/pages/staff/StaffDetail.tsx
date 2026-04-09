import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, Phone, Building, Calendar, Briefcase, DollarSign, Clock, Shield, KeyRound } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePermission } from '@/hooks/usePermission';
import { useAttendance } from '@/api/attendance';
import { useStaffMember } from '@/api/staff';
import { useTasks } from '@/api/tasks';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { StaffProfileStats } from '@/components/staff/StaffProfileStats';
import { StaffRolePermissionsPanel } from '@/components/staff/StaffRolePermissionsPanel';
import { StaffProfileAdminForm } from '@/components/staff/StaffProfileAdminForm';
import { StaffCeoRatingPanel } from '@/components/staff/StaffCeoRatingPanel';
import type { Task, AttendanceRecord } from '@/types/models';
import { ROLE_LABELS } from '@/utils/permissions';

export default function StaffDetail() {
  const { id } = useParams<{ id: string }>();
  const perm = usePermission();
  const { data: member, isLoading } = useStaffMember(id!);
  const { data: memberTasks } = useTasks({ assignedTo: id, limit: 10 });
  const { data: attendance } = useAttendance({ memberId: id, limit: 10 });
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (tab === 'admin' && member && !member.profileAdmin) setTab('overview');
  }, [member, tab]);

  const headerConfig = useMemo(() => ({
    title: member?.name ?? 'Staff Member',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Staff', href: '/staff' },
      { label: member?.name ?? '...' },
    ],
    actions: [],
  }), [member?.name]);

  useHeaderConfig(headerConfig);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (!member) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-20 text-gray-500 dark:text-gray-400">
          Staff member not found
        </div>
      </PageTransition>
    );
  }

  const displayStatus = member.status ?? (member.isActive ? 'Active' : 'Inactive');
  const isActiveBadge = displayStatus.toLowerCase() === 'active';

  const infoItems = [
    { icon: Mail, label: 'Email', value: member.email },
    { icon: Phone, label: 'Phone', value: member.phone },
    { icon: Building, label: 'Branch', value: member.branch },
    { icon: Briefcase, label: 'Department', value: member.department },
    {
      icon: Calendar,
      label: 'Joined',
      value: new Date(member.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    { icon: DollarSign, label: 'Salary', value: `$${member.salary.toLocaleString()}` },
  ];

  const tabDefs = [
    { label: 'Overview', value: 'overview' },
    ...(member.profileAdmin ? [{ label: 'Admin', value: 'admin' }] : []),
    { label: 'Tasks', value: 'tasks' },
    { label: 'Attendance', value: 'attendance' },
  ];

  const tasks = (memberTasks?.data ?? []) as Task[];
  const attRows = (attendance?.data ?? []) as AttendanceRecord[];

  return (
    <PageTransition>
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar name={member.name} src={member.avatarUrl} size="xl" />
            <div className="text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant={isActiveBadge ? 'success' : 'danger'} size="sm" dot>
                  {displayStatus}
                </Badge>
                <Badge variant="primary" size="sm">
                  {ROLE_LABELS[member.systemRole] ?? member.systemRole}
                </Badge>
                {member.profileAdmin ? (
                  <Badge variant="info" size="sm" className="inline-flex gap-1">
                    <Shield className="h-3 w-3" />
                    Can manage
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{member.memberId}</p>
              {member.profileAdmin && member.lastLoginAt ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Last login: {new Date(member.lastLoginAt).toLocaleString('en-GB')}
                  {member.lastLoginIp ? ` · ${member.lastLoginIp}` : ''}
                </p>
              ) : null}
              {member.twoFactorEnabled !== undefined ? (
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 sm:justify-start">
                  <KeyRound className="h-3.5 w-3.5" />
                  2FA {member.twoFactorEnabled ? 'enabled' : 'not enabled'}
                </p>
              ) : null}
            </div>
          </div>
        </Card>

        <Tabs tabs={tabDefs} value={tab} onChange={setTab} />

        {tab === 'overview' && (
          <div className="space-y-6">
            <StaffProfileStats member={member} />
            <Card>
              <CardContent className="mt-0">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {infoItems.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700/50">
                        <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'admin' && member.profileAdmin ? (
          <div className="space-y-6">
            {member.rolePermissions ? (
              <StaffRolePermissionsPanel
                memberRole={member.systemRole}
                rolePermissions={member.rolePermissions}
                canEditMatrix={perm.can('settings.role_permissions')}
              />
            ) : null}
            <StaffProfileAdminForm member={member} />
            {perm.isCEO ? (
              <StaffCeoRatingPanel
                memberId={member.id}
                lastRating={member.ceoPerformanceRating}
                lastNote={member.ceoRatingNote}
                lastRatedDate={member.ceoLastRatedDate}
              />
            ) : null}
          </div>
        ) : null}

        {tab === 'tasks' && (
          <Card>
            <CardContent className="mt-0">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                  <Briefcase className="mb-2 h-8 w-8" />
                  <p className="text-sm">No tasks assigned yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div key={t.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-gray-500">{t.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 'attendance' && (
          <Card>
            <CardContent className="mt-0">
              {attRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                  <Clock className="mb-2 h-8 w-8" />
                  <p className="text-sm">No attendance records</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attRows.map((a) => (
                    <div key={a.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                      <p className="text-sm font-medium">{new Date(a.date).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{a.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}

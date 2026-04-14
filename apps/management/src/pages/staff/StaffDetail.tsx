import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Mail,
  Phone,
  Building,
  Calendar,
  Briefcase,
  DollarSign,
  Clock,
  Shield,
  KeyRound,
  Pencil,
  LayoutGrid,
  FileText,
  ListTodo,
  FileDown,
  Camera,
  Trash2,
} from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/hooks/useAuth';
import { useAttendance } from '@/api/attendance';
import {
  useStaffMember,
  useUpdateStaff,
  useUploadStaffMemberAvatar,
  useDeleteStaffMemberAvatar,
} from '@/api/staff';
import { useStaffDocuments } from '@/api/documents';
import { useTasks } from '@/api/tasks';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StaffProfileStats } from '@/components/staff/StaffProfileStats';
import { StaffRolePermissionsPanel } from '@/components/staff/StaffRolePermissionsPanel';
import { StaffProfileAdminForm } from '@/components/staff/StaffProfileAdminForm';
import { StaffCeoRatingPanel } from '@/components/staff/StaffCeoRatingPanel';
import { DocumentManager } from '@/components/staff/DocumentManager';
import { AvatarUploadDialog } from '@/components/shared/AvatarUploadDialog';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';
import type { Task, AttendanceRecord } from '@/types/models';
import { ROLE_LABELS } from '@/utils/permissions';
import { downloadStaffProfilePdf } from '@/utils/staffProfilePdf';
import { getApiErrorMessage } from '@/utils/apiError';

export default function StaffDetail() {
  const { id } = useParams<{ id: string }>();
  const perm = usePermission();
  const { user } = useAuth();
  const { formatCurrency, formatMoney } = useCurrency();
  const { data: member, isLoading } = useStaffMember(id!);
  const updateStaff = useUpdateStaff();
  const uploadAvatar = useUploadStaffMemberAvatar();
  const deleteAvatar = useDeleteStaffMemberAvatar();
  const { data: memberTasks } = useTasks({ assignedTo: id, limit: 50 });
  const { data: attendance } = useAttendance({ memberId: id, limit: 50 });
  const { data: documentsPage } = useStaffDocuments(id);
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', branch: '', jobRole: '', salary: '' });

  const isOwnProfile = user?.id === id;
  const canEdit = perm.can('staff.manage_profiles') || perm.isCEO;
  const canManageAvatar = Boolean(member?.profileAdmin && id);

  const openEdit = useCallback(() => {
    if (member) {
      setForm({
        name: member.name,
        email: member.email,
        phone: member.phone || '',
        branch: member.branch || '',
        jobRole: member.department || '',
        salary: member.salary != null ? String(member.salary) : '',
      });
    }
    setEditOpen(true);
  }, [member]);

  const handleExportPdf = useCallback(() => {
    if (!member) return;
    if (member.profileScope === 'limited') {
      toast.error('PDF export includes HR-only fields. Open a full profile (self or HR) to export.');
      return;
    }
    try {
      downloadStaffProfilePdf({
        member,
        tasks: (memberTasks?.data ?? []) as Task[],
        attendance: (attendance?.data ?? []) as AttendanceRecord[],
        documents: documentsPage?.data ?? [],
        formatCurrency,
        formatSalary: (n) =>
          formatMoney(n, {
            storedIn: member.preferredCurrency === 'USD' ? 'USD' : 'BDT',
          }),
      });
      toast.success('PDF downloaded');
    } catch {
      toast.error('Could not generate PDF');
    }
  }, [member, memberTasks?.data, attendance?.data, documentsPage?.data, formatCurrency, formatMoney]);

  const handleSave = async () => {
    if (!id || !form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      await updateStaff.mutateAsync({
        id,
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone || undefined,
        branch: form.branch || undefined,
        jobRole: form.jobRole.trim() || undefined,
        salary: form.salary ? Number(form.salary) : undefined,
      });
      toast.success('Staff member updated');
      setEditOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update staff member'));
    }
  };

  const handleAvatarSelect = async (file: File | undefined) => {
    if (!file || !id) return;
    try {
      setAvatarBusy(true);
      await uploadAvatar.mutateAsync({ id, file });
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to upload profile photo'));
      throw err;
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!id) return;
    try {
      setAvatarBusy(true);
      await deleteAvatar.mutateAsync(id);
      toast.success('Profile photo removed');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to remove profile photo'));
    } finally {
      setAvatarBusy(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

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
    actions: [
      ...(member && member.profileScope !== 'limited'
        ? [{ type: 'button' as const, label: 'Export PDF', icon: FileDown, variant: 'outline' as const, onClick: handleExportPdf }]
        : []),
      ...(canEdit
        ? [{ type: 'button' as const, label: 'Edit', icon: Pencil, variant: 'outline' as const, onClick: openEdit }]
        : []),
    ],
  }), [member, canEdit, openEdit, handleExportPdf]);

  useHeaderConfig(headerConfig);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Card padding="none" className="overflow-hidden">
            <div className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start sm:gap-8">
              <Skeleton className="h-24 w-24 shrink-0 rounded-full sm:h-28 sm:w-28" />
              <div className="w-full space-y-3">
                <Skeleton className="mx-auto h-7 w-48 rounded-lg sm:mx-0 sm:w-64" />
                <Skeleton className="mx-auto h-4 w-40 rounded sm:mx-0" />
                <div className="flex justify-center gap-2 sm:justify-start">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            </div>
          </Card>
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
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
  const isLimitedProfile = member.profileScope === 'limited';

  const infoItems = useMemo(() => {
    const joined =
      member.joinDate && !Number.isNaN(new Date(member.joinDate).getTime())
        ? new Date(member.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';
    const rows: { icon: typeof Mail; label: string; value: string }[] = [
      { icon: Mail, label: 'Email', value: member.email },
      { icon: Phone, label: 'Phone', value: member.phone || '—' },
      { icon: Building, label: 'Branch', value: member.branch || '—' },
      { icon: Briefcase, label: 'Department', value: member.department || '—' },
      { icon: Calendar, label: 'Joined', value: joined },
    ];
    if (!isLimitedProfile) {
      rows.push({
        icon: DollarSign,
        label: 'Salary',
        value: formatMoney(member.salary ?? 0, {
          storedIn: member.preferredCurrency === 'USD' ? 'USD' : 'BDT',
        }),
      });
    }
    return rows;
  }, [member, formatMoney, isLimitedProfile]);

  const tabDefs = [
    { label: 'Overview', value: 'overview', icon: <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> },
    { label: 'Documents', value: 'documents', icon: <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> },
    ...(member.profileAdmin ? [{ label: 'Admin', value: 'admin', icon: <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> }] : []),
    { label: 'Tasks', value: 'tasks', icon: <ListTodo className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> },
    { label: 'Attendance', value: 'attendance', icon: <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> },
  ];

  const tasks = (memberTasks?.data ?? []) as Task[];
  const attRows = (attendance?.data ?? []) as AttendanceRecord[];

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-8">
        {/* Profile hero */}
        <Card
          padding="none"
          className="overflow-hidden border-gray-200/90 bg-gradient-to-br from-white via-gray-50/60 to-primary-50/15 shadow-sm ring-1 ring-gray-200/50 dark:border-gray-700/50 dark:from-gray-900 dark:via-gray-900/95 dark:to-primary-950/20 dark:ring-gray-700/40"
        >
          <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
            <div className="flex justify-center sm:justify-start">
              <div className="relative">
                <Avatar name={member.name} src={member.avatarUrl} size="xl" className="!h-28 !w-28 text-2xl ring-4 ring-white shadow-md dark:ring-gray-800 sm:!h-32 sm:!w-32" />
                {avatarBusy ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35">
                    <span className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                ) : null}
              </div>
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-3xl">
                {member.name}
              </h1>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 sm:justify-start">
                <Mail className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                <a href={`mailto:${member.email}`} className="truncate font-medium text-primary-600 hover:underline dark:text-primary-400">
                  {member.email}
                </a>
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant={isActiveBadge ? 'success' : 'danger'} size="sm" dot>
                  {displayStatus}
                </Badge>
                <Badge variant="primary" size="sm">
                  {ROLE_LABELS[member.systemRole] ?? member.systemRole}
                </Badge>
                {member.profileAdmin ? (
                  <Badge variant="info" size="sm" className="inline-flex gap-1">
                    <Shield className="h-3 w-3" aria-hidden />
                    Profile admin
                  </Badge>
                ) : null}
              </div>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-100/90 px-2.5 py-1 font-mono text-xs text-gray-600 dark:bg-gray-800/80 dark:text-gray-400">
                <span className="font-sans text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500">Staff ID</span>
                {member.memberId}
              </p>
              {canManageAvatar ? (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={avatarBusy}
                    onClick={() => setAvatarDialogOpen(true)}
                  >
                    <Camera className="mr-1 h-3.5 w-3.5" />
                    Upload photo
                  </Button>
                  {member.avatarUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                      disabled={avatarBusy}
                      onClick={() => void handleAvatarRemove()}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Remove photo
                    </Button>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-4 flex flex-col gap-2 border-t border-gray-200/80 pt-4 text-left dark:border-gray-700/60 sm:mt-5">
                {member.profileAdmin && member.lastLoginAt ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last sign-in:{' '}
                    {new Date(member.lastLoginAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    {member.lastLoginIp ? ` · ${member.lastLoginIp}` : ''}
                  </p>
                ) : null}
                {member.twoFactorEnabled !== undefined ? (
                  <p className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <KeyRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>Two-factor authentication</span>
                    <Badge variant={member.twoFactorEnabled ? 'success' : 'default'} size="sm">
                      {member.twoFactorEnabled ? 'On' : 'Off'}
                    </Badge>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </Card>
        <AvatarUploadDialog
          isOpen={avatarDialogOpen}
          onClose={() => setAvatarDialogOpen(false)}
          name={member.name}
          currentAvatarUrl={member.avatarUrl}
          isLoading={avatarBusy}
          title={`Update ${member.name}'s photo`}
          description="Preview the image before uploading it to this staff profile."
          onConfirm={async (file) => {
            await handleAvatarSelect(file);
          }}
        />

        <Tabs
          variant="wrap"
          ariaLabel="Staff profile sections"
          tabs={tabDefs}
          value={tab}
          onChange={setTab}
          className={member.profileAdmin ? 'w-full' : 'w-full lg:grid-cols-4'}
        />

        {isLimitedProfile ? (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            Directory view: salary, ID documents, and other HR-only fields are hidden. HR or profile admins see the full record.
          </div>
        ) : null}

        {tab === 'overview' && (
          <div className="space-y-6 sm:space-y-8">
            <StaffProfileStats member={member} />
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Contact &amp; employment
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {infoItems.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-700/50 dark:bg-gray-900/30"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-gray-800">
                        <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
                        <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'documents' && (
          <DocumentManager staffId={member.id} staffName={member.name} isOwnProfile={isOwnProfile} />
        )}

        {tab === 'admin' && member.profileAdmin ? (
          <div className="space-y-6 sm:space-y-8">
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
            <CardContent className="p-4 sm:p-6">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center text-gray-400 dark:text-gray-500">
                  <Briefcase className="mb-3 h-10 w-10 opacity-70" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No tasks assigned</p>
                  <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-500">
                    Assigned work will appear here when linked to this profile.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700/80">
                  {tasks.map((t) => (
                    <li key={t.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.title}</p>
                      <span className="w-fit rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {t.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 'attendance' && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              {attRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center text-gray-400 dark:text-gray-500">
                  <Clock className="mb-3 h-10 w-10 opacity-70" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No attendance records</p>
                  <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-500">
                    Check-ins and attendance history will show here when recorded.
                  </p>
                </div>
              ) : (
                <ul>
                  {attRows.map((a) => (
                    <li key={a.id} className="flex flex-col gap-2 border-b border-gray-100 py-4 last:border-0 dark:border-gray-700/60 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                          <Calendar className="h-4 w-4 text-gray-400" aria-hidden />
                          {new Date(a.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="mt-1 pl-6 text-xs text-gray-500 dark:text-gray-400">
                          In {a.checkIn}
                          {a.checkOut ? ` · Out ${a.checkOut}` : ''}
                          {typeof a.hours === 'number' ? ` · ${a.hours}h` : ''}
                        </p>
                      </div>
                      <span className="w-fit rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {a.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit staff member"
        size="sm"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button isLoading={updateStaff.isPending} onClick={handleSave}>Save changes</Button>
          </>
        )}
      >
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={set('name')} required />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} />
          <Input label="Phone" value={form.phone} onChange={set('phone')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Branch" value={form.branch} onChange={set('branch')} />
            <Input label="Job title / department" value={form.jobRole} onChange={set('jobRole')} />
          </div>
          <Input
            label={member?.preferredCurrency === 'USD' ? 'Salary (US$)' : 'Salary (BDT, ৳)'}
            type="number"
            min="0"
            step="0.01"
            value={form.salary}
            onChange={set('salary')}
          />
        </div>
      </Modal>
    </PageTransition>
  );
}

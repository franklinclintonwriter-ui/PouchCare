import { useMemo, useState, useCallback } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  CircleDot,
  Laptop,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import {
  useCreateAttendance,
  useTeamAttendanceInfinite,
  useUpdateAttendance,
} from "@/api/attendance";
import { useStaffList } from "@/api/staff";
import { PageTransition } from "@/components/ui/PageTransition";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { StatsRow } from "@/components/shared/StatsRow";
import { Skeleton } from "@/components/ui/Skeleton";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { BranchTeamScopeNotice } from "@/components/team/BranchTeamScopeNotice";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/utils/cn";
import { toast } from "sonner";
import type { AttendanceRecord } from "@/types/models";

const statusConfig: Record<string, { icon: LucideIcon; color: string }> = {
  PRESENT: { icon: CheckCircle2, color: "text-emerald-500" },
  ABSENT: { icon: XCircle, color: "text-red-500" },
  LATE: { icon: Clock, color: "text-amber-500" },
  HALF_DAY: { icon: CircleDot, color: "text-orange-500" },
  REMOTE: { icon: Laptop, color: "text-blue-500" },
};

function formatDateDisplay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TeamAttendance() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    staffMemberId: "",
    status: "PRESENT" as AttendanceRecord["status"],
    workType: "OFFICE" as AttendanceRecord["workType"],
    hoursWorked: "8",
  });
  const perm = usePermission();
  const canEdit = perm.isCEO || perm.isManager;

  const {
    data: teamPages,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTeamAttendanceInfinite(selectedDate);
  const records = useMemo(
    () => teamPages?.pages.flatMap((p) => p.data) ?? [],
    [teamPages?.pages],
  );
  const { data: staffRows } = useStaffList(
    { limit: 200 },
    { enabled: canEdit && createOpen },
  );
  const updateAttendance = useUpdateAttendance();
  const createAttendance = useCreateAttendance();

  const goToDate = useCallback(
    (offset: number) => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + offset);
      setSelectedDate(d.toISOString().split("T")[0]);
    },
    [selectedDate],
  );

  const goToToday = useCallback(() => setSelectedDate(today), [today]);

  const totalForDay = teamPages?.pages[0]?.meta.total ?? records.length;

  const stats = useMemo(() => {
    const total = totalForDay;
    const present = records.filter((r) => r.status === "PRESENT").length;
    const late = records.filter((r) => r.status === "LATE").length;
    const absent = records.filter((r) => r.status === "ABSENT").length;
    const remote = records.filter((r) => r.workType === "REMOTE").length;
    const rate =
      total > 0 ? Math.round(((present + late + remote) / total) * 100) : 0;
    return [
      {
        title: "Team Size",
        value: total,
        icon: <Users />,
        iconBg:
          "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      },
      {
        title: "Present",
        value: present,
        icon: <CheckCircle2 />,
        iconBg:
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      },
      {
        title: "Late",
        value: late,
        icon: <Clock />,
        iconBg:
          "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      },
      {
        title: "Absent",
        value: absent,
        icon: <XCircle />,
        iconBg: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
      },
      {
        title: "Attendance Rate",
        value: `${rate}%`,
        icon: <CircleDot />,
        iconBg:
          "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      },
    ];
  }, [records, totalForDay]);

  const headerConfig = useMemo(
    () => ({
      title: "Team Attendance",
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Attendance" },
        { label: "Team" },
      ],
      actions: [
        {
          type: "button" as const,
          label: "",
          ariaLabel: "Previous day",
          icon: ChevronLeft,
          variant: "outline" as const,
          onClick: () => goToDate(-1),
        },
        {
          type: "button" as const,
          label: formatDateDisplay(selectedDate),
          icon: Calendar,
          variant: "outline" as const,
          onClick: () => {},
        },
        {
          type: "button" as const,
          label: "",
          ariaLabel: "Next day",
          icon: ChevronRight,
          variant: "outline" as const,
          onClick: () => goToDate(1),
          disabled: selectedDate === today,
        },
        ...(canEdit
          ? [
              {
                type: "button" as const,
                label: "Add Record",
                icon: Plus,
                onClick: () => setCreateOpen(true),
              },
            ]
          : []),
      ],
    }),
    [selectedDate, today, goToDate, canEdit],
  );

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
      toast.success("Attendance updated");
      setEditRecord(null);
    } catch {
      toast.error("Failed to update attendance");
    }
  };

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "staffName",
      label: "Staff",
      sticky: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.staffName} src={row.avatarUrl} size="xs" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {row.staffName}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "checkIn",
      label: "Check In",
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.checkIn || "-"}
        </span>
      ),
    },
    {
      key: "checkOut",
      label: "Check Out",
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.checkOut || "-"}
        </span>
      ),
    },
    {
      key: "workType",
      label: "Work Type",
      render: (row) => (
        <Badge
          variant={
            row.workType === "REMOTE"
              ? "info"
              : row.workType === "FIELD"
                ? "warning"
                : "default"
          }
          size="sm"
        >
          {row.workType.charAt(0) + row.workType.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      key: "hours",
      label: "Hours",
      align: "center",
      render: (row) => (
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {row.hours}h
        </span>
      ),
    },
    ...(canEdit
      ? [
          {
            key: "actions" as const,
            label: "",
            width: "60px",
            render: (row: AttendanceRecord) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditRecord(row)}
              >
                Edit
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {isError ? (
          <QueryErrorState
            title="Could not load team attendance"
            onRetry={() => void refetch()}
          />
        ) : (
          <>
            <BranchTeamScopeNotice />
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
                : records.map((record) => (
                    <Card key={record.id} padding="sm">
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <Avatar
                          name={record.staffName}
                          src={record.avatarUrl}
                          size="sm"
                        />
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 text-center truncate w-full">
                          {record.staffName.split(" ")[0]}
                        </p>
                        {(() => {
                          const cfg = statusConfig[record.status];
                          if (!cfg) return null;
                          const Icon = cfg.icon;
                          return <Icon className={cn("h-4 w-4", cfg.color)} />;
                        })()}
                      </div>
                    </Card>
                  ))}
            </div>

            {/* Detailed table */}
            <DataTable
              columns={columns}
              data={records}
              isLoading={isLoading}
              emptyTitle="No attendance data"
              emptyDescription={`No team attendance records for ${formatDateDisplay(selectedDate)}`}
            />

            {hasNextPage ? (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => void fetchNextPage()}
                  isLoading={isFetchingNextPage}
                  disabled={isFetchingNextPage}
                >
                  Load more attendance
                </Button>
              </div>
            ) : null}
          </>
        )}

        <Modal
          isOpen={!!editRecord}
          onClose={() => setEditRecord(null)}
          title="Edit Attendance"
          description={`Update attendance for ${editRecord?.staffName}`}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditRecord(null)}>
                Cancel
              </Button>
              <Button
                isLoading={updateAttendance.isPending}
                onClick={handleUpdateRecord}
              >
                Save
              </Button>
            </>
          }
        >
          {editRecord && (
            <div className="space-y-4">
              <Select
                label="Status"
                value={editRecord.status}
                onChange={(e) =>
                  setEditRecord((prev) =>
                    prev
                      ? {
                          ...prev,
                          status: e.target.value as AttendanceRecord["status"],
                        }
                      : null,
                  )
                }
                options={[
                  { label: "Present", value: "PRESENT" },
                  { label: "Absent", value: "ABSENT" },
                  { label: "Late", value: "LATE" },
                  { label: "Half Day", value: "HALF_DAY" },
                  { label: "On Leave", value: "ON_LEAVE" },
                ]}
              />
              <Select
                label="Work Type"
                value={editRecord.workType}
                onChange={(e) =>
                  setEditRecord((prev) =>
                    prev
                      ? {
                          ...prev,
                          workType: e.target
                            .value as AttendanceRecord["workType"],
                        }
                      : null,
                  )
                }
                options={[
                  { label: "Office", value: "OFFICE" },
                  { label: "Remote", value: "REMOTE" },
                  { label: "Field", value: "FIELD" },
                ]}
              />
              <Input
                label="Hours Worked"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={String(editRecord.hours)}
                onChange={(e) =>
                  setEditRecord((prev) =>
                    prev ? { ...prev, hours: Number(e.target.value) } : null,
                  )
                }
              />
            </div>
          )}
        </Modal>

        <Modal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Add Attendance Record"
          description={`Create attendance for ${formatDateDisplay(selectedDate)}`}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                isLoading={createAttendance.isPending}
                onClick={async () => {
                  if (!createForm.staffMemberId) {
                    toast.error("Staff member is required");
                    return;
                  }
                  try {
                    await createAttendance.mutateAsync({
                      staffMemberId: createForm.staffMemberId,
                      date: selectedDate,
                      status: createForm.status,
                      workType: createForm.workType,
                      hoursWorked: Number(createForm.hoursWorked) || 0,
                    });
                    toast.success("Attendance record created");
                    setCreateOpen(false);
                    setCreateForm({
                      staffMemberId: "",
                      status: "PRESENT",
                      workType: "OFFICE",
                      hoursWorked: "8",
                    });
                  } catch (err) {
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "Failed to create attendance",
                    );
                  }
                }}
              >
                Create
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Select
              label="Staff Member"
              value={createForm.staffMemberId}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  staffMemberId: e.target.value,
                }))
              }
              options={[
                { label: "Select staff", value: "" },
                ...(staffRows?.data ?? []).map((s) => ({
                  label: `${s.name} (${s.memberId})`,
                  value: s.id,
                })),
              ]}
            />
            <Select
              label="Status"
              value={createForm.status}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  status: e.target.value as AttendanceRecord["status"],
                }))
              }
              options={[
                { label: "Present", value: "PRESENT" },
                { label: "Absent", value: "ABSENT" },
                { label: "Late", value: "LATE" },
                { label: "Half Day", value: "HALF_DAY" },
                { label: "Remote", value: "REMOTE" },
              ]}
            />
            <Select
              label="Work Type"
              value={createForm.workType}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  workType: e.target.value as AttendanceRecord["workType"],
                }))
              }
              options={[
                { label: "Office", value: "OFFICE" },
                { label: "Remote", value: "REMOTE" },
                { label: "Field", value: "FIELD" },
                { label: "Leave", value: "LEAVE" },
                { label: "Holiday", value: "HOLIDAY" },
              ]}
            />
            <Input
              label="Hours Worked"
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={createForm.hoursWorked}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  hoursWorked: e.target.value,
                }))
              }
            />
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}

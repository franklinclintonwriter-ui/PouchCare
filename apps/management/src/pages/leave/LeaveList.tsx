import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  UserPlus,
} from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import {
  useLeaveRequests,
  useApproveLeave,
  useRejectLeave,
  useCancelLeave,
  useCreateLeaveForStaff,
} from "@/api/leave";
import { useStaffList } from "@/api/staff";
import { PageTransition } from "@/components/ui/PageTransition";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { StatsRow } from "@/components/shared/StatsRow";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useAuthStore } from "@/store/authStore";
import { usePermission } from "@/hooks/usePermission";
import { BranchTeamScopeNotice } from "@/components/team/BranchTeamScopeNotice";
import type { LeaveRequest } from "@/types/models";
import { toast } from "sonner";

const leaveTypeBadge: Record<
  string,
  "primary" | "success" | "warning" | "danger" | "info" | "default"
> = {
  ANNUAL: "primary",
  SICK: "danger",
  EMERGENCY: "warning",
  MATERNITY: "info",
  PATERNITY: "info",
  UNPAID: "default",
};

export default function LeaveList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const perm = usePermission();
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    staffMemberId: "",
    leaveType: "ANNUAL",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const statusParam = tab === "all" ? undefined : tab.toUpperCase();

  const { data, isLoading } = useLeaveRequests({
    status: statusParam,
    page,
    limit: 20,
  });

  const allData = useLeaveRequests({});
  const { data: staffRows } = useStaffList({ limit: 300 });
  const allLeaves = allData.data?.data ?? [];

  const leaves = data?.data ?? [];
  const meta = data?.meta;

  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();
  const cancelLeave = useCancelLeave();
  const createLeaveForStaff = useCreateLeaveForStaff();
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);

  const stats = useMemo(() => {
    const total = allData.data?.meta?.total ?? 0;
    const pending = allLeaves.filter((l) => l.status === "PENDING").length;
    const approved = allLeaves.filter((l) => l.status === "APPROVED").length;
    const rejected = allLeaves.filter((l) => l.status === "REJECTED").length;
    return [
      {
        title: "Total Requests",
        value: total,
        icon: <Calendar />,
        iconBg:
          "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      },
      {
        title: "Pending",
        value: pending,
        icon: <Clock />,
        iconBg:
          "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      },
      {
        title: "Approved",
        value: approved,
        icon: <CheckCircle2 />,
        iconBg:
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      },
      {
        title: "Rejected",
        value: rejected,
        icon: <XCircle />,
        iconBg: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
      },
    ];
  }, [allLeaves, allData.data?.meta]);

  const tabItems = useMemo(
    () => [
      { label: "All", value: "all", count: allData.data?.meta?.total },
      {
        label: "Pending",
        value: "pending",
        count: allLeaves.filter((l) => l.status === "PENDING").length,
      },
      {
        label: "Approved",
        value: "approved",
        count: allLeaves.filter((l) => l.status === "APPROVED").length,
      },
      {
        label: "Rejected",
        value: "rejected",
        count: allLeaves.filter((l) => l.status === "REJECTED").length,
      },
      {
        label: "Cancelled",
        value: "cancelled",
        count: allLeaves.filter((l) => l.status === "CANCELLED").length,
      },
    ],
    [allLeaves, allData.data?.meta],
  );

  const headerConfig = useMemo(
    () => ({
      title: "Leave Requests",
      breadcrumbs: [{ label: "Home", href: "/" }, { label: "Leave" }],
      actions: [
        {
          type: "button" as const,
          label: "Request Leave",
          icon: Plus,
          onClick: () => navigate("/leave/request"),
        },
        ...(perm.isManager
          ? [
              {
                type: "button" as const,
                label: "Add For Staff",
                icon: UserPlus,
                onClick: () => setCreateOpen(true),
              },
            ]
          : []),
      ],
    }),
    [navigate, perm.isManager],
  );

  useHeaderConfig(headerConfig);

  const handleTabChange = (val: string) => {
    setTab(val);
    setPage(1);
  };

  const handleApprove = async (row: LeaveRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await approveLeave.mutateAsync(row.id);
      toast.success("Leave approved");
    } catch {
      toast.error("Failed to approve leave");
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await rejectLeave.mutateAsync({ id: rejectTarget.id });
      toast.success("Leave rejected");
      setRejectTarget(null);
    } catch {
      toast.error("Failed to reject leave");
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelLeave.mutateAsync(cancelTarget.id);
      toast.success("Leave cancelled");
      setCancelTarget(null);
    } catch {
      toast.error("Failed to cancel leave");
    }
  };

  const columns: Column<LeaveRequest>[] = [
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
      key: "type",
      label: "Type",
      render: (row) => (
        <Badge variant={leaveTypeBadge[row.type] ?? "default"} size="sm">
          {row.type.charAt(0) + row.type.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      key: "startDate",
      label: "Start",
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(row.startDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "endDate",
      label: "End",
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(row.endDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "days",
      label: "Days",
      align: "center",
      render: (row) => (
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {row.days}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "createdAt",
      label: "Created",
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(row.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        if (row.status !== "PENDING") return null;
        const isOwn = row.staffId === user?.id;
        return (
          <div className="flex gap-1">
            {perm.isManager && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={approveLeave.isPending}
                  onClick={(e) => handleApprove(row, e)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRejectTarget(row);
                  }}
                >
                  Reject
                </Button>
              </>
            )}
            {isOwn && (
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-500 hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setCancelTarget(row);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <BranchTeamScopeNotice />
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

      <ConfirmDialog
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Leave Request"
        message={`Reject ${rejectTarget?.staffName}'s ${rejectTarget?.type?.toLowerCase()} leave request?`}
        confirmLabel="Reject"
        variant="danger"
        isLoading={rejectLeave.isPending}
        onConfirm={handleReject}
      />

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Leave Request"
        message="Are you sure you want to cancel this leave request?"
        confirmLabel="Cancel Request"
        variant="danger"
        isLoading={cancelLeave.isPending}
        onConfirm={handleCancel}
      />

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Leave For Staff"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              isLoading={createLeaveForStaff.isPending}
              onClick={async () => {
                if (
                  !createForm.staffMemberId ||
                  !createForm.startDate ||
                  !createForm.endDate
                ) {
                  toast.error(
                    "Staff member, start date and end date are required",
                  );
                  return;
                }
                try {
                  await createLeaveForStaff.mutateAsync({
                    staffMemberId: createForm.staffMemberId,
                    leaveType: createForm.leaveType,
                    startDate: createForm.startDate,
                    endDate: createForm.endDate,
                    reason: createForm.reason || undefined,
                  });
                  toast.success("Leave request created");
                  setCreateOpen(false);
                  setCreateForm({
                    staffMemberId: "",
                    leaveType: "ANNUAL",
                    startDate: "",
                    endDate: "",
                    reason: "",
                  });
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Failed to create leave request",
                  );
                }
              }}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-3">
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
            label="Leave Type"
            value={createForm.leaveType}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, leaveType: e.target.value }))
            }
            options={[
              { value: "ANNUAL", label: "Annual" },
              { value: "SICK", label: "Sick" },
              { value: "EMERGENCY", label: "Emergency" },
              { value: "MATERNITY", label: "Maternity" },
              { value: "PATERNITY", label: "Paternity" },
              { value: "UNPAID", label: "Unpaid" },
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              value={createForm.startDate}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
            />
            <Input
              label="End Date"
              type="date"
              value={createForm.endDate}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, endDate: e.target.value }))
              }
            />
          </div>
          <Textarea
            label="Reason"
            rows={3}
            value={createForm.reason}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, reason: e.target.value }))
            }
          />
        </div>
      </Modal>
    </PageTransition>
  );
}

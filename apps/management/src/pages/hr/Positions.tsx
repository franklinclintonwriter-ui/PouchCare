import { useMemo, useState, useCallback } from "react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Briefcase,
  CheckCircle2,
  PauseCircle,
} from "lucide-react";
import { Textarea } from "@/components/ui/Textarea";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import {
  usePositions,
  useCreatePosition,
  useUpdatePosition,
  useDeletePosition,
} from "@/api/hr";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatsRow } from "@/components/shared/StatsRow";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageTransition } from "@/components/ui/PageTransition";
import { usePermission } from "@/hooks/usePermission";
import type { Position } from "@/types/models";
import { toast } from "sonner";

const typeLabels: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
};

const typeVariants: Record<string, "primary" | "success" | "warning" | "info"> =
  {
    full_time: "primary",
    part_time: "info",
    contract: "warning",
    internship: "success",
  };

const TYPE_OPTIONS = [
  { label: "Full Time", value: "full_time" },
  { label: "Part Time", value: "part_time" },
  { label: "Contract", value: "contract" },
  { label: "Internship", value: "internship" },
];

const STATUS_OPTIONS = [
  { label: "Open", value: "open" },
  { label: "Paused", value: "paused" },
  { label: "Closed", value: "closed" },
];

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
};

const EMPTY_FORM = {
  title: "",
  department: "",
  branch: "",
  employmentType: "full_time",
  salaryMin: "",
  salaryMax: "",
  status: "open",
  postedDate: new Date().toISOString().split("T")[0],
  deadline: "",
  jobDescription: "",
};

export default function Positions() {
  const { data, isLoading } = usePositions();
  const positions = data ?? [];
  const perm = usePermission();
  const createPosition = useCreatePosition();
  const updatePosition = useUpdatePosition();
  const deletePosition = useDeletePosition();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null);

  const stats = useMemo(() => {
    const open = positions.filter((p) => p.status === "open").length;
    const closed = positions.filter((p) => p.status === "closed").length;
    const paused = positions.filter((p) => p.status === "paused").length;
    const totalApps = positions.reduce(
      (s, p) => s + (p.applicationsCount ?? 0),
      0,
    );
    return [
      {
        title: "Open Positions",
        value: open,
        icon: <Briefcase />,
        iconBg:
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      },
      {
        title: "Total Applications",
        value: totalApps,
        icon: <Users />,
        iconBg:
          "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      },
      {
        title: "Paused",
        value: paused,
        icon: <PauseCircle />,
        iconBg:
          "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      },
      {
        title: "Closed",
        value: closed,
        icon: <CheckCircle2 />,
        iconBg:
          "bg-gray-50 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400",
      },
    ];
  }, [positions]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  }, []);

  const openEdit = useCallback((pos: Position) => {
    setEditing(pos);
    setForm({
      title: pos.title,
      department: pos.department,
      branch: pos.location,
      employmentType: pos.type,
      salaryMin: String(pos.salaryRange.min),
      salaryMax: String(pos.salaryRange.max),
      status: pos.status,
      postedDate: pos.postedDate
        ? pos.postedDate.split("T")[0]
        : EMPTY_FORM.postedDate,
      deadline: pos.deadline ? pos.deadline.split("T")[0] : "",
      jobDescription: pos.description ?? "",
    });
    setShowModal(true);
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Position title is required");
      return;
    }
    const salaryMin = Number(form.salaryMin) || 0;
    const salaryMax = Number(form.salaryMax) || 0;
    if (salaryMin > 0 && salaryMax > 0 && salaryMin > salaryMax) {
      toast.error("Minimum salary cannot exceed maximum salary");
      return;
    }
    const payload = {
      title: form.title,
      department: form.department,
      branch: form.branch,
      employmentType: EMPLOYMENT_TYPE_MAP[form.employmentType] ?? form.employmentType,
      salaryMin,
      salaryMax,
      status: form.status.charAt(0).toUpperCase() + form.status.slice(1),
      postedDate: form.postedDate
        ? new Date(form.postedDate).toISOString()
        : undefined,
      deadline: form.deadline
        ? new Date(form.deadline).toISOString()
        : undefined,
      jobDescription: form.jobDescription || undefined,
    };
    try {
      if (editing) {
        await updatePosition.mutateAsync({ id: editing.id, ...payload });
        toast.success("Position updated");
      } else {
        await createPosition.mutateAsync(payload);
        toast.success("Position created");
      }
      setShowModal(false);
    } catch {
      toast.error(`Failed to ${editing ? "update" : "create"} position`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePosition.mutateAsync(deleteTarget.id);
      toast.success("Position deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete position");
    }
  };

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const headerConfig = useMemo(
    () => ({
      title: "Open Positions",
      breadcrumbs: [
        { label: "HR", href: "/hr" },
        { label: "Positions", icon: Users },
      ],
      actions: perm.can("hr.recruitment")
        ? [
            {
              type: "button" as const,
              label: "Add Position",
              icon: Plus,
              onClick: openCreate,
            },
          ]
        : [],
    }),
    [perm, openCreate],
  );
  useHeaderConfig(headerConfig);

  const columns: Column<Position>[] = [
    {
      key: "title",
      label: "Title",
      sticky: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {row.title}
        </span>
      ),
    },
    { key: "department", label: "Department" },
    { key: "location", label: "Location" },
    {
      key: "type",
      label: "Type",
      render: (row) => (
        <Badge variant={typeVariants[row.type] ?? "default"}>
          {typeLabels[row.type] ?? row.type}
        </Badge>
      ),
    },
    {
      key: "applicationsCount",
      label: "Applications",
      align: "center",
      render: (row) => (
        <span className="font-medium">{row.applicationsCount}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "published",
      label: "Published",
      render: (row) => (
        <Badge variant={row.published ? "success" : "warning"}>
          {row.published ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      key: "postedDate",
      label: "Posted",
      render: (row) => (
        <span className="text-gray-500 dark:text-gray-400">
          {new Date(row.postedDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    ...(perm.can("hr.recruitment")
      ? [
          {
            key: "actions" as keyof Position,
            label: "Actions",
            render: (row: Position) => (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(row);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(row);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const isPending = createPosition.isPending || updatePosition.isPending;

  return (
    <PageTransition className="space-y-6">
      <StatsRow items={stats} loading={isLoading} />

      <DataTable
        columns={columns}
        data={positions}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyTitle="No positions found"
        emptyDescription="Create a position to start hiring."
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Position" : "New Position"}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button isLoading={isPending} onClick={handleSubmit}>
              {editing ? "Save Changes" : "Create Position"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Position Title *"
            placeholder="e.g. Frontend Developer"
            value={form.title}
            onChange={set("title")}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Department"
              placeholder="e.g. Engineering"
              value={form.department}
              onChange={set("department")}
            />
            <Input
              label="Location / Branch"
              placeholder="e.g. Dhaka"
              value={form.branch}
              onChange={set("branch")}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Employment Type"
              options={TYPE_OPTIONS}
              value={form.employmentType}
              onChange={set("employmentType")}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={set("status")}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Min Salary (USD)"
              type="number"
              min="0"
              value={form.salaryMin}
              onChange={set("salaryMin")}
            />
            <Input
              label="Max Salary (USD)"
              type="number"
              min="0"
              value={form.salaryMax}
              onChange={set("salaryMax")}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Posted Date"
              type="date"
              value={form.postedDate}
              onChange={set("postedDate")}
            />
            <Input
              label="Application Deadline"
              type="date"
              value={form.deadline}
              onChange={set("deadline")}
            />
          </div>
          <Textarea
            label="Job Description"
            rows={4}
            placeholder="Describe responsibilities, requirements, and benefits..."
            value={form.jobDescription}
            onChange={set("jobDescription") as React.ChangeEventHandler<HTMLTextAreaElement>}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Position"
        message={`Delete position "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deletePosition.isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}

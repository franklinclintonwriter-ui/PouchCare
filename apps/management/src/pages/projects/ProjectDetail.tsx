import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  Clock,
  Pencil,
  Trash2,
} from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import { useTasks } from "@/api/tasks";
import { useProject, useUpdateProject, useDeleteProject } from "@/api/projects";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tabs } from "@/components/ui/Tabs";
import { StatsRow } from "@/components/shared/StatsRow";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCurrency } from "@/hooks/useCurrency";
import { usePermission } from "@/hooks/usePermission";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "On Hold", value: "ON_HOLD" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const perm = usePermission();
  const { data: project, isLoading } = useProject(id!);
  const { data: relatedTasks } = useTasks({ q: project?.name, limit: 10 });
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [tab, setTab] = useState("overview");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({
    name: "",
    clientName: "",
    notes: "",
    status: "PENDING",
    progress: "0",
    price: "0",
  });

  const openEdit = () => {
    if (project) {
      setForm({
        name: project.name,
        clientName: project.clientName,
        notes: project.description,
        status: project.status,
        progress: String(project.progress),
        price: String(project.budget),
      });
      setShowEdit(true);
    }
  };

  const handleUpdate = async () => {
    if (!id || !form.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    try {
      await updateProject.mutateAsync({
        id,
        name: form.name.trim(),
        clientName: form.clientName.trim(),
        notes: form.notes.trim(),
        status: form.status,
        progress: Number(form.progress) || 0,
        price: Number(form.price) || 0,
      });
      toast.success("Project updated");
      setShowEdit(false);
    } catch {
      toast.error("Failed to update project");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteProject.mutateAsync(id);
      toast.success("Project cancelled");
      navigate("/projects");
    } catch {
      toast.error("Failed to cancel project");
    }
  };

  const headerConfig = useMemo(
    () => ({
      title: project?.name ?? "Project",
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects" },
        { label: project?.name ?? "..." },
      ],
      actions: perm.isManager
        ? [
            {
              type: "button" as const,
              label: "Edit",
              icon: Pencil,
              variant: "outline" as const,
              onClick: openEdit,
            },
          ]
        : [],
    }),
    [project?.name, perm.isManager],
  );

  useHeaderConfig(headerConfig);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Card>
            <div className="space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (!project) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-20 text-gray-500 dark:text-gray-400">
          Project not found
        </div>
      </PageTransition>
    );
  }

  const overviewStats = [
    {
      title: "Budget",
      value: formatCurrency(project.budget),
      icon: <DollarSign />,
      iconBg:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      title: "Spent",
      value: formatCurrency(project.spent),
      icon: <BarChart3 />,
      iconBg:
        "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      title: "Team Size",
      value: project.teamMembers.length,
      icon: <Users />,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      title: "Progress",
      value: `${project.progress}%`,
      icon: <BarChart3 />,
      iconBg:
        "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header card */}
        <Card>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <StatusBadge status={project.status} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {project.clientName}
            </span>
          </div>

          <ProgressBar
            value={project.progress}
            showLabel
            size="lg"
            className="mb-4"
          />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Start
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(project.startDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Due</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(project.dueDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Budget
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  ${project.budget.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Team</p>
                <div className="flex -space-x-1.5 mt-0.5">
                  {project.teamMembers.slice(0, 4).map((m) => (
                    <Avatar
                      key={m.id}
                      name={m.name}
                      src={m.avatarUrl}
                      size="xs"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs
          tabs={[
            { label: "Overview", value: "overview" },
            { label: "Tasks", value: "tasks" },
            { label: "Team", value: "team" },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === "overview" && (
          <div className="space-y-6">
            <StatsRow items={overviewStats} />
            <Card>
              <CardContent className="mt-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                  Description
                </p>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {project.description || "No description provided."}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "tasks" && (
          <Card>
            <CardContent className="mt-0">
              {(relatedTasks?.data ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                  <Clock className="h-8 w-8 mb-2" />
                  <p className="text-sm">No related tasks found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(relatedTasks?.data ?? []).map((t: any) => (
                    <div
                      key={t.id}
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-gray-500">{t.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "team" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {project.teamMembers.map((member) => (
              <Card key={member.id} padding="sm">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} src={member.avatarUrl} size="md" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {member.name}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Button */}
        {perm.isManager && (
          <div className="pt-6 border-t dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Cancel Project
            </Button>
          </div>
        )}

        {/* Edit Modal */}
        <Modal
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          title="Edit Project"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowEdit(false)}>
                Cancel
              </Button>
              <Button
                isLoading={updateProject.isPending}
                onClick={handleUpdate}
              >
                Save Changes
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Project Name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Client Name"
              value={form.clientName}
              onChange={(e) =>
                setForm((f) => ({ ...f, clientName: e.target.value }))
              }
            />
            <Textarea
              label="Description"
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
              />
              <Input
                label="Progress (%)"
                type="number"
                min="0"
                max="100"
                value={form.progress}
                onChange={(e) =>
                  setForm((f) => ({ ...f, progress: e.target.value }))
                }
              />
            </div>
            <Input
              label="Budget (USD)"
              type="number"
              min="0"
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
            />
          </div>
        </Modal>

        {/* Delete Confirm */}
        <ConfirmDialog
          isOpen={showDelete}
          onClose={() => setShowDelete(false)}
          title="Cancel Project"
          message={`Cancel "${project.name}"? The project will be marked as Cancelled.`}
          confirmLabel="Cancel Project"
          variant="danger"
          isLoading={deleteProject.isPending}
          onConfirm={handleDelete}
        />
      </div>
    </PageTransition>
  );
}

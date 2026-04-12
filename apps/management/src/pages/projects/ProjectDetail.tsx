import { useState, useMemo, useCallback, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  CalendarClock,
  DollarSign,
  Users,
  BarChart3,
  Clock,
  Pencil,
  Trash2,
  LayoutGrid,
  ListTodo,
  FileDown,
  Printer,
} from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import { useTasks } from "@/api/tasks";
import type { Task } from "@/types/models";
import { useProject, useUpdateProject, useDeleteProject } from "@/api/projects";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tabs } from "@/components/ui/Tabs";
import { StatsRow } from "@/components/shared/StatsRow";
import { Skeleton } from "@/components/ui/Skeleton";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCurrency } from "@/hooks/useCurrency";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/utils/cn";
import { toast } from "sonner";
import { downloadProjectPdf } from "@/utils/projectPdf";
import { PrintBrandHeader } from "@/components/print/PrintBrandHeader";

const STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "On Hold", value: "ON_HOLD" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Avoid showing raw UUIDs when API stores assignee as an id string. */
function displayPersonName(name: string | undefined | null): string {
  const n = name?.trim() ?? "";
  if (!n) return "Team member";
  if (UUID_RE.test(n)) return "Assigned member";
  return n;
}

function daysUntil(iso: string): number {
  const end = new Date(iso).setHours(0, 0, 0, 0);
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((end - now) / (24 * 60 * 60 * 1000));
}

export default function ProjectDetail() {
  const { id: routeId } = useParams<{ id?: string }>();
  const projectId = routeId?.trim() ?? "";
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const perm = usePermission();
  const { data: project, isLoading } = useProject(projectId);
  const {
    data: relatedTasks,
    isLoading: tasksLoading,
    isError: tasksError,
    refetch: refetchTasks,
  } = useTasks({ projectId, limit: 30 }, { enabled: !!projectId });
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [tab, setTab] = useState<"overview" | "tasks">("overview");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({
    name: "",
    clientName: "",
    notes: "",
    status: "PENDING",
    progress: 0,
    price: 0,
  });

  const openEdit = useCallback(() => {
    if (project) {
      setForm({
        name: project.name,
        clientName: project.clientName,
        notes: project.description,
        status: project.status,
        progress: project.progress,
        price: project.budget,
      });
      setShowEdit(true);
    }
  }, [project]);

  const handleUpdate = async () => {
    if (!projectId || !form.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    try {
      await updateProject.mutateAsync({
        id: projectId,
        name: form.name.trim(),
        clientName: form.clientName.trim(),
        notes: form.notes.trim(),
        status: form.status,
        progress: Math.min(100, Math.max(0, Math.round(Number(form.progress)) || 0)),
        price: Math.max(0, Number(form.price) || 0),
      });
      toast.success("Project updated");
      setShowEdit(false);
    } catch {
      toast.error("Failed to update project");
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;
    try {
      await deleteProject.mutateAsync(projectId);
      toast.success("Project cancelled");
      navigate("/projects");
    } catch {
      toast.error("Failed to cancel project");
    }
  };

  const handleExportPdf = useCallback(() => {
    if (!project) return;
    try {
      downloadProjectPdf({
        project,
        tasks: relatedTasks?.data ?? [],
        formatCurrency,
      });
      toast.success("PDF downloaded");
    } catch {
      toast.error("Could not generate PDF");
    }
  }, [project, relatedTasks?.data, formatCurrency]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const headerConfig = useMemo(
    () => ({
      title: project?.name ?? "Project",
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects" },
        { label: project?.name ?? "..." },
      ],
      actions: [
        {
          type: "button" as const,
          label: "Export PDF",
          icon: FileDown,
          variant: "outline" as const,
          onClick: handleExportPdf,
        },
        {
          type: "button" as const,
          label: "Print",
          icon: Printer,
          variant: "outline" as const,
          onClick: handlePrint,
        },
        ...(perm.isManager
          ? [
              {
                type: "button" as const,
                label: "Edit",
                icon: Pencil,
                variant: "outline" as const,
                onClick: openEdit,
              },
            ]
          : []),
      ],
    }),
    [project?.name, perm.isManager, openEdit, handleExportPdf, handlePrint],
  );

  useHeaderConfig(headerConfig);

  if (!projectId) {
    return (
      <PageTransition>
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-16 text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Invalid project link</p>
          <p className="mt-1 max-w-sm text-xs">The URL is missing a project id. Open a project from the list.</p>
        </div>
      </PageTransition>
    );
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-5xl space-y-6">
          <Card padding="none" className="overflow-hidden">
            <div className="space-y-3 p-4 sm:p-6">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 p-4 dark:border-gray-700 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
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
      icon: <DollarSign className="h-4 w-4" />,
      iconBg:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      title: "Spent",
      value: formatCurrency(project.spent),
      icon: <BarChart3 className="h-4 w-4" />,
      iconBg:
        "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      title: "Team size",
      value: project.teamMembers.length,
      icon: <Users className="h-4 w-4" />,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      title: "Progress",
      value: `${project.progress}%`,
      icon: <BarChart3 className="h-4 w-4" />,
      iconBg:
        "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    },
  ];

  const startLabel = new Date(project.startDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const dueLabel = new Date(project.dueDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const dueIn = daysUntil(project.dueDate);
  const teamPreview = project.teamMembers.slice(0, 4);
  const teamExtra = Math.max(0, project.teamMembers.length - 4);
  const taskCount = tasksError ? undefined : (relatedTasks?.data?.length ?? 0);

  const metaCell = (
    label: string,
    value: ReactNode,
    icon: ReactNode,
    accent: string,
  ) => (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-gray-200/90 bg-white/90 p-3 shadow-sm",
        "dark:border-gray-700/70 dark:bg-gray-800/90",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          accent,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-semibold leading-snug text-gray-900 dark:text-gray-50">
          {value}
        </div>
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
        <PrintBrandHeader
          documentLabel="Project report"
          title={project.name}
          subtitle={
            project.clientName && project.clientName !== "N/A"
              ? `Client: ${project.clientName}`
              : undefined
          }
          meta={[
            { label: "Status", value: project.status },
            { label: "Progress", value: `${project.progress}%` },
            { label: "Budget", value: formatCurrency(project.budget) },
            {
              label: "Timeline",
              value: `${startLabel} → ${dueLabel}`,
            },
          ]}
        />

        {/* Summary — responsive grid, no horizontal scroll */}
        <Card
          padding="none"
          className="overflow-hidden border-gray-200/90 bg-gradient-to-br from-white via-gray-50/50 to-primary-50/20 shadow-sm ring-1 ring-gray-200/50 dark:border-gray-700/50 dark:from-gray-900 dark:via-gray-900/95 dark:to-primary-950/20 dark:ring-gray-700/40"
        >
          <div className="border-b border-gray-100/80 px-4 py-5 dark:border-gray-700/60 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={project.status} size="sm" />
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl">
                  {project.name}
                </h1>
                {project.clientName && project.clientName !== "N/A" ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Client:{" "}
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {project.clientName}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No client assigned
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3 rounded-xl border border-gray-200/80 bg-white/90 px-4 py-3 dark:border-gray-700/60 dark:bg-gray-800/80">
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Progress
                  </p>
                  <p className="text-2xl font-semibold tabular-nums leading-none text-primary-600 dark:text-primary-400">
                    {project.progress}
                    <span className="text-base font-semibold text-gray-400 dark:text-gray-500">
                      %
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <ProgressBar
                value={project.progress}
                showLabel={false}
                size="md"
                className="[&>div:first-child]:h-2 sm:[&>div:first-child]:h-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6 lg:grid-cols-4">
            {metaCell(
              "Start",
              startLabel,
              <Calendar className="h-4 w-4" aria-hidden />,
              "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
            )}
            {metaCell(
              "Due",
              <>
                {dueLabel}
                <span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">
                  {dueIn < 0
                    ? `${Math.abs(dueIn)}d overdue`
                    : dueIn === 0
                      ? "Due today"
                      : `${dueIn}d remaining`}
                </span>
              </>,
              <CalendarClock className="h-4 w-4" aria-hidden />,
              "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
            )}
            {metaCell(
              "Budget",
              formatCurrency(project.budget),
              <DollarSign className="h-4 w-4" aria-hidden />,
              "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
            )}
            <div
              className={cn(
                "flex gap-3 rounded-xl border border-gray-200/90 bg-white/90 p-3 shadow-sm sm:col-span-2 lg:col-span-1",
                "dark:border-gray-700/70 dark:bg-gray-800/90",
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Users className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Team
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">
                  {project.teamMembers.length}{" "}
                  {project.teamMembers.length === 1 ? "person" : "people"}
                </p>
                {project.teamMembers.length > 0 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="flex -space-x-2">
                      {teamPreview.map((m) => (
                        <Avatar
                          key={m.id}
                          name={displayPersonName(m.name)}
                          src={m.avatarUrl}
                          size="sm"
                          className="ring-2 ring-white dark:ring-gray-800"
                        />
                      ))}
                    </div>
                    {teamExtra > 0 ? (
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        +{teamExtra} more
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    No assignees yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs — full-width two-up on mobile, no pill scroll */}
        <Tabs
          ariaLabel="Project sections"
          className={cn(
            "no-print grid w-full grid-cols-2 gap-1 rounded-xl border border-gray-200/90 bg-gray-100/70 p-1",
            "dark:border-gray-700/80 dark:bg-gray-900/60",
            "[&>button]:min-h-10 [&>button]:justify-center sm:[&>button]:min-h-11",
            "!overflow-visible",
          )}
          tabs={[
            {
              label: "Overview",
              value: "overview",
              icon: <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
            },
            {
              label: "Tasks",
              value: "tasks",
              icon: <ListTodo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
              count: taskCount,
            },
          ]}
          value={tab}
          onChange={(v) => {
            if (v === "overview" || v === "tasks") setTab(v);
          }}
        />

        <div
          className={cn(
            "space-y-6 sm:space-y-8",
            tab === "overview" ? "block" : "hidden",
            "print:!block",
          )}
        >
            <StatsRow
              items={overviewStats}
              columns="grid-cols-2 lg:grid-cols-4"
            />

            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Description
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {project.description?.trim()
                    ? project.description
                    : "No description provided."}
                </p>
              </CardContent>
            </Card>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Team
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {project.teamMembers.map((member) => {
                  const label = displayPersonName(member.name);
                  return (
                    <Card
                      key={member.id}
                      padding="none"
                      className="overflow-hidden border-gray-200/90 dark:border-gray-700/70"
                    >
                      <div className="flex items-center gap-3 p-4">
                        <Avatar
                          name={label}
                          src={member.avatarUrl}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                            {label}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Project member
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              {project.teamMembers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No team members assigned.
                </p>
              ) : null}
            </section>
        </div>

        <div className={cn(tab === "tasks" ? "block" : "hidden", "print:!block")}>
          <Card className="print:break-inside-avoid">
            <CardContent className="p-4 sm:p-6">
              {tasksError ? (
                <QueryErrorState
                  title="Failed to load tasks"
                  onRetry={() => void refetchTasks()}
                />
              ) : tasksLoading ? (
                <div className="space-y-3 py-4">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ) : (relatedTasks?.data ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center text-gray-400 dark:text-gray-500">
                  <Clock className="mb-3 h-10 w-10 opacity-60" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    No related tasks
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-gray-500 dark:text-gray-500">
                    Tasks linked to this project (by project id) appear here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700/80">
                  {(relatedTasks?.data ?? []).map((t: Task) => (
                    <li
                      key={t.id}
                      className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {t.title}
                      </p>
                      <span className="shrink-0 self-start rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-400 sm:self-center">
                        {t.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {perm.isManager ? (
          <div className="no-print rounded-xl border border-gray-200/90 bg-gray-50/50 p-4 dark:border-gray-700/60 dark:bg-gray-900/40 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Cancel project
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Marks the project as cancelled. This cannot be undone from the
                  app.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => setShowDelete(true)}
              >
                Cancel project
              </Button>
            </div>
          </div>
        ) : null}

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
                Save changes
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Project name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Client name"
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    progress: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                  }))
                }
              />
            </div>
            <Input
              label="Budget (USD)"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: Math.max(0, Number(e.target.value) || 0) }))
              }
            />
          </div>
        </Modal>

        <ConfirmDialog
          isOpen={showDelete}
          onClose={() => setShowDelete(false)}
          title="Cancel project"
          message={`Cancel “${project.name}”? The project will be marked as cancelled.`}
          confirmLabel="Cancel project"
          variant="danger"
          isLoading={deleteProject.isPending}
          onConfirm={handleDelete}
        />
      </div>
    </PageTransition>
  );
}

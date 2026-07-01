import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  FolderOpen,
  User,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Star,
  Trash2,
  Pencil,
  Paperclip,
  TrendingUp,
  FileDown,
  Printer,
  Bot,
  Target,
  AlertTriangle,
  ListChecks,
  Zap,
  Heart,
} from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import {
  useAddTaskComment,
  useEscalateTask,
  useTask,
  useUpdateTask,
  useSubmitTask,
  useApproveTask,
  useRejectTask,
  useVerifyTask,
  useRateTask,
  useDeleteTask,
  useUploadTaskAttachments,
} from "@/api/tasks";
import { useStaffList } from "@/api/staff";
import { useAuthStore } from "@/store/authStore";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePermission } from "@/hooks/usePermission";
import { toast } from "sonner";
import type { Task } from "@/types/models";
import type { HeaderAction } from "@/types/header";
import { downloadTaskPdf } from "@/utils/taskPdf";
import { PrintBrandHeader } from "@/components/print/PrintBrandHeader";
import { TaskSignatureBlock } from "@/components/tasks/TaskSignatureBlock";
import { cn } from "@/utils/cn";

type TaskComment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
};

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(id!);
  const perm = usePermission();
  const canManageTask = perm.can("task.assign");
  const canApproveTask = perm.can("task.approve");
  const canVerifyTask = perm.can("task.verify");
  const canDeleteTask = perm.can("task.delete");
  const updateTask = useUpdateTask();
  const addComment = useAddTaskComment();
  const submitTask = useSubmitTask();
  const approveTask = useApproveTask();
  const rejectTask = useRejectTask();
  const escalateTask = useEscalateTask();
  const verifyTask = useVerifyTask();
  const rateTask = useRateTask();
  const deleteTask = useDeleteTask();
  const uploadAttachments = useUploadTaskAttachments();
  const authUser = useAuthStore((s) => s.user);
  const staffId = authUser && "id" in authUser ? authUser.id : "";
  const { data: staffPage } = useStaffList(
    { limit: 400 },
    { enabled: canManageTask },
  );
  const [assignSpecialistId, setAssignSpecialistId] = useState("");
  const [progressInput, setProgressInput] = useState(0);

  const [tab, setTab] = useState("details");
  const [comment, setComment] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [actionType, setActionType] = useState<
    "submit" | "approve" | "reject" | "escalate" | null
  >(null);
  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState(3);
  const [rateNote, setRateNote] = useState("");
  const [verifyConfirm, setVerifyConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
  });

  const taskId = id!;

  useEffect(() => {
    if (task) {
      setProgressInput(typeof task.progress === "number" ? task.progress : 0);
      setAssignSpecialistId(task.assigneeId || "");
    }
  }, [task]);

  const isAssignee = !!staffId && task?.assigneeId === staffId;

  const openEdit = useCallback(() => {
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      });
    }
    setEditOpen(true);
  }, [task]);

  const handleEditSave = useCallback(async () => {
    if (!editForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      await updateTask.mutateAsync({
        id: taskId,
        title: editForm.title.trim(),
        notes: editForm.description.trim() || undefined,
        priority: editForm.priority,
        deadline: editForm.dueDate || undefined,
      });
      toast.success("Task updated");
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update task");
    }
  }, [taskId, editForm, updateTask]);

  const handleAction = useCallback(async () => {
    if (!actionType) return;
    try {
      if (actionType === "submit") {
        await submitTask.mutateAsync({
          id: taskId,
          note: actionNote || undefined,
        });
        toast.success("Task submitted for review");
      } else if (actionType === "approve") {
        await approveTask.mutateAsync({
          id: taskId,
          note: actionNote || undefined,
        });
        toast.success("Task approved");
      } else if (actionType === "reject") {
        await rejectTask.mutateAsync({
          id: taskId,
          note: actionNote || undefined,
        });
        toast.success("Task rejected");
      } else if (actionType === "escalate") {
        await escalateTask.mutateAsync({
          id: taskId,
          note: actionNote || undefined,
        });
        toast.success("Task escalated for executive review");
      }
      setActionType(null);
      setActionNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }, [actionType, taskId, actionNote, submitTask, approveTask, rejectTask, escalateTask]);

  const handleVerify = useCallback(async () => {
    try {
      await verifyTask.mutateAsync(taskId);
      toast.success("Task verified");
      setVerifyConfirm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }, [taskId, verifyTask]);

  const handleRate = useCallback(async () => {
    try {
      await rateTask.mutateAsync({
        id: taskId,
        rating,
        note: rateNote || undefined,
      });
      toast.success("Task rated");
      setRateOpen(false);
      setRateNote("");
      setRating(3);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }, [taskId, rating, rateNote, rateTask]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success("Task deleted");
      navigate("/tasks");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }, [taskId, deleteTask, navigate]);

  const handleExportPdf = useCallback(async () => {
    if (!task) return;
    try {
      const comments =
        (task as Task & { comments?: TaskComment[] }).comments ?? [];
      await downloadTaskPdf({ task, comments });
      toast.success("PDF downloaded");
    } catch {
      toast.error("Could not generate PDF");
    }
  }, [task]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const [aiInsights, setAiInsights] = useState<Record<string, string | string[]> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiInsights = useCallback(async () => {
    if (!task || aiLoading) return;
    setAiLoading(true);
    try {
      const { default: apiClient } = await import("@/api/client");
      const { data } = await apiClient.post("/ai/task/insights", { taskId: task.id });
      setAiInsights((data as any).insights ?? data);
    } catch {
      setAiInsights({ error: "AI analysis unavailable — check provider configuration." });
    } finally {
      setAiLoading(false);
    }
  }, [task, aiLoading]);

  const headerActions = useMemo((): HeaderAction[] => {
    if (!task) return [];
    const acts: HeaderAction[] = [
      {
        type: "button",
        label: "AI Insights",
        icon: Bot,
        variant: "secondary" as const,
        isLoading: aiLoading,
        onClick: handleAiInsights,
      },
      {
        type: "button",
        label: "Export PDF",
        icon: FileDown,
        variant: "outline",
        onClick: handleExportPdf,
      },
      {
        type: "button",
        label: "Print",
        icon: Printer,
        variant: "outline",
        onClick: handlePrint,
      },
    ];
    if (canManageTask) {
      acts.push({
        type: "button" as const,
        label: "Edit",
        icon: Pencil,
        variant: "outline" as const,
        onClick: openEdit,
      });
    }
    if (task.status === "IN_PROGRESS" && task.approvalStatus === "WAITING") {
      acts.push({
        type: "button" as const,
        label: "Submit",
        icon: Send,
        variant: "outline" as const,
        onClick: () => setActionType("submit"),
      });
    }
    if (canApproveTask && task.approvalStatus === "SUBMITTED") {
      acts.push({
        type: "button" as const,
        label: "Approve",
        icon: CheckCircle2,
        variant: "outline" as const,
        onClick: () => setActionType("approve"),
      });
      acts.push({
        type: "button" as const,
        label: "Reject",
        icon: XCircle,
        variant: "danger" as const,
        onClick: () => setActionType("reject"),
      });
      acts.push({
        type: "button" as const,
        label: "Escalate",
        icon: AlertTriangle,
        variant: "outline" as const,
        onClick: () => setActionType("escalate"),
      });
    }
    if (canVerifyTask && task.approvalStatus === "APPROVED_MGR") {
      acts.push({
        type: "button" as const,
        label: "Verify",
        icon: ShieldCheck,
        onClick: () => setVerifyConfirm(true),
      });
    }
    if (canVerifyTask && task.approvalStatus === "VERIFIED") {
      acts.push({
        type: "button" as const,
        label: "Rate",
        icon: Star,
        variant: "outline" as const,
        onClick: () => setRateOpen(true),
      });
    }
    return acts;
  }, [task, canManageTask, canApproveTask, canVerifyTask, openEdit, handleExportPdf, handlePrint, aiLoading, handleAiInsights]);

  useHeaderConfig(
    useMemo(
      () => ({
        title: task?.title ?? "Task",
        breadcrumbs: [
          { label: "Tasks", href: "/tasks" },
          { label: task?.title ?? "..." },
        ],
        actions: headerActions,
      }),
      [task?.title, headerActions],
    ),
  );

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Card>
            <div className="space-y-4">
              <Skeleton className="h-5 w-48" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (!task) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-20 text-gray-500 dark:text-gray-400">
          Task not found
        </div>
      </PageTransition>
    );
  }

  const duePretty = new Date(task.dueDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <PrintBrandHeader
          documentLabel="Task report"
          title={task.title}
          subtitle={
            task.projectName ? `Project: ${task.projectName}` : undefined
          }
          meta={[
            { label: "Status", value: task.status },
            { label: "Priority", value: task.priority },
            { label: "Due", value: duePretty },
            { label: "Assignee", value: task.assigneeName || "—" },
          ]}
        />

        {/* Task info card */}
        <Card className="print:break-inside-avoid">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex items-center gap-3">
              <StatusBadge status={task.status} />
              <StatusBadge status={task.priority} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {task.tags?.[0] && (
              <Badge variant="primary" size="sm">
                Category: {task.tags[0]}
              </Badge>
            )}
            {task.assignedBranch && (
              <Badge variant="default" size="sm">
                Branch: {task.assignedBranch}
              </Badge>
            )}
            {task.assignedManagerName && (
              <Badge variant="default" size="sm">
                Manager: {task.assignedManagerName}
              </Badge>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Assignee
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Avatar
                    name={task.assigneeName}
                    src={task.assigneeAvatar}
                    size="xs"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {task.assigneeName}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-900/30">
                <FolderOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Project
                </p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {task.projectName || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/30">
                <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Due Date
                </p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(task.dueDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/30">
                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Created
                </p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(task.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {(isAssignee || canManageTask) && (
            <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-700/60 dark:bg-gray-900/30">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <TrendingUp className="h-4 w-4" />
                Live progress
              </div>
              <p className="mb-3 hidden text-sm font-semibold tabular-nums text-gray-900 print:block">
                Progress:{" "}
                {typeof task.progress === "number"
                  ? task.progress
                  : progressInput}
                %
                {task.progressUpdatedAt ? (
                  <span className="ml-2 font-normal text-gray-500">
                    (updated {new Date(task.progressUpdatedAt).toLocaleString()}
                    )
                  </span>
                ) : null}
              </p>
              <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="range"
                  min={0}
                  max={100}
                  aria-label="Task progress"
                  title="Task progress"
                  value={progressInput}
                  disabled={!isAssignee || updateTask.isPending}
                  onChange={(e) => setProgressInput(Number(e.target.value))}
                  onMouseUp={async () => {
                    if (!isAssignee) return;
                    try {
                      await updateTask.mutateAsync({
                        id: taskId,
                        progress: progressInput,
                      });
                      toast.success("Progress saved");
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Failed",
                      );
                    }
                  }}
                  className="h-2 w-full max-w-md cursor-pointer accent-primary-600 disabled:opacity-50"
                />
                <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                  {progressInput}%
                </span>
                {task.progressUpdatedAt && (
                  <span className="text-xs text-gray-400">
                    Updated {new Date(task.progressUpdatedAt).toLocaleString()}
                  </span>
                )}
              </div>
              {!isAssignee && (
                <p className="no-print mt-2 text-xs text-gray-500">
                  Only the assignee can drag the progress slider.
                </p>
              )}
            </div>
          )}
        </Card>

        {(canManageTask || isAssignee) && (
          <Card>
            <CardContent className="mt-0">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <Paperclip className="h-4 w-4" />
                Files & documents
              </div>
              <ul className="space-y-2">
                {(task.taskAttachments ?? []).map((a) => (
                  <li key={a.url + a.name}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 underline hover:text-primary-700 dark:text-primary-400"
                    >
                      {a.name}
                    </a>
                    {a.uploadedAt && (
                      <span className="ml-2 text-xs text-gray-400">
                        {new Date(a.uploadedAt).toLocaleString()}
                      </span>
                    )}
                  </li>
                ))}
                {(!task.taskAttachments ||
                  task.taskAttachments.length === 0) && (
                  <li className="text-sm text-gray-500">No attachments yet.</li>
                )}
              </ul>
              <label className="no-print mt-4 flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/90 p-3 transition-colors hover:border-primary-300/70 hover:bg-primary-50/30 dark:border-gray-600 dark:bg-gray-900/35 dark:hover:border-primary-600/50 dark:hover:bg-primary-950/20">
                <div>
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-100">Add files</span>
                  <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                    PDF, images, or documents — you can select multiple files.
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  className="w-full min-w-0 cursor-pointer text-xs text-gray-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-gray-200 file:bg-white file:px-3 file:py-2 file:text-xs file:font-medium file:text-gray-800 file:shadow-sm transition file:hover:border-primary-300 file:hover:bg-primary-50 dark:text-gray-300 dark:file:border-gray-600 dark:file:bg-gray-800 dark:file:text-gray-100 dark:file:hover:border-primary-500/60 dark:file:hover:bg-primary-950/50"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (!files.length) return;
                    try {
                      await uploadAttachments.mutateAsync({ taskId, files });
                      toast.success("Files uploaded");
                      e.target.value = "";
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Upload failed",
                      );
                    }
                  }}
                />
              </label>
            </CardContent>
          </Card>
        )}

        {canManageTask && (
          <Card className="no-print">
            <CardContent className="mt-0 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Assign specialist
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Branch managers route work to staff in their branch; senior
                roles can assign anyone.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-[240px] flex-1">
                  <Select
                    label="Shoulder / intern"
                    value={assignSpecialistId}
                    onChange={(e) => setAssignSpecialistId(e.target.value)}
                    options={[
                      { label: "Unassigned", value: "" },
                      ...(staffPage?.data ?? [])
                        .filter(
                          (s) =>
                            s.systemRole === "STAFF" ||
                            s.systemRole === "INTERN",
                        )
                        .map((s) => ({
                          label: `${s.name} · ${s.branch || "—"}`,
                          value: s.id,
                        })),
                    ]}
                  />
                </div>
                <Button
                  size="sm"
                  isLoading={updateTask.isPending}
                  onClick={async () => {
                    try {
                      await updateTask.mutateAsync({
                        id: taskId,
                        ...(assignSpecialistId
                          ? { assignedMemberId: assignSpecialistId }
                          : { assignedMemberId: null }),
                      });
                      toast.success("Assignee updated");
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Failed",
                      );
                    }
                  }}
                >
                  Save assignment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Insights panel */}
        {aiInsights && (
          <Card className="border-l-4 border-l-primary-500 no-print">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Task Insights</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAiInsights(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Dismiss
                </button>
              </div>
              {'error' in aiInsights ? (
                <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">{String(aiInsights.error)}</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {aiInsights.status_assessment && (
                    <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
                      <Target className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-700 dark:text-gray-300">{String(aiInsights.status_assessment ?? '')}</p>
                      </div>
                    </div>
                  )}
                  {aiInsights.priority_tip && (
                    <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
                      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Focus</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-700 dark:text-gray-300">{String(aiInsights.priority_tip ?? '')}</p>
                      </div>
                    </div>
                  )}
                  {aiInsights.blockers && (
                    <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Risks</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-700 dark:text-gray-300">{String(aiInsights.blockers ?? '')}</p>
                      </div>
                    </div>
                  )}
                  {aiInsights.time_estimate && (
                    <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Effort</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-700 dark:text-gray-300">{String(aiInsights.time_estimate ?? '')}</p>
                      </div>
                    </div>
                  )}
                  {Array.isArray(aiInsights.next_steps) && (
                    <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60 sm:col-span-2">
                      <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Next steps</p>
                        <ul className="mt-1 space-y-1">
                          {(aiInsights.next_steps as string[]).map((s, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {aiInsights.motivation && (
                    <div className="flex items-start gap-2 rounded-lg bg-primary-50/50 p-3 dark:bg-primary-950/20 sm:col-span-2">
                      <Heart className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                      <p className="text-xs font-medium leading-relaxed text-primary-700 dark:text-primary-300">{String(aiInsights.motivation ?? '')}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs section */}
        <Tabs
          className="no-print"
          tabs={[
            { label: "Details", value: "details" },
            { label: "Activity", value: "activity" },
          ]}
          value={tab}
          onChange={setTab}
        />

        <div
          className={cn(tab === "details" ? "block" : "hidden", "print:!block")}
        >
          <Card className="print:break-inside-avoid">
            <CardContent className="mt-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Description
              </p>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {task.description || "No description provided."}
              </p>

              {task.tags.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="primary" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div
          className={cn(
            tab === "activity" ? "block" : "hidden",
            "print:!block",
          )}
        >
          <Card className="print:break-inside-avoid">
            <CardContent className="mt-0 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Timeline
                </p>
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
                  Created {new Date(task.createdAt).toLocaleString()}
                </div>
                {(
                  (task as Task & { comments?: TaskComment[] }).comments ?? []
                ).map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {c.authorName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">
                      {c.content}
                    </p>
                  </div>
                ))}
              </div>
              <div className="no-print space-y-2 border-t border-gray-100 pt-3 dark:border-gray-700/40">
                <Textarea
                  label="Add comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    isLoading={addComment.isPending}
                    onClick={async () => {
                      if (!comment.trim()) return;
                      try {
                        await addComment.mutateAsync({
                          taskId: task.id,
                          content: comment.trim(),
                        });
                        setComment("");
                        toast.success("Comment added");
                      } catch (err) {
                        toast.error(
                          err instanceof Error
                            ? err.message
                            : "Failed to comment",
                        );
                      }
                    }}
                  >
                    Post Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <TaskSignatureBlock task={task} />

        {/* Delete (managers): same vertical rhythm as cards above — must stay inside space-y-6 */}
        {canDeleteTask && task && (
          <div
            className="no-print rounded-xl border border-red-200/90 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/25"
            role="region"
            aria-label="Delete task"
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-center gap-2 border-red-300 text-red-700 shadow-sm hover:border-red-400 hover:bg-red-100/80 dark:border-red-800 dark:text-red-300 dark:hover:border-red-700 dark:hover:bg-red-950/50 sm:w-auto"
              icon={<Trash2 className="h-4 w-4 shrink-0" aria-hidden />}
              onClick={() => setDeleteConfirm(true)}
            >
              Delete Task
            </Button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Task"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={updateTask.isPending} onClick={handleEditSave}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={editForm.title}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, title: e.target.value }))
            }
            required
          />
          <Textarea
            label="Description"
            value={editForm.description}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={editForm.priority}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, priority: e.target.value }))
              }
              options={[
                { label: "Critical", value: "CRITICAL" },
                { label: "High", value: "HIGH" },
                { label: "Medium", value: "MEDIUM" },
                { label: "Low", value: "LOW" },
              ]}
            />
            <Input
              type="date"
              label="Due Date"
              value={editForm.dueDate}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, dueDate: e.target.value }))
              }
            />
          </div>
        </div>
      </Modal>

      {/* Action modal (submit / approve / reject) */}
      <Modal
        isOpen={!!actionType}
        onClose={() => {
          setActionType(null);
          setActionNote("");
        }}
        title={
          actionType === "submit"
            ? "Submit Task"
            : actionType === "approve"
              ? "Approve Task"
              : actionType === "escalate"
                ? "Escalate Task"
                : "Reject Task"
        }
        description={
          actionType === "submit"
            ? "Submit this task for review."
            : actionType === "approve"
              ? "Approve this completed task."
              : actionType === "escalate"
                ? "Escalate this task for executive review."
                : "Reject and return this task for rework."
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setActionType(null);
                setActionNote("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "reject" ? "danger" : undefined}
              isLoading={
                submitTask.isPending ||
                approveTask.isPending ||
                rejectTask.isPending ||
                escalateTask.isPending
              }
              onClick={handleAction}
            >
              {actionType === "submit"
                ? "Submit"
                : actionType === "approve"
                  ? "Approve"
                  : actionType === "escalate"
                    ? "Escalate"
                    : "Reject"}
            </Button>
          </>
        }
      >
        <Textarea
          label={
            actionType === "submit"
              ? "Note for manager review"
              : actionType === "approve"
                ? "Approval note"
                : actionType === "escalate"
                  ? "Escalation reason"
                  : "Rejection feedback"
          }
          placeholder="Add a note..."
          rows={3}
          value={actionNote}
          onChange={(e) => setActionNote(e.target.value)}
        />
      </Modal>

      {/* Verify confirm */}
      <ConfirmDialog
        isOpen={verifyConfirm}
        onClose={() => setVerifyConfirm(false)}
        title="Verify Task"
        message="Mark this task as fully verified? This confirms quality of delivery."
        confirmLabel="Verify"
        isLoading={verifyTask.isPending}
        onConfirm={handleVerify}
      />

      {/* Rate modal */}
      <Modal
        isOpen={rateOpen}
        onClose={() => setRateOpen(false)}
        title="Rate Task"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRateOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={rateTask.isPending} onClick={handleRate}>
              Submit Rating
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Rating (1–10)
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${
                    rating >= n
                      ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "border-gray-200 text-gray-400 hover:border-gray-300 dark:border-gray-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            label="Feedback (optional)"
            placeholder="Add feedback for the assignee..."
            rows={3}
            value={rateNote}
            onChange={(e) => setRateNote(e.target.value)}
          />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        title="Delete Task"
        message={`Delete "${task?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteTask.isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}

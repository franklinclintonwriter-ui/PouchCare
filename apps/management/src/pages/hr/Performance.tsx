import { useState, useCallback } from "react";
import { Plus, TrendingUp, TrendingDown, Pencil, Trash2 } from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import {
  usePerformanceReviews,
  useCreatePerformanceReview,
  useUpdatePerformanceReview,
  useDeletePerformanceReview,
} from "@/api/performance";
import { useStaffList } from "@/api/staff";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { usePermission } from "@/hooks/usePermission";
import type { PerformanceReview } from "@/types/models";
import { toast } from "sonner";
import { useMemo } from "react";

const emptyForm = {
  staffMemberId: "",
  staffName: "",
  reviewQuarter: "Q1",
  reviewYear: String(new Date().getFullYear()),
  overallRating: "",
  taskQuality: "",
  communication: "",
  punctuality: "",
  teamwork: "",
  notes: "",
};

const QUARTER_OPTIONS = ["Q1", "Q2", "Q3", "Q4"].map((q) => ({
  label: q,
  value: q,
}));

export default function Performance() {
  const { data: reviews, isLoading } = usePerformanceReviews();
  const createReview = useCreatePerformanceReview();
  const updateReview = useUpdatePerformanceReview();
  const deleteReview = useDeletePerformanceReview();
  const { data: staffRows } = useStaffList({ limit: 300 });
  const perm = usePermission();
  const canCreate = perm.can("hr.performance");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PerformanceReview | null>(
    null,
  );
  const [form, setForm] = useState(emptyForm);

  const openEdit = useCallback((review: PerformanceReview) => {
    setEditingId(review.id);
    setForm({
      staffMemberId: review.staffId,
      staffName: review.staffName,
      reviewQuarter: review.period.split(" ")[0] ?? "Q1",
      reviewYear:
        review.period.split(" ")[1] ?? String(new Date().getFullYear()),
      overallRating: String(Math.round(review.overallScore / 10)),
      taskQuality: String(Math.round(review.scores.tasks / 10)),
      communication: String(Math.round(review.scores.quality / 10)),
      punctuality: String(Math.round(review.scores.attendance / 10)),
      teamwork: String(Math.round(review.scores.initiative / 10)),
      notes: review.comments,
    });
    setModalOpen(true);
  }, []);

  const reviewData: PerformanceReview[] = Array.isArray(reviews)
    ? reviews
    : (() => {
        const maybe = reviews as unknown as { data?: unknown };
        return Array.isArray(maybe?.data)
          ? (maybe.data as PerformanceReview[])
          : [];
      })();

  const radarData = useMemo(() => {
    if (!reviewData.length) return [];
    const avg = (key: keyof PerformanceReview["scores"]) =>
      Math.round(
        reviewData.reduce((s, r) => s + (r?.scores?.[key] ?? 0), 0) /
          reviewData.length,
      );
    return [
      { metric: "Tasks", score: avg("tasks") },
      { metric: "Attendance", score: avg("attendance") },
      { metric: "Quality", score: avg("quality") },
      { metric: "Initiative", score: avg("initiative") },
    ];
  }, [reviewData]);

  const staffOptions = useMemo(
    () => [
      { label: "Select staff", value: "" },
      ...(staffRows?.data ?? []).map((s) => ({
        label: `${s.name} (${s.memberId})`,
        value: s.id,
      })),
    ],
    [staffRows?.data],
  );

  useHeaderConfig(
    useMemo(
      () => ({
        title: "Performance",
        breadcrumbs: [{ label: "HR", href: "/hr" }, { label: "Performance" }],
        actions: canCreate
          ? [
              {
                type: "button" as const,
                label: "Add Review",
                icon: Plus,
                onClick: () => {
                  setEditingId(null);
                  setForm(emptyForm);
                  setModalOpen(true);
                },
              },
            ]
          : [],
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }),
      [canCreate],
    ),
  );

  const handleSave = async () => {
    if (!form.staffMemberId.trim() || !form.overallRating) {
      return toast.error("Staff ID and overall rating are required");
    }
    const payload = {
      staffMemberId: form.staffMemberId.trim(),
      staffName: form.staffName.trim() || form.staffMemberId.trim(),
      reviewQuarter: form.reviewQuarter,
      reviewYear: Number(form.reviewYear),
      overallRating: Number(form.overallRating),
      taskQuality: form.taskQuality ? Number(form.taskQuality) : undefined,
      communication: form.communication
        ? Number(form.communication)
        : undefined,
      punctuality: form.punctuality ? Number(form.punctuality) : undefined,
      teamwork: form.teamwork ? Number(form.teamwork) : undefined,
      notes: form.notes || undefined,
    };
    try {
      if (editingId) {
        await updateReview.mutateAsync({ id: editingId, ...payload });
        toast.success("Review updated");
      } else {
        await createReview.mutateAsync(payload);
        toast.success("Review created");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Failed to ${editingId ? "update" : "create"} review`,
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReview.mutateAsync(deleteTarget.id);
      toast.success("Review deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete review");
    }
  };

  return (
    <PageTransition className="space-y-6">
      <Card padding="none">
        <div className="p-4 sm:p-5">
          <CardHeader>
            <CardTitle>Team Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-72">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Skeleton className="h-48 w-48 rounded-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={radarData}
                    cx="50%"
                    cy="50%"
                    outerRadius="75%"
                  >
                    <PolarGrid className="stroke-gray-200 dark:stroke-gray-700" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fontSize: 12 }}
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <Radar
                      name="Average Score"
                      dataKey="score"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                  <Skeleton className="h-8 w-12 rounded" />
                </div>
              </Card>
            ))
          : reviewData.map((review) => (
              <PerformanceCard
                key={review.id}
                review={review}
                canManage={canCreate}
                onEdit={() => openEdit(review)}
                onDelete={() => setDeleteTarget(review)}
              />
            ))}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Review"
        message={`Delete performance review for "${deleteTarget?.staffName}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteReview.isPending}
        onConfirm={handleDelete}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Performance Review" : "Add Performance Review"}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              isLoading={createReview.isPending || updateReview.isPending}
              onClick={handleSave}
            >
              {editingId ? "Save Changes" : "Save Review"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label="Staff Member"
            value={form.staffMemberId}
            onChange={(e) => {
              const selectedId = e.target.value;
              const selected = (staffRows?.data ?? []).find(
                (s) => s.id === selectedId,
              );
              setForm((f) => ({
                ...f,
                staffMemberId: selectedId,
                staffName: selected?.name ?? f.staffName,
              }));
            }}
            options={staffOptions}
          />
          <Input
            label="Staff Name (display)"
            placeholder="John Doe"
            value={form.staffName}
            onChange={(e) =>
              setForm((f) => ({ ...f, staffName: e.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Quarter"
              options={QUARTER_OPTIONS}
              value={form.reviewQuarter}
              onChange={(e) =>
                setForm((f) => ({ ...f, reviewQuarter: e.target.value }))
              }
            />
            <Input
              label="Year"
              type="number"
              value={form.reviewYear}
              onChange={(e) =>
                setForm((f) => ({ ...f, reviewYear: e.target.value }))
              }
            />
          </div>
          <Input
            type="number"
            label="Overall Rating (1–10)"
            min="1"
            max="10"
            step="0.1"
            value={form.overallRating}
            onChange={(e) =>
              setForm((f) => ({ ...f, overallRating: e.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Task Quality (1–10)"
              min="1"
              max="10"
              step="0.1"
              value={form.taskQuality}
              onChange={(e) =>
                setForm((f) => ({ ...f, taskQuality: e.target.value }))
              }
            />
            <Input
              type="number"
              label="Communication (1–10)"
              min="1"
              max="10"
              step="0.1"
              value={form.communication}
              onChange={(e) =>
                setForm((f) => ({ ...f, communication: e.target.value }))
              }
            />
            <Input
              type="number"
              label="Punctuality (1–10)"
              min="1"
              max="10"
              step="0.1"
              value={form.punctuality}
              onChange={(e) =>
                setForm((f) => ({ ...f, punctuality: e.target.value }))
              }
            />
            <Input
              type="number"
              label="Teamwork (1–10)"
              min="1"
              max="10"
              step="0.1"
              value={form.teamwork}
              onChange={(e) =>
                setForm((f) => ({ ...f, teamwork: e.target.value }))
              }
            />
          </div>
          <Textarea
            label="Notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </Modal>
    </PageTransition>
  );
}

function PerformanceCard({
  review,
  canManage,
  onEdit,
  onDelete,
}: {
  review: PerformanceReview;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPositive = review.trend >= 0;
  const scoreEntries = review?.scores ? Object.entries(review.scores) : [];

  return (
    <Card hover>
      <div className="flex items-center gap-3">
        <Avatar name={review.staffName} src={review.avatarUrl} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {review.staffName}
          </p>
          <Badge variant="default" size="sm">
            {review.period}
          </Badge>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {review.overallScore}
          </p>
          <div
            className={`flex items-center justify-end gap-0.5 text-xs font-medium ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>
              {isPositive ? "+" : ""}
              {review.trend}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {scoreEntries.map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-14 truncate text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {key}
            </span>
            <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${val}%` }}
              />
            </div>
            <span className="w-6 text-right text-[10px] font-semibold text-gray-600 dark:text-gray-400">
              {val}
            </span>
          </div>
        ))}
      </div>

      {canManage && (
        <div className="mt-3 flex justify-end gap-1 border-t border-gray-100 pt-2 dark:border-gray-700">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </Card>
  );
}

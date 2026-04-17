import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Calendar,
  CalendarClock,
  Cctv,
  ClipboardList,
  Clock,
  FileText,
  FolderKanban,
  Hash,
  Laptop,
  ListTodo,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plane,
  Receipt,
  ShoppingCart,
  Star,
  Trash2,
  Trophy,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useBranchDetail,
  useBranchMembers,
  useBranchManagerCandidates,
  useDeleteBranch,
  useUpdateBranch,
  type BranchMemberRow,
  type BranchReferenceBreakdown,
} from "@/api/admin-resources";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatsRow } from "@/components/shared/StatsRow";
import { cn } from "@/utils/cn";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Suspended", value: "Suspended" },
];

function formatRole(role: string) {
  return role.replace(/_/g, " ");
}

function formatRoleLabel(role: string, jobRole?: string | null) {
  return jobRole || role.replace(/_/g, " ");
}

function formatDateLabel(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export default function BranchDetail() {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [memberSearch, setMemberSearch] = useState("");
  const debouncedMemberQ = useDebounce(memberSearch, 350);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    name: "",
    country: "",
    city: "",
    type: "",
    status: "Active",
    branchManager: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    establishedDate: "",
  });

  const { data, isLoading, isError } = useBranchDetail(branchId);
  const { data: membersPage, isLoading: membersLoading } = useBranchMembers(
    branchId,
    {
      page,
      limit: 15,
      ...(debouncedMemberQ.trim() ? { q: debouncedMemberQ.trim() } : {}),
    },
  );
  const { data: managerCandidates, isLoading: candidatesLoading } =
    useBranchManagerCandidates(branchId);

  const managerOptions = useMemo(() => {
    const opts = [{ label: "— No manager selected —", value: "" }];
    if (managerCandidates) {
      for (const c of managerCandidates) {
        const role = formatRoleLabel(c.systemRole, c.jobRole);
        opts.push({ label: `${c.name} — ${role}`, value: c.name });
      }
    }
    return opts;
  }, [managerCandidates]);

  useEffect(() => {
    setPage(1);
    setMemberSearch("");
  }, [branchId]);

  useEffect(() => {
    setPage(1);
  }, [debouncedMemberQ]);
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const branch = data?.branch;
  const stats = data?.stats;
  const managerMember = data?.managerMember;
  const refs = data?.references;

  const onMemberSearchChange = useCallback((v: string) => {
    setMemberSearch(v);
    setPage(1);
  }, []);

  const openEdit = useCallback(() => {
    if (!branch) return;
    const est = branch.establishedDate;
    setForm({
      name: branch.name,
      country: branch.country ?? "",
      city: branch.city ?? "",
      type: branch.type ?? "",
      status: branch.status,
      branchManager: branch.branchManager ?? "",
      email: branch.email ?? "",
      phone: branch.phone ?? "",
      address: branch.address ?? "",
      notes: branch.notes ?? "",
      establishedDate: est ? est.slice(0, 10) : "",
    });
    setEditOpen(true);
  }, [branch]);

  useHeaderConfig(
    useMemo(
      () => ({
        title: branch?.name ?? "Branch",
        breadcrumbs: [
          { label: "Shoulder", href: "/staff" },
          { label: "Branches", href: "/staff/branches" },
          { label: branch?.name ?? "…" },
        ],
        actions: [
          {
            type: "search" as const,
            placeholder: "Search team members…",
            value: memberSearch,
            onChange: onMemberSearchChange,
          },
          {
            type: "button" as const,
            label: "Cameras",
            icon: Cctv,
            variant: "outline" as const,
            onClick: () => navigate(`/monitor/${branchId}`),
          },
          {
            type: "button" as const,
            label: "Edit",
            icon: Pencil,
            variant: "outline" as const,
            onClick: openEdit,
          },
          {
            type: "button" as const,
            label: "Delete",
            icon: Trash2,
            variant: "danger" as const,
            disabled: !branchId || !refs || refs.total > 0,
            onClick: () => setConfirmDelete(true),
          },
        ],
      }),
      [branch, branchId, memberSearch, onMemberSearchChange, openEdit, refs],
    ),
  );

  const onSaveEdit = async () => {
    if (!branchId || !form.name.trim()) {
      toast.error("Branch name is required");
      return;
    }
    try {
      await updateBranch.mutateAsync({
        id: branchId,
        name: form.name.trim(),
        country: form.country || undefined,
        city: form.city || undefined,
        type: form.type || undefined,
        status: form.status,
        branchManager: form.branchManager || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
        establishedDate: form.establishedDate || undefined,
      });
      setEditOpen(false);
      toast.success("Branch updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const onSetManagerFromMember = useCallback(
    async (member: BranchMemberRow) => {
      if (!branchId) return;
      try {
        await updateBranch.mutateAsync({
          id: branchId,
          branchManager: member.name,
        });
        toast.success(`Manager set to ${member.name}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    },
    [branchId, updateBranch],
  );

  const memberRows = membersPage?.data ?? [];
  const memberMeta = membersPage?.meta;

  const columns: Column<BranchMemberRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sticky: true,
        render: (r) => (
          <Link
            to={`/staff/${r.id}`}
            className="font-medium text-primary-600 hover:underline dark:text-primary-400"
            onClick={(e) => e.stopPropagation()}
          >
            {r.name}
          </Link>
        ),
      },
      {
        key: "systemRole",
        label: "Role",
        render: (r) => (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {formatRole(r.systemRole)}
          </span>
        ),
      },
      {
        key: "jobRole",
        label: "Job",
        render: (r) => <span>{r.jobRole || "—"}</span>,
      },
      {
        key: "status",
        label: "Status",
        render: (r) => (
          <Badge
            variant={
              (r.status || "").toLowerCase() === "active"
                ? "success"
                : "default"
            }
            size="sm"
          >
            {r.status || "—"}
          </Badge>
        ),
      },
      {
        key: "joinDate",
        label: "Joined",
        render: (r) => (
          <span className="text-xs tabular-nums text-gray-600 dark:text-gray-400">
            {formatDateLabel(r.joinDate)}
          </span>
        ),
      },
      {
        key: "phone",
        label: "Contact",
        render: (r) => (
          <span className="max-w-[8rem] truncate text-xs text-gray-600 dark:text-gray-400">
            {r.phone || r.whatsapp || "—"}
          </span>
        ),
      },
      {
        key: "tasksCompleted",
        label: "Tasks",
        render: (r) => <span className="tabular-nums">{r.tasksCompleted}</span>,
      },
      {
        key: "rating",
        label: "Avg rating",
        render: (r) => (
          <span className="tabular-nums">
            {r.averageTaskRating != null ? r.averageTaskRating.toFixed(1) : "—"}
          </span>
        ),
      },
      {
        key: "actions",
        label: "",
        align: "right",
        render: (r) => (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              void onSetManagerFromMember(r);
            }}
          >
            Set as manager
          </Button>
        ),
      },
    ],
    [onSetManagerFromMember],
  );

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Card padding="none" className="overflow-hidden">
            <div className="space-y-4 p-4 sm:p-6">
              <div className="flex gap-4">
                <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-48 rounded-lg" />
                  <Skeleton className="h-4 w-full max-w-md rounded" />
                </div>
              </div>
              <Skeleton className="h-10 w-full max-w-xl rounded-lg" />
            </div>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-xl lg:col-span-2" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isError || !branch || !stats || !refs) {
    return (
      <PageTransition>
        <Card className="mx-auto max-w-lg">
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-600 dark:text-gray-400">
              Branch not found or you don&apos;t have access.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => navigate("/staff/branches")}
            >
              Back to branches
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  const roleEntries = Object.entries(stats.byRole).sort((a, b) => b[1] - a[1]);
  const locationLine = [branch.city, branch.country].filter(Boolean).join(", ");
  const kpiItems = [
    {
      title: "Members",
      value: stats.memberCount,
      icon: <Users className="h-4 w-4" />,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
      changeLabel: `${stats.activeCount} active`,
    },
    {
      title: "Manager",
      value: branch.branchManager || "—",
      icon: <UserCircle className="h-4 w-4" />,
      iconBg:
        "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
      changeLabel: managerMember ? "Profile linked" : "Set in edit",
    },
    {
      title: "Tasks completed",
      value: stats.totalTasksCompleted,
      icon: <ListTodo className="h-4 w-4" />,
      iconBg:
        "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
      changeLabel: "Branch total",
    },
    {
      title: "Avg task rating",
      value: stats.avgTaskRating != null ? stats.avgTaskRating.toFixed(1) : "—",
      icon: <Star className="h-4 w-4" />,
      iconBg:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
      changeLabel: "Where rated",
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Hero */}
        <Card
          padding="none"
          className="overflow-hidden border-gray-200/90 bg-gradient-to-br from-white via-gray-50/40 to-primary-50/25 shadow-sm ring-1 ring-gray-200/60 dark:border-gray-700/50 dark:from-gray-800/95 dark:via-gray-800/70 dark:to-primary-950/25 dark:ring-gray-700/50 sm:shadow-md"
        >
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80 dark:bg-gray-900/70 dark:ring-gray-700">
                  <Building2 className="h-7 w-7 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl">
                      {branch.name}
                    </h1>
                    <Badge
                      variant={
                        branch.status === "Active" ? "success" : "default"
                      }
                      size="sm"
                    >
                      {branch.status}
                    </Badge>
                    {branch.type ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700/80 dark:text-gray-200">
                        <Hash className="h-3 w-3 opacity-70" />
                        {branch.type}
                      </span>
                    ) : null}
                  </div>
                  {locationLine ? (
                    <p className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                      {locationLine}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Location not set — add city and country in Edit.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Created {formatDateLabel(branch.createdAt)}
                    </span>
                    {branch.establishedDate ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Established {formatDateLabel(branch.establishedDate)}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-400">
                      ID {branch.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-gray-700/60 dark:bg-gray-900/40 sm:px-6">
            <StatsRow items={kpiItems} columns="grid-cols-2 lg:grid-cols-4" />
          </div>
        </Card>

        <ConfirmDialog
          isOpen={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title="Delete Branch"
          message={
            refs && refs.total > 0
              ? "This branch has linked data and cannot be deleted. Move or remove linked items first."
              : "This will permanently delete the branch. This action cannot be undone."
          }
          confirmLabel="Delete"
          variant="danger"
          isLoading={deleteBranch.isPending}
          onConfirm={async () => {
            if (!branchId) return;
            try {
              await deleteBranch.mutateAsync(branchId);
              toast.success("Branch deleted");
              navigate("/staff/branches");
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : "Failed to delete branch",
              );
            } finally {
              setConfirmDelete(false);
            }
          }}
        />

        <div className={cn("grid gap-6", refs.total > 0 && "lg:grid-cols-3")}>
          {/* Contact & profile */}
          <Card className={cn(refs.total > 0 && "lg:col-span-2")} padding="lg">
            <CardHeader>
              <CardTitle className="text-base">Contact &amp; address</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <ContactItem
                icon={Mail}
                label="Email"
                value={branch.email}
                href={branch.email ? `mailto:${branch.email}` : undefined}
              />
              <ContactItem
                icon={Phone}
                label="Phone"
                value={branch.phone}
                href={
                  branch.phone
                    ? `tel:${branch.phone.replace(/\s/g, "")}`
                    : undefined
                }
              />
              <div className="sm:col-span-2">
                <div className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-700/60 dark:bg-gray-900/30">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Address
                    </p>
                    <p className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
                      {branch.address || "—"}
                    </p>
                  </div>
                </div>
              </div>
              {branch.notes ? (
                <div className="sm:col-span-2 rounded-xl border border-dashed border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Internal notes
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                    {branch.notes}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {refs.total > 0 ? <ReferencesPanel refs={refs} /> : null}
        </div>

        {managerMember ? (
          <Card className="border-primary-200/60 bg-gradient-to-br from-white to-primary-50/20 dark:border-primary-900/40 dark:from-gray-900 dark:to-primary-950/20">
            <CardHeader>
              <CardTitle className="text-base">Branch manager</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {managerMember.name}
                </p>
                <p className="text-sm text-gray-500">{managerMember.email}</p>
                <p className="text-xs text-gray-400">
                  {formatRole(managerMember.systemRole)}
                  {managerMember.jobRole ? ` · ${managerMember.jobRole}` : ""}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/staff/${managerMember.id}`)}
              >
                View profile
              </Button>
            </CardContent>
          </Card>
        ) : branch.branchManager ? (
          <Card>
            <CardContent className="flex items-start gap-2 py-4 text-sm text-amber-800 dark:text-amber-200/90">
              <UserCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Manager name is set to &quot;{branch.branchManager}&quot; but no
                staff profile matched this name at this branch. Use Edit to
                adjust the name or pick someone from the team table below.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {roleEntries.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Headcount by role</CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Distribution across {stats.memberCount} rostered member(s).
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {roleEntries.map(([role, n]) => {
                const pct =
                  stats.memberCount > 0 ? (n / stats.memberCount) * 100 : 0;
                return (
                  <div key={role}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {formatRole(role)}
                      </span>
                      <span className="tabular-nums text-gray-500 dark:text-gray-400">
                        {n} ({pct.toFixed(0)}
                        %)
                      </span>
                    </div>
                    <ProgressBar
                      value={pct}
                      max={100}
                      size="sm"
                      showLabel={false}
                      color="primary"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : null}

        <section>
          <DataTable
            columns={columns}
            data={memberRows}
            isLoading={membersLoading}
            compact
            pagination={memberMeta}
            onPageChange={setPage}
            onRowClick={(row) => navigate(`/staff/${row.id}`)}
            emptyIcon={<Users />}
            emptyTitle="No staff at this branch"
            emptyDescription="Assign staff to this branch name from HR / staff records."
          />
        </section>

        <Modal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit branch"
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onSaveEdit}
                isLoading={updateBranch.isPending}
              >
                Save
              </Button>
            </>
          }
        >
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            <Input
              label="Branch name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Country"
                value={form.country}
                onChange={(e) =>
                  setForm((f) => ({ ...f, country: e.target.value }))
                }
              />
              <Input
                label="City"
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
              />
            </div>
            <Input
              label="Type"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              placeholder="e.g. HQ, Regional"
            />
            <Input
              label="Established date"
              type="date"
              value={form.establishedDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, establishedDate: e.target.value }))
              }
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
              options={STATUS_OPTIONS}
            />
            <Select
              label="Branch Manager"
              value={form.branchManager}
              onChange={(e) =>
                setForm((f) => ({ ...f, branchManager: e.target.value }))
              }
              options={managerOptions}
              disabled={candidatesLoading}
            />
            {managerCandidates?.length === 0 && !candidatesLoading && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No active staff at this branch yet. Add staff first or assign
                them to this branch.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <Input
              label="Address"
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
            />
            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
            />
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
  href?: string;
}) {
  const display = value?.trim() || "—";
  const content =
    href && value ? (
      <a
        href={href}
        className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
      >
        {value}
      </a>
    ) : (
      <p className="text-sm text-gray-900 dark:text-gray-100">{display}</p>
    );
  return (
    <div className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-700/60 dark:bg-gray-900/30">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <div className="mt-0.5 min-w-0 break-words">{content}</div>
      </div>
    </div>
  );
}

type RefRow = { label: string; n: number; icon: LucideIcon };

function refRowsWithIcons(refs: BranchReferenceBreakdown): RefRow[] {
  const rows: RefRow[] = [
    { label: "Shoulder", n: refs.staffMembers, icon: Users },
    { label: "Tasks", n: refs.tasks, icon: ListTodo },
    { label: "Projects", n: refs.projects, icon: FolderKanban },
    { label: "Attendance", n: refs.attendance, icon: Clock },
    { label: "Leave", n: refs.leaveRequests, icon: Plane },
    { label: "Daily reports", n: refs.dailyReports, icon: FileText },
    { label: "Performance", n: refs.performanceRatings, icon: Trophy },
    { label: "Payroll", n: refs.payroll, icon: Wallet },
    { label: "Devices", n: refs.devices, icon: Laptop },
    { label: "Expenses", n: refs.expenses, icon: Receipt },
    { label: "Sales orders", n: refs.salesOrders, icon: ShoppingCart },
    { label: "Job postings", n: refs.jobPositions, icon: ClipboardList },
  ];
  return rows.filter((r) => r.n > 0);
}

function ReferencesPanel({ refs }: { refs: BranchReferenceBreakdown }) {
  if (refs.total === 0) return null;

  const lines = refRowsWithIcons(refs);

  return (
    <Card className="h-fit border-amber-200/80 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/15">
      <CardHeader>
        <CardTitle className="text-base text-amber-950 dark:text-amber-100">
          Data references
        </CardTitle>
        <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
          {refs.total} record(s) reference this branch name across linked data.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2">
          {lines.map((r) => {
            const Icon = r.icon;
            return (
              <li
                key={r.label}
                className="flex items-center justify-between gap-2 rounded-lg border border-amber-100/80 bg-white/70 px-2.5 py-2 dark:border-amber-900/40 dark:bg-gray-900/50"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm text-amber-950 dark:text-amber-100">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100/90 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate">{r.label}</span>
                </span>
                <span className="shrink-0 tabular-nums text-sm font-semibold text-amber-950 dark:text-amber-50">
                  {r.n}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

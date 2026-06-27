import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import {
  usePayroll,
  useCreatePayroll,
  useMarkPayrollPaid,
  useUpdatePayroll,
  useDeletePayroll,
} from "@/api/payroll";
import { useStaffList } from "@/api/staff";
import { useBranches } from "@/api/admin-resources";
import { PageTransition } from "@/components/ui/PageTransition";
import { StatsRow } from "@/components/shared/StatsRow";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Dropdown, type DropdownItem } from "@/components/ui/Dropdown";
import { Card, CardContent } from "@/components/ui/Card";
import { useCurrency } from "@/hooks/useCurrency";
import {
  Wallet,
  Users,
  Gift,
  TrendingUp,
  Plus,
  CalendarRange,
  Edit,
  Trash2,
  Printer,
  CheckCircle2,
  Clock,
  Download,
  Building2,
  FileSpreadsheet,
  Send,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { BranchTeamScopeNotice } from "@/components/team/BranchTeamScopeNotice";
import { usePayrollSlipPrint } from "@/components/payroll/PayrollSlipPrintPortal";
import { useBranchPayrollPrint } from "@/components/payroll/BranchPayrollSheet";
import { exportCsv } from "@/utils/exportCsv";
import type { PayrollEntry } from "@/types/models";
import { toast } from "sonner";

const roleVariant: Record<
  string,
  "primary" | "success" | "warning" | "danger" | "info" | "default"
> = {
  CEO: "danger",
  CO_MD: "danger",
  OP_MANAGER: "warning",
  HR_MANAGER: "info",
  BRANCH_MANAGER: "primary",
  STAFF: "default",
  INTERN: "success",
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function PayrollList() {
  const navigate = useNavigate();
  const { formatMoney } = useCurrency();
  const fmtPayroll = (n: number) => formatMoney(n, { storedIn: "BDT" });
  const now = new Date();
  const [page, setPage] = useState(1);
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterBranch, setFilterBranch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const perm = usePermission();

  useEffect(() => {
    setPage(1);
  }, [filterMonth, filterYear, filterBranch]);

  // Fetch a large batch so we can filter by branch client-side (API may not support branch param)
  const { data, isLoading, isError, error } = usePayroll({
    month: filterMonth,
    year: filterYear,
    page: 1,
    limit: 500,
  });
  const allEntries = data?.data ?? [];

  // Client-side branch filter
  const filteredEntries = useMemo(() => {
    if (!filterBranch) return allEntries;
    return allEntries.filter((e) => e.branch === filterBranch);
  }, [allEntries, filterBranch]);

  // Client-side pagination
  const PAGE_SIZE = 20;
  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredEntries.slice(start, start + PAGE_SIZE);
  }, [filteredEntries, page]);

  const paginationMeta = useMemo(
    () => ({
      total: filteredEntries.length,
      page,
      limit: PAGE_SIZE,
      totalPages: Math.ceil(filteredEntries.length / PAGE_SIZE),
    }),
    [filteredEntries.length, page],
  );

  const createPayroll = useCreatePayroll();
  const markPaid = useMarkPayrollPaid();
  const updatePayroll = useUpdatePayroll();
  const deletePayroll = useDeletePayroll();
  const { printSlip, portal: printPortal } = usePayrollSlipPrint();
  const { printBranchSheet, branchPortal } = useBranchPayrollPrint();

  const { data: staffData } = useStaffList({ limit: 500, status: "Active" });
  const staffList = staffData?.data ?? [];

  const { data: branchesData } = useBranches({ limit: 100 });
  const branchOptions = useMemo(() => {
    const branches = branchesData?.data ?? [];
    return [
      { label: "All Branches", value: "" },
      ...branches.map((b) => ({ label: b.name, value: b.name })),
    ];
  }, [branchesData]);

  // Unique branches from payroll data (fallback)
  const branchesFromPayroll = useMemo(() => {
    const names = new Set(allEntries.map((e) => e.branch).filter(Boolean));
    return Array.from(names).sort();
  }, [allEntries]);

  const [form, setForm] = useState({
    staffMemberId: "",
    month: MONTHS[now.getMonth()],
    year: now.getFullYear(),
    baseSalary: "",
    bonus: "0",
    deductions: "0",
    paymentMethod: "",
    notes: "",
  });

  const [editEntry, setEditEntry] = useState<PayrollEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<PayrollEntry | null>(null);

  const stats = useMemo(() => {
    const totalPayroll = filteredEntries.reduce((s, e) => s + e.netPay, 0);
    const avgSalary =
      filteredEntries.length > 0
        ? Math.round(totalPayroll / filteredEntries.length)
        : 0;
    const headcount = filteredEntries.length;
    const totalBonus = filteredEntries.reduce((s, e) => s + e.bonus, 0);
    const paidCount = filteredEntries.filter((e) => e.status === "PAID").length;
    const unpaidCount = filteredEntries.filter(
      (e) => e.status !== "PAID",
    ).length;
    return {
      totalPayroll,
      avgSalary,
      headcount,
      totalBonus,
      paidCount,
      unpaidCount,
    };
  }, [filteredEntries]);

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => ({
      label: String(y - 3 + i),
      value: String(y - 3 + i),
    }));
  }, []);

  const monthOptions = useMemo(
    () => MONTHS.map((m, i) => ({ label: m, value: String(i + 1) })),
    [],
  );

  const onMonthChange = useCallback((v: string) => {
    setFilterMonth(Number(v));
    setPage(1);
  }, []);
  const onYearChange = useCallback((v: string) => {
    setFilterYear(Number(v));
    setPage(1);
  }, []);
  const onBranchChange = useCallback((v: string) => {
    setFilterBranch(v);
    setPage(1);
  }, []);
  const handleExportCsv = useCallback(() => {
    if (filteredEntries.length === 0) {
      toast.error("No payroll data to export");
      return;
    }
    const branchLabel = filterBranch || "All-Branches";
    const period = `${MONTHS[filterMonth - 1]}-${filterYear}`;
    exportCsv(
      filteredEntries,
      [
        { key: "staffName", label: "Shoulder Name" },
        {
          key: "role",
          label: "Role",
          format: (v) => String(v ?? "").replace(/_/g, " "),
        },
        { key: "branch", label: "Branch" },
        { key: "baseSalary", label: "Base Salary (BDT)" },
        { key: "bonus", label: "Bonus (BDT)" },
        { key: "deductions", label: "Deductions (BDT)" },
        { key: "netPay", label: "Net Pay (BDT)" },
        { key: "status", label: "Payment Status" },
        { key: "paymentMethod", label: "Payment Method" },
        { key: "notes", label: "Notes" },
      ],
      `Payroll-${branchLabel}-${period}.csv`,
    );
    toast.success("Payroll exported to CSV");
  }, [filteredEntries, filterBranch, filterMonth, filterYear]);

  const handlePrintBranchSheet = useCallback(() => {
    if (filteredEntries.length === 0) {
      toast.error("No payroll data to print");
      return;
    }
    printBranchSheet({
      entries: filteredEntries,
      branchName: filterBranch || "All Branches",
      month: filterMonth,
      year: filterYear,
    });
  }, [
    filteredEntries,
    filterBranch,
    filterMonth,
    filterYear,
    printBranchSheet,
  ]);

  useHeaderConfig(
    useMemo(
      () => ({
        title: "Salary Management",
        breadcrumbs: [{ label: "Home", href: "/" }, { label: "Payroll" }],
        actions: [
          {
            type: "filter" as const,
            label: "Branch",
            icon: Building2,
            options:
              branchOptions.length > 1
                ? branchOptions
                : [
                    { label: "All Branches", value: "" },
                    ...branchesFromPayroll.map((b) => ({ label: b, value: b })),
                  ],
            value: filterBranch,
            onChange: onBranchChange,
          },
          {
            type: "filter" as const,
            label: "Month",
            icon: CalendarRange,
            options: monthOptions,
            value: String(filterMonth),
            onChange: onMonthChange,
          },
          {
            type: "filter" as const,
            label: "Year",
            options: yearOptions,
            value: String(filterYear),
            onChange: onYearChange,
          },
          ...(perm.can("payroll.access")
            ? [
                {
                  type: "button" as const,
                  label: "Process Payroll",
                  icon: Plus,
                  onClick: () => setShowCreate(true),
                },
              ]
            : []),
        ],
      }),
      [
        monthOptions,
        yearOptions,
        branchOptions,
        branchesFromPayroll,
        filterMonth,
        filterYear,
        filterBranch,
        onMonthChange,
        onYearChange,
        onBranchChange,
        perm,
      ],
    ),
  );

  const handleCreate = async () => {
    if (!form.staffMemberId || !form.baseSalary) {
      toast.error("Staff member and base salary are required");
      return;
    }
    try {
      await createPayroll.mutateAsync({
        staffMemberId: form.staffMemberId,
        month: form.month,
        year: Number(form.year),
        baseSalary: Number(form.baseSalary),
        bonus: Number(form.bonus) || 0,
        deductions: Number(form.deductions) || 0,
        paymentMethod: form.paymentMethod || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Payroll record created");
      setShowCreate(false);
      setForm({
        staffMemberId: "",
        month: MONTHS[now.getMonth()],
        year: now.getFullYear(),
        baseSalary: "",
        bonus: "0",
        deductions: "0",
        paymentMethod: "",
        notes: "",
      });
    } catch {
      toast.error("Failed to create payroll record");
    }
  };

  const handleUpdate = async () => {
    if (!editEntry) return;
    try {
      await updatePayroll.mutateAsync({
        id: editEntry.id,
        baseSalary: editEntry.baseSalary,
        bonus: editEntry.bonus,
        deductions: editEntry.deductions,
        paymentMethod: editEntry.paymentMethod || undefined,
        notes: editEntry.notes || undefined,
      });
      toast.success("Payroll record updated");
      setEditEntry(null);
    } catch {
      toast.error("Failed to update payroll record");
    }
  };

  const handleDelete = async () => {
    if (!deleteEntry) return;
    try {
      await deletePayroll.mutateAsync(deleteEntry.id);
      toast.success("Payroll record deleted");
      setDeleteEntry(null);
    } catch {
      toast.error("Failed to delete payroll record");
    }
  };

  const handleMarkPaid = async (row: PayrollEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markPaid.mutateAsync({ id: row.id });
      toast.success("Marked as paid");
    } catch {
      toast.error("Failed to mark as paid");
    }
  };

  const columns: Column<PayrollEntry>[] = [
    {
      key: "staffName",
      label: "Shoulder",
      sticky: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {row.staffName}
        </span>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <Badge variant={roleVariant[row.role] ?? "default"}>
          {row.role.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "branch",
      label: "Branch",
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.branch || "—"}
        </span>
      ),
    },
    {
      key: "baseSalary",
      label: "Base Salary",
      align: "right",
      render: (row) => <span>{fmtPayroll(row.baseSalary)}</span>,
    },
    {
      key: "bonus",
      label: "Bonus",
      align: "right",
      render: (row) => (
        <span
          className={
            row.bonus > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-gray-400"
          }
        >
          {fmtPayroll(row.bonus)}
        </span>
      ),
    },
    {
      key: "deductions",
      label: "Deductions",
      align: "right",
      render: (row) => (
        <span className="text-red-500 dark:text-red-400">
          -{fmtPayroll(row.deductions)}
        </span>
      ),
    },
    {
      key: "netPay",
      label: "Net Pay",
      align: "right",
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {fmtPayroll(row.netPay)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    ...(perm.can("payroll.access")
      ? [
          {
            key: "actions" as keyof PayrollEntry,
            label: "",
            width: "100px",
            render: (row: PayrollEntry) => {
              const items: DropdownItem[] = [
                {
                  label: "Print salary sheet",
                  icon: <Printer className="h-4 w-4" />,
                  onClick: () => printSlip(row),
                },
                {
                  label: "Edit",
                  icon: <Edit className="h-4 w-4" />,
                  onClick: () => setEditEntry(row),
                },
                ...(perm.isCEO
                  ? [
                      {
                        label: "Delete",
                        icon: <Trash2 className="h-4 w-4" />,
                        onClick: () => setDeleteEntry(row),
                        variant: "danger" as const,
                      },
                    ]
                  : []),
              ];
              return (
                <div className="flex items-center gap-1">
                  {perm.isCEO && row.status !== "PAID" && (
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={markPaid.isPending}
                      onClick={(e) => handleMarkPaid(row, e)}
                    >
                      Mark Paid
                    </Button>
                  )}
                  <Dropdown items={items} />
                </div>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <PageTransition className="space-y-6">
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error instanceof Error ? error.message : "Failed to load payroll"}
        </div>
      )}

      <BranchTeamScopeNotice />

      <StatsRow
        loading={isLoading}
        items={[
          {
            title: "Total Payroll",
            value: fmtPayroll(stats.totalPayroll),
            icon: <Wallet className="h-4 w-4" />,
            iconBg:
              "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
          },
          {
            title: "Headcount",
            value: stats.headcount,
            icon: <Users className="h-4 w-4" />,
            iconBg:
              "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
          },
          {
            title: "Paid",
            value: stats.paidCount,
            icon: <CheckCircle2 className="h-4 w-4" />,
            iconBg:
              "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
          },
          {
            title: "Pending",
            value: stats.unpaidCount,
            icon: <Clock className="h-4 w-4" />,
            iconBg:
              "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
          },
          {
            title: "Total Bonus",
            value: fmtPayroll(stats.totalBonus),
            icon: <Gift className="h-4 w-4" />,
            iconBg:
              "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
          },
          {
            title: "Avg Salary",
            value: fmtPayroll(stats.avgSalary),
            icon: <TrendingUp className="h-4 w-4" />,
            iconBg:
              "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
          },
        ]}
      />

      <DataTable<PayrollEntry>
        columns={columns}
        data={paginatedEntries}
        isLoading={isLoading}
        pagination={paginationMeta}
        onPageChange={setPage}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/payroll/${row.id}`)}
        emptyTitle="No payroll records"
        emptyDescription={
          filterBranch
            ? `No payroll records for ${filterBranch} in this period.`
            : "Process payroll to create records for this period."
        }
      />

      {/* Export & Actions toolbar */}
      {filteredEntries.length > 0 && perm.can("payroll.access") && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <p className="mr-auto text-sm font-medium text-gray-700 dark:text-gray-300">
              {filterBranch ? `${filterBranch} — ` : ""}
              {filteredEntries.length} staff · {MONTHS[filterMonth - 1]}{" "}
              {filterYear}
            </p>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintBranchSheet}
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Print Salary Sheet
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSendModal(true)}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Send to Manager
            </Button>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Process Payroll"
        description="Create a new payroll record for a shoulder"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button isLoading={createPayroll.isPending} onClick={handleCreate}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Shoulder *"
            value={form.staffMemberId}
            onChange={(e) =>
              setForm((f) => ({ ...f, staffMemberId: e.target.value }))
            }
            options={[
              { label: "Select shoulder...", value: "" },
              ...staffList.map((s) => ({
                label: `${s.name} (${s.email})`,
                value: s.id,
              })),
            ]}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Month"
              value={form.month}
              onChange={(e) =>
                setForm((f) => ({ ...f, month: e.target.value }))
              }
              options={MONTHS.map((m) => ({ label: m, value: m }))}
            />
            <Select
              label="Year"
              value={String(form.year)}
              onChange={(e) =>
                setForm((f) => ({ ...f, year: Number(e.target.value) }))
              }
              options={Array.from({ length: 7 }, (_, i) => {
                const y = new Date().getFullYear() - 3 + i;
                return { label: String(y), value: String(y) };
              })}
            />
          </div>
          <Input
            label="Base Salary (BDT, ৳) *"
            type="number"
            min="0"
            placeholder="0.00"
            value={form.baseSalary}
            onChange={(e) =>
              setForm((f) => ({ ...f, baseSalary: e.target.value }))
            }
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Bonus (BDT, ৳)"
              type="number"
              min="0"
              value={form.bonus}
              onChange={(e) =>
                setForm((f) => ({ ...f, bonus: e.target.value }))
              }
            />
            <Input
              label="Deductions (BDT, ৳)"
              type="number"
              min="0"
              value={form.deductions}
              onChange={(e) =>
                setForm((f) => ({ ...f, deductions: e.target.value }))
              }
            />
          </div>
          <Select
            label="Payment Method"
            value={form.paymentMethod}
            onChange={(e) =>
              setForm((f) => ({ ...f, paymentMethod: e.target.value }))
            }
            options={[
              { label: "— Select —", value: "" },
              { label: "Bank Transfer", value: "Bank Transfer" },
              { label: "Mobile Money", value: "Mobile Money" },
              { label: "Cash", value: "Cash" },
              { label: "Cheque", value: "Cheque" },
              { label: "Other", value: "Other" },
            ]}
          />
          <Textarea
            label="Notes"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!editEntry}
        onClose={() => setEditEntry(null)}
        title="Edit Payroll"
        description={`Edit payroll for ${editEntry?.staffName}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditEntry(null)}>
              Cancel
            </Button>
            <Button isLoading={updatePayroll.isPending} onClick={handleUpdate}>
              Save Changes
            </Button>
          </>
        }
      >
        {editEntry && (
          <div className="space-y-4">
            <Input
              label="Base Salary (BDT, ৳)"
              type="number"
              min="0"
              value={String(editEntry.baseSalary)}
              onChange={(e) =>
                setEditEntry((prev) =>
                  prev ? { ...prev, baseSalary: Number(e.target.value) } : null,
                )
              }
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Bonus (BDT, ৳)"
                type="number"
                min="0"
                value={String(editEntry.bonus)}
                onChange={(e) =>
                  setEditEntry((prev) =>
                    prev ? { ...prev, bonus: Number(e.target.value) } : null,
                  )
                }
              />
              <Input
                label="Deductions (BDT, ৳)"
                type="number"
                min="0"
                value={String(editEntry.deductions)}
                onChange={(e) =>
                  setEditEntry((prev) =>
                    prev
                      ? { ...prev, deductions: Number(e.target.value) }
                      : null,
                  )
                }
              />
            </div>
            <Select
              label="Payment Method"
              value={editEntry.paymentMethod ?? ""}
              onChange={(e) =>
                setEditEntry((prev) =>
                  prev
                    ? { ...prev, paymentMethod: e.target.value || undefined }
                    : null,
                )
              }
              options={[
                { label: "— Select —", value: "" },
                { label: "Bank Transfer", value: "Bank Transfer" },
                { label: "Mobile Money", value: "Mobile Money" },
                { label: "Cash", value: "Cash" },
                { label: "Cheque", value: "Cheque" },
                { label: "Other", value: "Other" },
              ]}
            />
            <Textarea
              label="Notes"
              rows={2}
              value={editEntry.notes ?? ""}
              onChange={(e) =>
                setEditEntry((prev) =>
                  prev ? { ...prev, notes: e.target.value || undefined } : null,
                )
              }
            />
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-500">
                Net Pay:{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {fmtPayroll(
                    editEntry.baseSalary +
                      editEntry.bonus -
                      editEntry.deductions,
                  )}
                </span>
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteEntry}
        onClose={() => setDeleteEntry(null)}
        title="Delete Payroll Record"
        message={`Are you sure you want to delete the payroll record for ${deleteEntry?.staffName}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deletePayroll.isPending}
        onConfirm={handleDelete}
      />

      {printPortal}
      {branchPortal}

      {/* Send to Branch Manager modal */}
      <SendToManagerModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        entries={filteredEntries}
        branchName={filterBranch}
        month={filterMonth}
        year={filterYear}
        fmtPayroll={fmtPayroll}
      />
    </PageTransition>
  );
}

/* ─── Send to Branch Manager modal ─── */
function SendToManagerModal({
  isOpen,
  onClose,
  entries,
  branchName,
  month,
  year,
  fmtPayroll,
}: {
  isOpen: boolean;
  onClose: () => void;
  entries: PayrollEntry[];
  branchName: string;
  month: number;
  year: number;
  fmtPayroll: (n: number) => string;
}) {
  const [sending, setSending] = useState(false);
  const [managerEmail, setManagerEmail] = useState("");
  const [message, setMessage] = useState("");

  const totalNet = entries.reduce((s, e) => s + e.netPay, 0);
  const paidCount = entries.filter((e) => e.status === "PAID").length;
  const periodLabel = `${MONTHS[(month ?? 1) - 1]} ${year}`;

  const handleSend = async () => {
    if (!managerEmail.trim()) {
      toast.error("Manager email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSending(true);
    try {
      // Generate CSV content for attachment
      const csvHeader =
        "Staff Name,Role,Branch,Base Salary,Bonus,Deductions,Net Pay,Status,Payment Method";
      const csvRows = entries.map((e) =>
        [
          e.staffName,
          e.role.replace(/_/g, " "),
          e.branch,
          e.baseSalary,
          e.bonus,
          e.deductions,
          e.netPay,
          e.status,
          e.paymentMethod || "",
        ].join(","),
      );
      const csvContent = [csvHeader, ...csvRows].join("\n");

      // Download CSV as a local action (email would require backend integration)
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Payroll-${branchName || "All"}-${periodLabel}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        `Payroll report downloaded. Please send to ${managerEmail} via email.`,
        { duration: 5000 },
      );
      onClose();
      setManagerEmail("");
      setMessage("");
    } catch {
      toast.error("Failed to prepare payroll report");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Payroll to Branch Manager"
      description={`Prepare the salary report for ${branchName || "all branches"} — ${periodLabel}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={sending} onClick={handleSend}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download & Send
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Summary */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Staff
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                {entries.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Net Payroll
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {fmtPayroll(totalNet)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Paid
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                {paidCount}/{entries.length}
              </p>
            </div>
          </div>
        </div>

        <Input
          label="Branch Manager Email *"
          type="email"
          placeholder="manager@pouchcare.com"
          value={managerEmail}
          onChange={(e) => setManagerEmail(e.target.value)}
        />

        <Textarea
          label="Message (optional)"
          placeholder="Please review the attached payroll report..."
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="flex items-start gap-2 rounded-lg border border-blue-200/80 bg-blue-50/80 px-3 py-2.5 text-xs text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
          <FileSpreadsheet className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            The payroll CSV will be downloaded. You can then attach it in an
            email to the branch manager for review and approval.
          </span>
        </div>
      </div>
    </Modal>
  );
}

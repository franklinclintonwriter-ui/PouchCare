import { useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Pencil,
  Trash2,
  CircleDollarSign,
  Printer,
  type LucideIcon,
} from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import {
  usePayrollEntry,
  useMarkPayrollPaid,
  useUpdatePayroll,
  useDeletePayroll,
} from "@/api/payroll";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCurrency } from "@/hooks/useCurrency";
import { usePermission } from "@/hooks/usePermission";
import { BranchTeamScopeNotice } from "@/components/team/BranchTeamScopeNotice";
import { usePayrollSlipPrint } from "@/components/payroll/PayrollSlipPrintPortal";
import { toast } from "sonner";

const MONTH_NAMES = [
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

export default function PayrollDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perm = usePermission();
  const { formatMoney } = useCurrency();
  const fmtPayroll = (n: number) => formatMoney(n, { storedIn: "BDT" });
  const { data: entry, isLoading } = usePayrollEntry(id ?? "");
  const markPaid = useMarkPayrollPaid();
  const updatePayroll = useUpdatePayroll();
  const deletePayroll = useDeletePayroll();
  const { printSlip, portal: printPortal } = usePayrollSlipPrint();

  const canEdit = perm.can("payroll.access");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({
    baseSalary: "",
    bonus: "",
    deductions: "",
    paymentMethod: "",
    notes: "",
  });

  const openEdit = useCallback(() => {
    if (entry) {
      setForm({
        baseSalary: String(entry.baseSalary),
        bonus: String(entry.bonus),
        deductions: String(entry.deductions),
        paymentMethod: entry.paymentMethod || "",
        notes: entry.notes || "",
      });
    }
    setEditOpen(true);
  }, [entry]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await updatePayroll.mutateAsync({
        id,
        baseSalary: form.baseSalary ? Number(form.baseSalary) : undefined,
        bonus: form.bonus ? Number(form.bonus) : undefined,
        deductions: form.deductions ? Number(form.deductions) : undefined,
        paymentMethod: form.paymentMethod || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Payroll updated");
      setEditOpen(false);
    } catch {
      toast.error("Failed to update payroll");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deletePayroll.mutateAsync(id);
      toast.success("Payroll record deleted");
      navigate("/payroll");
    } catch {
      toast.error("Failed to delete payroll");
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const headerConfig = useMemo(() => {
    const actions: Array<{
      type: "button";
      label: string;
      icon?: LucideIcon;
      variant?: "outline" | "danger" | "primary";
      onClick: () => void;
    }> = [];

    if (canEdit) {
      actions.push({
        type: "button" as const,
        label: "Edit",
        icon: Pencil,
        variant: "outline" as const,
        onClick: openEdit,
      });
      actions.push({
        type: "button" as const,
        label: "Print salary sheet",
        icon: Printer,
        variant: "outline" as const,
        onClick: () => entry && printSlip(entry),
      });
    }

    if (perm.isCEO && entry?.status !== "PAID") {
      actions.push({
        type: "button" as const,
        label: "Mark as Paid",
        icon: CircleDollarSign,
        variant: "primary" as const,
        onClick: async () => {
          if (!id) return;
          try {
            await markPaid.mutateAsync({ id });
            toast.success("Marked as paid");
          } catch {
            toast.error("Failed to mark as paid");
          }
        },
      });
    }

    if (perm.isCEO) {
      actions.push({
        type: "button" as const,
        label: "Delete",
        icon: Trash2,
        variant: "danger" as const,
        onClick: () => setDeleteOpen(true),
      });
    }

    return {
      title: entry
        ? `${entry.staffName} — ${MONTH_NAMES[(entry.month ?? 1) - 1]} ${entry.year}`
        : "Payroll Detail",
      breadcrumbs: [
        { label: "Payroll", href: "/payroll" },
        { label: entry?.staffName ?? "..." },
      ],
      actions,
    };
  }, [entry, perm.isCEO, canEdit, id, openEdit, printSlip]);

  useHeaderConfig(headerConfig);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </PageTransition>
    );
  }

  if (!entry) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-gray-500">Payroll record not found</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-5">
      <BranchTeamScopeNotice />

      {/* Hero summary card */}
      <Card
        padding="none"
        className="overflow-hidden border-gray-200/90 bg-gradient-to-br from-white via-gray-50/60 to-emerald-50/20 shadow-sm ring-1 ring-gray-200/50 dark:border-gray-700/50 dark:from-gray-900 dark:via-gray-900/95 dark:to-emerald-950/15 dark:ring-gray-700/40"
      >
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {entry.staffName}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="default">{entry.role.replace(/_/g, " ")}</Badge>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {entry.branch}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {MONTH_NAMES[(entry.month ?? 1) - 1]} {entry.year}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <StatusBadge status={entry.status} />
              {entry.paymentMethod && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {entry.paymentMethod}
                </span>
              )}
              {entry.status === "PAID" && entry.paymentDate && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Paid{" "}
                  {new Date(entry.paymentDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Net Pay
            </p>
            <p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-400">
              {fmtPayroll(entry.netPay)}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Base Salary
            </p>
            <p className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100">
              {fmtPayroll(entry.baseSalary)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
              Bonus
            </p>
            <p className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              +{fmtPayroll(entry.bonus)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-500">
              Deductions
            </p>
            <p className="mt-2 text-xl font-bold text-red-500 dark:text-red-400">
              -{fmtPayroll(entry.deductions)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pay Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-sm text-gray-500">Base Salary</span>
              <span>{fmtPayroll(entry.baseSalary)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-sm text-gray-500">Bonus</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                +{fmtPayroll(entry.bonus)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-sm text-gray-500">Deductions</span>
              <span className="text-red-500 dark:text-red-400">
                -{fmtPayroll(entry.deductions)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="font-semibold">Net Pay</span>
              <span className="font-bold text-xl text-gray-900 dark:text-gray-100">
                {fmtPayroll(entry.netPay)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Payroll"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={updatePayroll.isPending} onClick={handleSave}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Base Salary (BDT, ৳)"
            type="number"
            min="0"
            step="0.01"
            value={form.baseSalary}
            onChange={set("baseSalary")}
          />
          <Input
            label="Bonus (BDT, ৳)"
            type="number"
            min="0"
            step="0.01"
            value={form.bonus}
            onChange={set("bonus")}
          />
          <Input
            label="Deductions (BDT, ৳)"
            type="number"
            min="0"
            step="0.01"
            value={form.deductions}
            onChange={set("deductions")}
          />
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
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
          />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Payroll Record"
        message={`Delete payroll record for ${entry.staffName} — ${MONTH_NAMES[(entry.month ?? 1) - 1]} ${entry.year}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deletePayroll.isPending}
        onConfirm={handleDelete}
      />

      {printPortal}
    </PageTransition>
  );
}

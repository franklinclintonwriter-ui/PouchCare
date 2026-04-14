import { useMemo, useState } from "react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import {
  useCreateRevenue,
  useDeleteRevenue,
  useRevenue,
  useUpdateRevenue,
} from "@/api/finance";
import { PageTransition } from "@/components/ui/PageTransition";
import { StatsRow } from "@/components/shared/StatsRow";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useCurrency } from "@/hooks/useCurrency";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import type { MonthlyRevenue } from "@/types/models";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";

export default function Revenue() {
  const { formatCurrency, symbol, convert } = useCurrency();
  const { data: months, isLoading } = useRevenue();
  const createRevenue = useCreateRevenue();
  const updateRevenue = useUpdateRevenue();
  const deleteRevenue = useDeleteRevenue();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<MonthlyRevenue | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MonthlyRevenue | null>(null);
  const [form, setForm] = useState({
    month: "",
    year: String(new Date().getFullYear()),
    revenue: "",
    expenses: "",
    notes: "",
  });
  const revenueData = useMemo(() => months ?? [], [months]);

  const stats = useMemo(() => {
    if (!revenueData.length)
      return { totalRev: 0, totalExp: 0, netProfit: 0, avgMargin: 0 };
    const totalRev = revenueData.reduce((s, m) => s + m.revenue, 0);
    const totalExp = revenueData.reduce((s, m) => s + m.expenses, 0);
    const netProfit = totalRev - totalExp;
    const avgMargin =
      totalRev > 0 ? Math.round((netProfit / totalRev) * 100) : 0;
    return { totalRev, totalExp, netProfit, avgMargin };
  }, [revenueData]);

  useHeaderConfig({
    title: "Revenue",
    breadcrumbs: [{ label: "Finance" }, { label: "Revenue" }],
    actions: [
      {
        type: "button" as const,
        label: "Add Revenue",
        icon: Plus,
        onClick: () => {
          setEditing(null);
          setForm({
            month: "",
            year: String(new Date().getFullYear()),
            revenue: "",
            expenses: "",
            notes: "",
          });
          setIsOpen(true);
        },
      },
    ],
  });

  const columns: Column<MonthlyRevenue>[] = [
    {
      key: "month",
      label: "Month",
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {row.month}
          {row.year ? ` ${row.year}` : ""}
        </span>
      ),
    },
    {
      key: "revenue",
      label: "Revenue",
      align: "right",
      render: (row) => (
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.revenue)}
        </span>
      ),
    },
    {
      key: "expenses",
      label: "Expenses",
      align: "right",
      render: (row) => (
        <span className="font-medium text-red-500 dark:text-red-400">
          {formatCurrency(row.expenses)}
        </span>
      ),
    },
    {
      key: "profit",
      label: "Profit",
      align: "right",
      render: (row) => (
        <span
          className={`font-semibold ${row.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}
        >
          {formatCurrency(row.profit)}
        </span>
      ),
    },
    {
      key: "margin",
      label: "Margin",
      align: "right",
      render: (row) => {
        const margin =
          row.revenue > 0 ? Math.round((row.profit / row.revenue) * 100) : 0;
        return (
          <span className="text-gray-600 dark:text-gray-400">{margin}%</span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(row);
              setForm({
                month: row.month,
                year: String(row.year ?? new Date().getFullYear()),
                revenue: String(row.revenue),
                expenses: String(row.expenses),
                notes: row.notes ?? "",
              });
              setIsOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500 hover:text-red-600"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageTransition className="space-y-6">
      <StatsRow
        loading={isLoading}
        items={[
          {
            title: "Total Revenue",
            value: formatCurrency(stats.totalRev),
            icon: <TrendingUp className="h-4 w-4" />,
            iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
          },
          {
            title: "Total Expenses",
            value: formatCurrency(stats.totalExp),
            icon: <TrendingDown className="h-4 w-4" />,
            iconBg: "bg-red-100 dark:bg-red-900/30",
          },
          {
            title: "Net Profit",
            value: formatCurrency(stats.netProfit),
            icon: <DollarSign className="h-4 w-4" />,
            iconBg: "bg-blue-100 dark:bg-blue-900/30",
          },
          {
            title: "Avg Margin",
            value: `${stats.avgMargin}%`,
            icon: <Percent className="h-4 w-4" />,
            iconBg: "bg-purple-100 dark:bg-purple-900/30",
          },
        ]}
      />

      <Card padding="none">
        <div className="p-4 sm:p-5">
          <CardHeader>
            <CardTitle>Monthly Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-gray-200 dark:stroke-gray-700"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    className="text-gray-500"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => {
                      const converted = convert(v) ?? v;
                      return `${symbol}${(converted / 1000).toFixed(0)}k`;
                    }}
                    className="text-gray-500"
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      fontSize: "13px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </div>
      </Card>

      <DataTable<MonthlyRevenue>
        columns={columns}
        data={revenueData}
        isLoading={isLoading}
        getRowId={(row) => row.id ?? `${row.month}-${row.year ?? "na"}`}
        emptyTitle="No revenue data"
        emptyDescription="Add monthly revenue records to start tracking."
      />

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit Revenue Entry" : "Add Revenue Entry"}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              isLoading={createRevenue.isPending || updateRevenue.isPending}
              onClick={async () => {
                if (!form.month.trim() || !form.year || !form.revenue) {
                  toast.error("Month, year, and revenue are required");
                  return;
                }
                const payload = {
                  month: form.month.trim(),
                  year: Number(form.year),
                  totalRevenueUsd: Number(form.revenue),
                  totalExpensesUsd: form.expenses ? Number(form.expenses) : 0,
                  notes: form.notes || undefined,
                };
                try {
                  if (editing?.id) {
                    await updateRevenue.mutateAsync({
                      id: editing.id,
                      ...payload,
                    });
                    toast.success("Revenue entry updated");
                  } else {
                    await createRevenue.mutateAsync(payload);
                    toast.success("Revenue entry created");
                  }
                  setIsOpen(false);
                  setEditing(null);
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Failed to save revenue entry",
                  );
                }
              }}
            >
              {editing ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Month"
            placeholder="Apr"
            value={form.month}
            onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
          />
          <Input
            label="Year"
            type="number"
            value={form.year}
            onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
          />
          <Input
            label="Revenue (USD)"
            type="number"
            value={form.revenue}
            onChange={(e) =>
              setForm((f) => ({ ...f, revenue: e.target.value }))
            }
          />
          <Input
            label="Expenses (USD)"
            type="number"
            value={form.expenses}
            onChange={(e) =>
              setForm((f) => ({ ...f, expenses: e.target.value }))
            }
          />
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Revenue Entry"
        message={`Delete revenue entry for ${deleteTarget?.month ?? ""}${deleteTarget?.year ? ` ${deleteTarget.year}` : ""}?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteRevenue.isPending}
        onConfirm={async () => {
          if (!deleteTarget?.id) {
            toast.error("Cannot delete legacy row without id");
            return;
          }
          try {
            await deleteRevenue.mutateAsync(deleteTarget.id);
            toast.success("Revenue entry deleted");
            setDeleteTarget(null);
          } catch (err) {
            toast.error(
              err instanceof Error
                ? err.message
                : "Failed to delete revenue entry",
            );
          }
        }}
      />
    </PageTransition>
  );
}

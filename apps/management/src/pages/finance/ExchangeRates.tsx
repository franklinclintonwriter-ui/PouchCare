import { useMemo, useState } from "react";
import {
  Banknote,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Building2,
  Users,
  History,
  BarChart3,
  Radio,
} from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import {
  useCreateExchangeRate,
  useDeleteExchangeRate,
  useExchangeRates,
  useExchangeRatesSummary,
  useUpdateExchangeRate,
  useBranches,
} from "@/api/admin-resources";
import type { ExchangeRate } from "@/api/admin-resources";
import { PageTransition } from "@/components/ui/PageTransition";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/utils/cn";
import { toast } from "sonner";

function formatDt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatNum(n: number | null | undefined, digits = 4) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export default function ExchangeRates() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [usdToBdt, setUsdToBdt] = useState("");
  const [usdToAed, setUsdToAed] = useState("");
  const [bdtToAed, setBdtToAed] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [notes, setNotes] = useState("");
  const [branchId, setBranchId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExchangeRate | null>(null);

  const { data, isLoading } = useExchangeRates({ page, limit: 20 });
  const { data: summary, isLoading: summaryLoading } = useExchangeRatesSummary();
  const { data: branchesData } = useBranches({ page: 1, limit: 200 });
  const createRate = useCreateExchangeRate();
  const updateRate = useUpdateExchangeRate();
  const deleteRate = useDeleteExchangeRate();

  const branchOptions = useMemo(() => {
    const rows = branchesData?.data ?? [];
    return [
      { label: "Organization-wide (all branches)", value: "" },
      ...rows.map((b) => ({ label: b.name, value: b.id })),
    ];
  }, [branchesData?.data]);

  const latestId = summary?.latest?.id;

  useHeaderConfig(
    useMemo(
      () => ({
        title: "Exchange Rates",
        breadcrumbs: [
          { label: "Home", href: "/" },
          { label: "Finance" },
          { label: "Exchange Rates" },
        ],
        actions: [
          {
            type: "button" as const,
            label: "Add rate",
            icon: Plus,
            onClick: () => {
              setEditingId(null);
              setUsdToBdt("");
              setUsdToAed("");
              setBdtToAed("");
              setEffectiveDate("");
              setNotes("");
              setBranchId("");
              setOpen(true);
            },
          },
        ],
      }),
      [],
    ),
  );

  const change = summary?.changePercentVsPrevious;
  const changePositive = change != null && change >= 0;

  const columns: Column<ExchangeRate>[] = [
    {
      key: "status",
      label: "",
      render: (r) =>
        r.id === latestId ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            <Radio className="h-3 w-3" aria-hidden />
            Active
          </span>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
        ),
    },
    {
      key: "effectiveDate",
      label: "Effective",
      render: (r) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {new Date(r.effectiveDate).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "usdToBdt",
      label: "USD → BDT",
      align: "right",
      render: (r) => (
        <span className="tabular-nums font-semibold">{formatNum(r.usdToBdt)}</span>
      ),
    },
    {
      key: "usdToAed",
      label: "USD → AED",
      align: "right",
      render: (r) => formatNum(r.usdToAed ?? null),
    },
    {
      key: "bdtToAed",
      label: "BDT → AED",
      align: "right",
      render: (r) => formatNum(r.bdtToAed ?? null),
    },
    {
      key: "branch",
      label: "Branch",
      render: (r) =>
        r.branch ? (
          <span className="flex items-center gap-1.5 text-sm">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
            <span className="truncate">{r.branch.name}</span>
          </span>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">All branches</span>
        ),
    },
    {
      key: "recorded",
      label: "Recorded by",
      render: (r) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {r.createdBy?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "updated",
      label: "Last update",
      render: (r) => (
        <div className="text-xs leading-snug">
          <div className="text-gray-900 dark:text-gray-100">
            {r.updatedBy?.name ?? r.createdBy?.name ?? "—"}
          </div>
          <div className="text-gray-500 dark:text-gray-400">{formatDt(r.updatedAt)}</div>
        </div>
      ),
    },
    {
      key: "notes",
      label: "Notes",
      render: (r) => (
        <span className="line-clamp-2 max-w-[180px] text-xs text-gray-600 dark:text-gray-400">
          {r.notes?.trim() || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setEditingId(row.id);
              setEffectiveDate(row.effectiveDate.slice(0, 10));
              setUsdToBdt(String(row.usdToBdt));
              setUsdToAed(row.usdToAed != null ? String(row.usdToAed) : "");
              setBdtToAed(row.bdtToAed != null ? String(row.bdtToAed) : "");
              setNotes(row.notes ?? "");
              setBranchId(row.branchId ?? "");
              setOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
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
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const timelineRows = (data?.data ?? []).slice(0, 8);

  return (
    <PageTransition className="space-y-6">
      {/* Analytics strip */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="overflow-hidden border-primary-200/60 bg-gradient-to-br from-primary-50/90 to-white dark:border-primary-900/40 dark:from-primary-950/40 dark:to-gray-900">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium text-primary-900/80 dark:text-primary-100/90">
                Current rate
              </CardTitle>
              <Badge variant="success" size="sm" className="shrink-0">
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            {summaryLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <>
                <p className="text-3xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-white">
                  {summary?.latest
                    ? formatNum(summary.latest.usdToBdt)
                    : "—"}{" "}
                  <span className="text-base font-semibold text-gray-500 dark:text-gray-400">
                    BDT
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Effective{" "}
                  {summary?.latest
                    ? new Date(summary.latest.effectiveDate).toLocaleDateString()
                    : "—"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <BarChart3 className="h-4 w-4 text-primary-500" aria-hidden />
              vs previous posting
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            {summaryLoading ? (
              <Skeleton className="h-10 w-28" />
            ) : change != null ? (
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "text-2xl font-bold tabular-nums",
                    changePositive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {changePositive ? "+" : ""}
                  {change.toFixed(2)}%
                </span>
                {changePositive ? (
                  <TrendingUp className="h-5 w-5 text-emerald-500" aria-hidden />
                ) : (
                  <TrendingDown className="h-5 w-5 text-amber-500" aria-hidden />
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Not enough history yet</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Compares the two most recent effective dates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Historical range (USD→BDT)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pb-4 pt-0 text-sm">
            {summaryLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Min</span>
                  <span className="tabular-nums font-medium">{formatNum(summary?.minUsdToBdt)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Max</span>
                  <span className="tabular-nums font-medium">{formatNum(summary?.maxUsdToBdt)}</span>
                </div>
                <div className="flex justify-between gap-2 border-t border-gray-100 pt-2 dark:border-gray-800">
                  <span className="text-gray-500">Average</span>
                  <span className="tabular-nums font-semibold text-gray-900 dark:text-gray-100">
                    {formatNum(summary?.avgUsdToBdt)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <Users className="h-4 w-4 text-primary-500" aria-hidden />
              Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-4 pt-0 text-sm">
            {summaryLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rate records</span>
                  <span className="font-semibold tabular-nums">{summary?.totalRows ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Branches in network</span>
                  <span className="font-semibold tabular-nums">{summary?.totalBranches ?? 0}</span>
                </div>
                <p className="text-xs leading-snug text-gray-500 dark:text-gray-400">
                  Optional branch tags clarify which office posted a rate; untagged rows apply organization-wide.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Registry
            </h2>
          </div>
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            pagination={data?.meta}
            onPageChange={setPage}
            emptyIcon={<Banknote />}
            emptyTitle="No exchange rates"
            emptyDescription="Create a rate to drive finance conversions. Each save is attributed to the signed-in shoulder."
          />
        </div>

        <Card className="h-fit border-gray-200/80 dark:border-gray-800">
          <CardHeader className="border-b border-gray-100 pb-3 dark:border-gray-800">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-5 w-5 text-primary-500" aria-hidden />
              Update history
            </CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Recent postings (newest first). Active matches the latest effective schedule.
            </p>
          </CardHeader>
          <CardContent className="max-h-[min(520px,70vh)] space-y-0 overflow-y-auto pt-4 scrollbar-thin">
            {isLoading && !timelineRows.length ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : timelineRows.length === 0 ? (
              <p className="text-sm text-gray-500">No history to show.</p>
            ) : (
              <ul className="relative space-y-0 border-l border-gray-200 pl-4 dark:border-gray-700">
                {timelineRows.map((row) => (
                  <li key={row.id} className="relative pb-6 last:pb-0">
                    <span
                      className={cn(
                        "absolute -left-[21px] top-1.5 flex h-3 w-3 rounded-full border-2 border-white bg-gray-300 dark:border-gray-950 dark:bg-gray-600",
                        row.id === latestId && "bg-emerald-500 ring-2 ring-emerald-500/30",
                      )}
                    />
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatNum(row.usdToBdt)} BDT{" "}
                          <span className="font-normal text-gray-500">per USD</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Effective {new Date(row.effectiveDate).toLocaleDateString()}
                        </p>
                      </div>
                      {row.id === latestId && (
                        <Badge variant="success" size="sm">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
                      <p>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Recorded:</span>{" "}
                        {row.createdBy?.name ?? "—"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Last edit:</span>{" "}
                        {row.updatedBy?.name ?? row.createdBy?.name ?? "—"} · {formatDt(row.updatedAt)}
                      </p>
                      {row.branch && (
                        <p className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" aria-hidden />
                          {row.branch.name}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit exchange rate" : "Add exchange rate"}
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOpen(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              isLoading={createRate.isPending || updateRate.isPending}
              onClick={async () => {
                if (!usdToBdt || !effectiveDate)
                  return toast.error("USD→BDT and effective date are required");
                try {
                  const payload = {
                    usdToBdt: Number(usdToBdt),
                    usdToAed: usdToAed ? Number(usdToAed) : undefined,
                    bdtToAed: bdtToAed ? Number(bdtToAed) : undefined,
                    effectiveDate,
                    notes: notes.trim() || undefined,
                    branchId: branchId.trim() !== "" ? branchId : null,
                  };
                  if (editingId) {
                    await updateRate.mutateAsync({ id: editingId, ...payload });
                  } else {
                    await createRate.mutateAsync(payload);
                  }
                  setOpen(false);
                  setEditingId(null);
                  setUsdToBdt("");
                  setUsdToAed("");
                  setBdtToAed("");
                  setEffectiveDate("");
                  setNotes("");
                  setBranchId("");
                  toast.success(editingId ? "Exchange rate updated" : "Exchange rate saved");
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : `Failed to ${editingId ? "update" : "save"} exchange rate`,
                  );
                }
              }}
            >
              {editingId ? "Save changes" : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            type="date"
            label="Effective date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
          />
          <Input
            type="number"
            step="0.0001"
            label="USD → BDT"
            value={usdToBdt}
            onChange={(e) => setUsdToBdt(e.target.value)}
          />
          <Input
            type="number"
            step="0.0001"
            label="USD → AED"
            value={usdToAed}
            onChange={(e) => setUsdToAed(e.target.value)}
          />
          <Input
            type="number"
            step="0.0001"
            label="BDT → AED"
            value={bdtToAed}
            onChange={(e) => setBdtToAed(e.target.value)}
          />
          <Select
            label="Branch (optional)"
            options={branchOptions}
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          />
          <Textarea
            label="Notes (source, approval, context)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Central bank reference, CFO approval, Dubai office revision…"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Saves are attributed to your signed-in account for audit. Leave branch empty when the rate applies to every location.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete exchange rate"
        message={`Delete the rate effective on ${deleteTarget ? new Date(deleteTarget.effectiveDate).toLocaleDateString() : ""}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteRate.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteRate.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
            toast.success("Exchange rate deleted");
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Failed to delete exchange rate",
            );
          }
        }}
      />
    </PageTransition>
  );
}

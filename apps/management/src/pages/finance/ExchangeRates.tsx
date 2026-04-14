import { useMemo, useState } from "react";
import { Banknote, Pencil, Plus, Trash2 } from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import {
  useCreateExchangeRate,
  useDeleteExchangeRate,
  useExchangeRates,
  useUpdateExchangeRate,
} from "@/api/admin-resources";
import { PageTransition } from "@/components/ui/PageTransition";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ExchangeRate } from "@/api/admin-resources";
import { toast } from "sonner";

export default function ExchangeRates() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [usdToBdt, setUsdToBdt] = useState("");
  const [usdToAed, setUsdToAed] = useState("");
  const [bdtToAed, setBdtToAed] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExchangeRate | null>(null);

  const { data, isLoading } = useExchangeRates({ page, limit: 20 });
  const createRate = useCreateExchangeRate();
  const updateRate = useUpdateExchangeRate();
  const deleteRate = useDeleteExchangeRate();

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
            label: "Add Rate",
            icon: Plus,
            onClick: () => setOpen(true),
          },
        ],
      }),
      [],
    ),
  );

  const columns: Column<ExchangeRate>[] = [
    {
      key: "effectiveDate",
      label: "Effective Date",
      render: (r) => new Date(r.effectiveDate).toLocaleDateString(),
    },
    { key: "usdToBdt", label: "USD -> BDT", align: "right" },
    {
      key: "usdToAed",
      label: "USD -> AED",
      align: "right",
      render: (r) => r.usdToAed ?? "-",
    },
    {
      key: "bdtToAed",
      label: "BDT -> AED",
      align: "right",
      render: (r) => r.bdtToAed ?? "-",
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
            onClick={(e) => {
              e.stopPropagation();
              setEditingId(row.id);
              setEffectiveDate(row.effectiveDate.slice(0, 10));
              setUsdToBdt(String(row.usdToBdt));
              setUsdToAed(row.usdToAed != null ? String(row.usdToAed) : "");
              setBdtToAed(row.bdtToAed != null ? String(row.bdtToAed) : "");
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

  return (
    <PageTransition>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        pagination={data?.meta}
        onPageChange={setPage}
        emptyIcon={<Banknote />}
        emptyTitle="No exchange rates"
        emptyDescription="Create rates to support finance conversion flows."
      />

      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit Exchange Rate" : "Add Exchange Rate"}
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
                  return toast.error(
                    "USD->BDT and effective date are required",
                  );
                try {
                  const payload = {
                    usdToBdt: Number(usdToBdt),
                    usdToAed: usdToAed ? Number(usdToAed) : undefined,
                    bdtToAed: bdtToAed ? Number(bdtToAed) : undefined,
                    effectiveDate,
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
                  toast.success(
                    editingId ? "Exchange rate updated" : "Exchange rate saved",
                  );
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : `Failed to ${editingId ? "update" : "save"} exchange rate`,
                  );
                }
              }}
            >
              {editingId ? "Update" : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            type="date"
            label="Effective Date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
          />
          <Input
            type="number"
            step="0.0001"
            label="USD -> BDT"
            value={usdToBdt}
            onChange={(e) => setUsdToBdt(e.target.value)}
          />
          <Input
            type="number"
            step="0.0001"
            label="USD -> AED"
            value={usdToAed}
            onChange={(e) => setUsdToAed(e.target.value)}
          />
          <Input
            type="number"
            step="0.0001"
            label="BDT -> AED"
            value={bdtToAed}
            onChange={(e) => setBdtToAed(e.target.value)}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Exchange Rate"
        message={`Delete exchange rate effective on ${deleteTarget ? new Date(deleteTarget.effectiveDate).toLocaleDateString() : ""}?`}
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
              err instanceof Error
                ? err.message
                : "Failed to delete exchange rate",
            );
          }
        }}
      />
    </PageTransition>
  );
}

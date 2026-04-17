/**
 * Wallet — balance cards, deposit request form, transaction history.
 * Route: /dashboard/wallet
 *
 * Migrated (Week 6) to the full UI-kit set:
 *   - Deposit form: react-hook-form + Zod + FormField + Select + ConfirmDialog.
 *     Client-side URL validation on the proof URL. Per-method `<HelpText>`
 *     so the user knows what goes in the proof field.
 *   - Transactions: DataTable + real Pagination.
 *   - Helper `transactionColor()` extracted (audit §P2).
 */
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Wallet as WalletIcon } from "lucide-react";
import {
  usePortalWallet,
  usePortalWalletTransactions,
  useDepositRequest,
} from "@/api/portal-dashboard";
import { formatUsd, formatDate } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Button,
  ConfirmDialog,
  DataTable,
  FormField,
  HelpText,
  Input,
  Select,
  type DataTableColumn,
} from "@/components/ui";

const PAGE_SIZE = 20;

// Method-specific hint copy; drives the help line under the proof URL field.
const METHOD_OPTIONS = [
  {
    value: "USDT_TRC20",
    label: "USDT (TRC20)",
    hint: "Paste the blockchain explorer link (e.g. Tronscan) for the transfer.",
  },
  {
    value: "PAYONEER",
    label: "Payoneer",
    hint: "Paste a screenshot link or transaction reference from your Payoneer account.",
  },
  {
    value: "BINANCE",
    label: "Binance",
    hint: "Paste a screenshot or transaction ID from your Binance account.",
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank transfer",
    hint: "Paste a screenshot of the transfer receipt.",
  },
  {
    value: "CASH",
    label: "Cash",
    hint: "Paste a receipt photo link if available.",
  },
] as const;
type MethodValue = (typeof METHOD_OPTIONS)[number]["value"];

const schema = z.object({
  amountUsd: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .positive("Amount must be greater than 0")
    .max(100_000, "Amount is too large"),
  method: z.enum([
    "USDT_TRC20",
    "PAYONEER",
    "BINANCE",
    "BANK_TRANSFER",
    "CASH",
  ]),
  proofUrl: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^https?:\/\/\S+$/i.test(v),
      "Must be a valid http(s) URL",
    ),
});
type FormValues = z.infer<typeof schema>;

function transactionColor(amount: number): string {
  return amount < 0
    ? "text-red-600 dark:text-red-400"
    : "text-emerald-700 dark:text-emerald-300";
}

interface WalletTx {
  id: string;
  type: string;
  transactionDate: string;
  status: string;
  amountUsd: number;
}

export default function WalletPage() {
  const wallet = usePortalWallet();
  const [page, setPage] = useState(1);
  const txs = usePortalWalletTransactions(page, PAGE_SIZE);
  const deposit = useDepositRequest();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<FormValues | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { method: "USDT_TRC20", proofUrl: "" },
    mode: "onBlur",
  });

  const selectedMethod = watch("method") as MethodValue;
  const methodOption = METHOD_OPTIONS.find((m) => m.value === selectedMethod);

  const onSubmit = (values: FormValues) => {
    setConfirmData(values);
    setConfirmOpen(true);
  };

  const actuallyDeposit = async () => {
    if (!confirmData) return;
    try {
      await deposit.mutateAsync({
        amountUsd: confirmData.amountUsd,
        paymentMethod: confirmData.method,
        proofUrl: confirmData.proofUrl || undefined,
      });
      toast.success("Deposit request submitted");
      reset({ amountUsd: undefined as any, method: "USDT_TRC20", proofUrl: "" });
      setConfirmOpen(false);
      setConfirmData(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit deposit");
    }
  };

  const w = wallet.data;

  const columns: DataTableColumn<WalletTx>[] = useMemo(
    () => [
      {
        key: "date",
        header: "Date",
        cell: (t) => (
          <span className="text-gray-600 dark:text-gray-400">
            {formatDate(t.transactionDate)}
          </span>
        ),
      },
      {
        key: "type",
        header: "Type",
        cell: (t) => (
          <span className="text-gray-900 dark:text-gray-100">
            {t.type.replace(/_/g, " ")}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (t) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{t.status}</span>
        ),
      },
      {
        key: "amountUsd",
        header: "Amount",
        align: "right",
        cell: (t) => (
          <span
            className={`font-semibold tabular-nums ${transactionColor(t.amountUsd)}`}
          >
            {formatUsd(t.amountUsd)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Balance"
          value={wallet.isLoading ? "…" : formatUsd(w?.walletBalance ?? 0)}
        />
        <StatCard
          label="Total deposited"
          value={wallet.isLoading ? "…" : formatUsd(w?.totalDeposited ?? 0)}
        />
        <StatCard
          label="Total spent"
          value={wallet.isLoading ? "…" : formatUsd(w?.totalSpent ?? 0)}
        />
      </div>

      <DashboardPanel
        title="Request deposit"
        description="Submit a deposit for operations to approve. You’ll see it in transactions when confirmed."
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          noValidate
        >
          <FormField label="Amount (USD)" required error={errors.amountUsd?.message}>
            {({ id, "aria-describedby": desc, "aria-invalid": inv, "aria-required": req }) => (
              <Input
                id={id}
                type="number"
                min={1}
                step="0.01"
                aria-describedby={desc}
                aria-invalid={inv}
                aria-required={req}
                error={!!errors.amountUsd}
                {...register("amountUsd", { valueAsNumber: true })}
              />
            )}
          </FormField>

          <FormField label="Method" required>
            {({ id }) => (
              <Select id={id} {...register("method")}>
                {METHOD_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField
            label="Proof URL"
            showOptional
            error={errors.proofUrl?.message}
            className="sm:col-span-2"
            help={methodOption ? <HelpText>{methodOption.hint}</HelpText> : undefined}
          >
            {({ id, "aria-describedby": desc, "aria-invalid": inv }) => (
              <Input
                id={id}
                type="url"
                placeholder="https://…"
                aria-describedby={desc}
                aria-invalid={inv}
                error={!!errors.proofUrl}
                {...register("proofUrl")}
              />
            )}
          </FormField>

          <div className="sm:col-span-2 lg:col-span-4">
            <Button
              type="submit"
              className="w-full touch-manipulation sm:w-auto"
              disabled={deposit.isPending}
            >
              {deposit.isPending ? "Submitting…" : "Submit deposit request"}
            </Button>
          </div>
        </form>
      </DashboardPanel>

      <DashboardPanel title="Transactions">
        <DataTable<WalletTx>
          columns={columns}
          data={(txs.data?.items ?? []) as WalletTx[]}
          getRowId={(t) => t.id}
          isLoading={txs.isLoading}
          isError={txs.isError}
          error={txs.error}
          onRetry={() => txs.refetch()}
          empty={{
            icon: <WalletIcon />,
            title: "No transactions yet",
            description: "When you deposit or spend, transactions will appear here.",
          }}
          pagination={{
            page,
            pageSize: PAGE_SIZE,
            total: txs.data?.meta?.total ?? 0,
            onChange: setPage,
          }}
        />
      </DashboardPanel>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void actuallyDeposit()}
        title="Confirm deposit request"
        description={
          confirmData
            ? `Submit a deposit request for ${formatUsd(confirmData.amountUsd)} via ${METHOD_OPTIONS.find((m) => m.value === confirmData.method)?.label}?`
            : "Submit this deposit request?"
        }
        confirmLabel="Submit request"
        loading={deposit.isPending}
      />
    </div>
  );
}

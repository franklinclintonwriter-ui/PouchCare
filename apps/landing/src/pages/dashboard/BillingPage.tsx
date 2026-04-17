/**
 * Billing — commission payout request + ledger + payout history.
 * Route: /dashboard/billing
 *
 * Migrated (Week 6) to the full UI-kit set:
 *   - Payout form: react-hook-form + Zod + FormField + Select + Textarea.
 *     Client-side regex per method (TRC20 address, Payoneer email, BD bank).
 *     Dynamic help text per method.
 *   - Commission ledger + Payout history: DataTable + real Pagination.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Coins, Wallet } from "lucide-react";
import {
  useCommissionSummary,
  useCommissions,
  usePayoutHistory,
  usePayoutRequest,
} from "@/api/portal-dashboard";
import { formatUsd, formatDateShort } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Badge,
  Button,
  DataTable,
  FormField,
  HelpText,
  Input,
  Select,
  Textarea,
  type DataTableColumn,
} from "@/components/ui";

const MIN_PAYOUT = 50;
const COMM_PAGE_SIZE = 20;
const PAYOUT_PAGE_SIZE = 20;

// Per-method validation + help copy.
// - TRC20: base58 check not exhaustive, but catches the common typos.
// - Payoneer: email format.
// - Bank transfer: free-form, but require at least 20 chars so users remember
//   to include the account + bank name + branch + routing data.
const METHODS = [
  {
    value: "USDT_TRC20",
    label: "USDT (TRC20)",
    placeholder: "Paste your TRC20 wallet address (starts with T)",
    hint: "Wallet address should start with T and be 34 characters long.",
    detailsSchema: z
      .string()
      .trim()
      .regex(/^T[A-Za-z0-9]{33}$/, "Not a valid TRC20 wallet address"),
  },
  {
    value: "PAYONEER",
    label: "Payoneer",
    placeholder: "Your Payoneer account email",
    hint: "Use the email tied to your Payoneer account.",
    detailsSchema: z.string().trim().email("Enter a valid email address"),
  },
  {
    value: "BINANCE",
    label: "Binance (USDT)",
    placeholder: "Binance Pay ID or email",
    hint: "Binance Pay ID or the email tied to your Binance account.",
    detailsSchema: z.string().trim().min(6, "Enter your Binance Pay ID or email"),
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank transfer",
    placeholder:
      "Account holder name, account #, bank, branch, routing / IBAN / SWIFT…",
    hint: "Include account holder name, account number, bank name, branch, and routing / IBAN / SWIFT.",
    detailsSchema: z
      .string()
      .trim()
      .min(20, "Please include full bank details (min 20 chars)"),
  },
] as const;
type MethodValue = (typeof METHODS)[number]["value"];

// Helper — returns the details schema for the selected method (defaults to
// non-empty when a method is unknown, though the enum below prevents that).
function detailsSchemaFor(method: MethodValue): z.ZodString {
  return (
    METHODS.find((m) => m.value === method)?.detailsSchema ??
    z.string().trim().min(1, "Required")
  );
}

const schema = z
  .object({
    amountUsd: z.coerce
      .number({ invalid_type_error: "Enter a valid amount" })
      .min(MIN_PAYOUT, `Minimum payout is $${MIN_PAYOUT}`)
      .max(1_000_000, "Amount is too large"),
    method: z.enum(["USDT_TRC20", "PAYONEER", "BINANCE", "BANK_TRANSFER"]),
    details: z.string().min(1, "Add payment details"),
  })
  .superRefine((values, ctx) => {
    const schema = detailsSchemaFor(values.method);
    const res = schema.safeParse(values.details);
    if (!res.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["details"],
        message: res.error.errors[0]?.message ?? "Invalid payment details",
      });
    }
  });
type FormValues = z.infer<typeof schema>;

interface CommissionRow {
  id: string;
  createdAt: string;
  referredMemberName?: string | null;
  status: string;
  commissionAmountUsd: number;
}

interface PayoutRow {
  id: string;
  requestedDate: string;
  paymentMethod: string;
  status: string;
  amountUsd: number;
}

export default function BillingPage() {
  const summary = useCommissionSummary();
  const [commPage, setCommPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const comm = useCommissions(commPage, COMM_PAGE_SIZE);
  const payouts = usePayoutHistory(payoutPage, PAYOUT_PAGE_SIZE);
  const payoutReq = usePayoutRequest();

  const s = summary.data;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { method: "USDT_TRC20", details: "" },
    mode: "onBlur",
  });

  const method = watch("method") as MethodValue;
  const methodSpec = METHODS.find((m) => m.value === method) ?? METHODS[0];

  const onSubmit = async (values: FormValues) => {
    try {
      await payoutReq.mutateAsync({
        amountUsd: values.amountUsd,
        paymentMethod: values.method,
        paymentDetails: values.details.trim(),
      });
      toast.success("Payout request submitted");
      reset({ amountUsd: undefined as any, method: "USDT_TRC20", details: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    }
  };

  const commissionColumns: DataTableColumn<CommissionRow>[] = [
    {
      key: "date",
      header: "Date",
      cell: (c) => (
        <span className="text-gray-600 dark:text-gray-400">{formatDateShort(c.createdAt)}</span>
      ),
    },
    {
      key: "referral",
      header: "Referral",
      cell: (c) => <span>{c.referredMemberName ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (c) => <Badge variant="slate">{c.status.replace(/_/g, " ")}</Badge>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (c) => (
        <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
          {formatUsd(c.commissionAmountUsd)}
        </span>
      ),
    },
  ];

  const payoutColumns: DataTableColumn<PayoutRow>[] = [
    {
      key: "requestedDate",
      header: "Requested",
      cell: (p) => (
        <span className="text-gray-600 dark:text-gray-400">
          {formatDateShort(p.requestedDate)}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      cell: (p) => <span>{p.paymentMethod.replace(/_/g, " ")}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (p) => <span className="text-sm">{p.status}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (p) => (
        <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
          {formatUsd(p.amountUsd)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Available"
          value={summary.isLoading ? "…" : formatUsd(s?.available ?? 0)}
        />
        <StatCard
          label="Pending hold"
          value={summary.isLoading ? "…" : formatUsd(s?.pending ?? 0)}
        />
        <StatCard
          label="Paid out"
          value={summary.isLoading ? "…" : formatUsd(s?.paidOut ?? 0)}
        />
        <StatCard
          label="Lifetime"
          value={summary.isLoading ? "…" : formatUsd(s?.total ?? 0)}
        />
      </div>

      <DashboardPanel
        title="Request payout"
        description={`Minimum ${formatUsd(MIN_PAYOUT)} from available commission balance.`}
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
                min={MIN_PAYOUT}
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
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField
            label="Payment details"
            required
            error={errors.details?.message}
            className="sm:col-span-2"
            help={<HelpText>{methodSpec.hint}</HelpText>}
          >
            {({ id, "aria-describedby": desc, "aria-invalid": inv, "aria-required": req }) => (
              <Textarea
                id={id}
                rows={3}
                placeholder={methodSpec.placeholder}
                aria-describedby={desc}
                aria-invalid={inv}
                aria-required={req}
                error={!!errors.details}
                {...register("details")}
              />
            )}
          </FormField>

          <div className="sm:col-span-2 lg:col-span-4">
            <Button
              type="submit"
              className="w-full touch-manipulation sm:w-auto"
              disabled={payoutReq.isPending}
            >
              {payoutReq.isPending ? "Submitting…" : "Submit payout request"}
            </Button>
          </div>
        </form>
      </DashboardPanel>

      <DashboardPanel title="Commission ledger">
        <DataTable<CommissionRow>
          columns={commissionColumns}
          data={(comm.data?.items ?? []) as CommissionRow[]}
          getRowId={(c) => c.id}
          isLoading={comm.isLoading}
          isError={comm.isError}
          error={comm.error}
          onRetry={() => comm.refetch()}
          empty={{
            icon: <Coins />,
            title: "No commissions yet",
            description:
              "When your referrals place qualifying orders, commissions will show here.",
          }}
          pagination={{
            page: commPage,
            pageSize: COMM_PAGE_SIZE,
            total: comm.data?.meta?.total ?? 0,
            onChange: setCommPage,
          }}
        />
      </DashboardPanel>

      <DashboardPanel title="Payout history">
        <DataTable<PayoutRow>
          columns={payoutColumns}
          data={(payouts.data?.items ?? []) as PayoutRow[]}
          getRowId={(p) => p.id}
          isLoading={payouts.isLoading}
          isError={payouts.isError}
          error={payouts.error}
          onRetry={() => payouts.refetch()}
          empty={{
            icon: <Wallet />,
            title: "No payouts yet",
            description: "Your payout requests and their status will appear here.",
          }}
          pagination={{
            page: payoutPage,
            pageSize: PAYOUT_PAGE_SIZE,
            total: payouts.data?.meta?.total ?? 0,
            onChange: setPayoutPage,
          }}
        />
      </DashboardPanel>
    </div>
  );
}

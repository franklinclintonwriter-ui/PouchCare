import { useState } from "react";
import {
  useCommissionSummary,
  useCommissions,
  usePayoutHistory,
  usePayoutRequest,
} from "@/api/portal-dashboard";
import { formatUsd, formatDateShort } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { NarrowWide } from "@/components/dashboard/ResponsiveSplit";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";

const MIN_PAYOUT = 50;

const PAY_METHODS = [
  { value: "USDT_TRC20", label: "USDT (TRC20)" },
  { value: "PAYONEER", label: "Payoneer" },
  { value: "BINANCE", label: "Binance" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
] as const;

export default function BillingPage() {
  const summary = useCommissionSummary();
  const comm = useCommissions(1, 30);
  const payouts = usePayoutHistory(1, 20);
  const payoutReq = usePayoutRequest();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("USDT_TRC20");
  const [details, setDetails] = useState("");

  const s = summary.data;

  const submitPayout = async () => {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n < MIN_PAYOUT) {
      toast.error(`Minimum payout is ${formatUsd(MIN_PAYOUT)}`);
      return;
    }
    if (!details.trim()) {
      toast.error("Add payment details (wallet address, email, etc.)");
      return;
    }
    try {
      await payoutReq.mutateAsync({
        amountUsd: n,
        paymentMethod: method,
        paymentDetails: details.trim(),
      });
      toast.success("Payout request submitted");
      setAmount("");
      setDetails("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    }
  };

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Amount (USD)</label>
            <input
              type="number"
              min={MIN_PAYOUT}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            >
              {PAY_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-600">
              Payment details
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="TRC20 address, Payoneer email, bank info…"
              rows={3}
              className="mt-1 min-h-[5.5rem] w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            />
          </div>
        </div>
        <Button
          type="button"
          className="mt-4 w-full touch-manipulation sm:w-auto"
          disabled={payoutReq.isPending}
          onClick={() => void submitPayout()}
        >
          {payoutReq.isPending ? "Submitting…" : "Submit payout request"}
        </Button>
      </DashboardPanel>

      <DashboardPanel title="Commission ledger">
        {comm.isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : !comm.data?.items.length ? (
          <p className="text-sm text-gray-500">No commission rows yet.</p>
        ) : (
          <NarrowWide
            narrow={
              <ul className="space-y-3">
                {comm.data.items.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-2xl border border-gray-200/90 bg-gray-50/40 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-600">
                          {formatDateShort(c.createdAt)}
                        </p>
                        <p className="mt-1 font-medium text-gray-900">
                          {c.referredMemberName ?? "—"}
                        </p>
                        <div className="mt-2">
                          <Badge variant="slate">
                            {c.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                      <p className="shrink-0 text-lg font-semibold tabular-nums text-gray-900">
                        {formatUsd(c.commissionAmountUsd)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            }
            wide={
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase text-gray-500">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Referral</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {comm.data.items.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-2.5 text-gray-600">
                          {formatDateShort(c.createdAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          {c.referredMemberName ?? "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="slate">
                            {c.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                          {formatUsd(c.commissionAmountUsd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          />
        )}
      </DashboardPanel>

      <DashboardPanel title="Payout history">
        {payouts.isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : !payouts.data?.items.length ? (
          <p className="text-sm text-gray-500">No payouts yet.</p>
        ) : (
          <NarrowWide
            narrow={
              <ul className="space-y-3">
                {payouts.data.items.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-2xl border border-gray-200/90 bg-gray-50/40 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Requested</p>
                        <p className="font-medium text-gray-900">
                          {formatDateShort(p.requestedDate)}
                        </p>
                        <p className="mt-2 text-sm text-gray-600">
                          {p.paymentMethod.replace(/_/g, " ")}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {p.status}
                        </p>
                      </div>
                      <p className="shrink-0 text-lg font-semibold tabular-nums text-gray-900">
                        {formatUsd(p.amountUsd)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            }
            wide={
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase text-gray-500">
                      <th className="px-4 py-3 font-medium">Requested</th>
                      <th className="px-4 py-3 font-medium">Method</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payouts.data.items.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2.5 text-gray-600">
                          {formatDateShort(p.requestedDate)}
                        </td>
                        <td className="px-4 py-2.5">
                          {p.paymentMethod.replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-2.5">{p.status}</td>
                        <td className="px-4 py-2.5 text-right font-medium">
                          {formatUsd(p.amountUsd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          />
        )}
      </DashboardPanel>
    </div>
  );
}

import { useState } from "react";
import { toast } from "sonner";
import {
  usePortalWallet,
  usePortalWalletTransactions,
  useDepositRequest,
} from "@/api/portal-dashboard";
import { formatUsd, formatDate } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { NarrowWide } from "@/components/dashboard/ResponsiveSplit";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";

const PAY_METHODS = [
  { value: "USDT_TRC20", label: "USDT (TRC20)" },
  { value: "PAYONEER", label: "Payoneer" },
  { value: "BINANCE", label: "Binance" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "CASH", label: "Cash" },
] as const;

export default function WalletPage() {
  const wallet = usePortalWallet();
  const txs = usePortalWalletTransactions(1, 30);
  const deposit = useDepositRequest();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("USDT_TRC20");
  const [proofUrl, setProofUrl] = useState("");

  const w = wallet.data;

  const submitDeposit = async () => {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await deposit.mutateAsync({
        amountUsd: n,
        paymentMethod: method,
        proofUrl: proofUrl.trim() || undefined,
      });
      setAmount("");
      setProofUrl("");
      toast.success("Deposit request submitted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit deposit");
    }
  };

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="deposit-amount" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              Amount (USD)
            </label>
            <input
              id="deposit-amount"
              type="number"
              min={1}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="deposit-method" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              Method
            </label>
            <select
              id="deposit-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-gray-100"
            >
              {PAY_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="deposit-proof" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              Proof URL (optional)
            </label>
            <input
              id="deposit-proof"
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
        <Button
          type="button"
          className="mt-4 w-full touch-manipulation sm:w-auto"
          disabled={deposit.isPending}
          onClick={() => void submitDeposit()}
        >
          {deposit.isPending ? "Submitting…" : "Submit deposit request"}
        </Button>
      </DashboardPanel>

      <DashboardPanel title="Transactions">
        {txs.isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : txs.isError ? (
          <p className="text-sm text-red-600">Failed to load transactions.</p>
        ) : !txs.data?.items.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No transactions yet.</p>
        ) : (
          <NarrowWide
            narrow={
              <ul className="space-y-3">
                {txs.data.items.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-2xl border border-gray-200/90 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/50 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {t.type.replace(/_/g, " ")}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(t.transactionDate)}
                        </p>
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          Status: {t.status}
                        </p>
                      </div>
                      <p
                        className={`shrink-0 text-lg font-semibold tabular-nums ${
                          t.amountUsd < 0
                            ? "text-red-600"
                            : "text-emerald-700"
                        }`}
                      >
                        {formatUsd(t.amountUsd)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            }
            wide={
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {txs.data.items.map((t) => (
                      <tr key={t.id}>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                          {formatDate(t.transactionDate)}
                        </td>
                        <td className="px-4 py-2.5">
                          {t.type.replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-2.5">{t.status}</td>
                        <td
                          className={`px-4 py-2.5 text-right font-medium tabular-nums ${
                            t.amountUsd < 0
                              ? "text-red-600"
                              : "text-emerald-700"
                          }`}
                        >
                          {formatUsd(t.amountUsd)}
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

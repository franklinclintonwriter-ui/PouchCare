import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useReferralStats, useReferralsList } from "@/api/portal-dashboard";
import { portalRegisterUrl } from "@/lib/portal";
import { formatUsd, formatDateShort } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { NarrowWide } from "@/components/dashboard/ResponsiveSplit";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function ReferralsPage() {
  const stats = useReferralStats();
  const list = useReferralsList(1, 50);
  const [copied, setCopied] = useState(false);

  const code = stats.data?.referralCode ?? "";
  const refLink = `${portalRegisterUrl()}?ref=${encodeURIComponent(code)}`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Referral code"
          value={
            <span className="font-mono text-xl tracking-wide">{code || "—"}</span>
          }
        />
        <StatCard
          label="Total referrals"
          value={stats.isLoading ? "…" : (stats.data?.totalReferrals ?? 0)}
        />
        <StatCard
          label="Commission earned"
          value={
            stats.isLoading
              ? "…"
              : formatUsd(stats.data?.totalCommissionEarned ?? 0)
          }
        />
      </div>

      <DashboardPanel
        title="Share your link"
        description="New clients who register with your code count toward your referrals."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Registration URL
            </label>
            <input
              readOnly
              value={refLink}
              className="mt-1 min-h-[44px] w-full truncate rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 font-mono text-sm"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full shrink-0 touch-manipulation sm:w-auto sm:min-w-[10rem]"
            icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            onClick={() => void copy(refLink)}
          >
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Your referrals">
        {list.isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : list.isError ? (
          <p className="text-sm text-red-600">Failed to load referrals. Please try again.</p>
        ) : !list.data?.items.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No referrals yet.</p>
        ) : (
          <NarrowWide
            narrow={
              <ul className="space-y-3">
                {list.data.items.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-2xl border border-gray-200/90 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/50 p-4 shadow-sm"
                  >
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {r.referredName}
                    </p>
                    <p className="mt-1 break-all text-sm text-gray-600 dark:text-gray-400">
                      {r.referredEmail}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200/80 dark:border-gray-700 pt-3 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Joined {formatDateShort(r.registrationDate)}
                      </span>
                      <span className="tabular-nums text-gray-900 dark:text-gray-100">
                        {r.totalOrders} orders
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            }
            wide={
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Orders</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {list.data.items.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">
                          {r.referredName}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                          {r.referredEmail}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">
                          {r.totalOrders}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                          {formatDateShort(r.registrationDate)}
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

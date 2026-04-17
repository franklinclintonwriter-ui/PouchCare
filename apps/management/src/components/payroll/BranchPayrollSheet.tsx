import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { PayrollEntry } from "@/types/models";

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

function formatBdt(n: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface BranchPayrollSheetProps {
  entries: PayrollEntry[];
  branchName: string;
  month: number;
  year: number;
}

function BranchPayrollSheet({
  entries,
  branchName,
  month,
  year,
}: BranchPayrollSheetProps) {
  const periodLabel = `${MONTH_NAMES[(month ?? 1) - 1]} ${year}`;
  const totalBase = entries.reduce((s, e) => s + e.baseSalary, 0);
  const totalBonus = entries.reduce((s, e) => s + e.bonus, 0);
  const totalDeductions = entries.reduce((s, e) => s + e.deductions, 0);
  const totalNet = entries.reduce((s, e) => s + e.netPay, 0);
  const paidCount = entries.filter((e) => e.status === "PAID").length;
  const pendingCount = entries.filter((e) => e.status !== "PAID").length;

  return (
    <div className="payroll-slip-sheet mx-auto max-w-[210mm] bg-white px-6 py-8 text-gray-900 print:px-8 print:py-10">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b-2 border-gray-300 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <svg
            className="h-11 w-11 shrink-0"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <defs>
              <linearGradient
                id="pcg2"
                x1="8"
                y1="8"
                x2="40"
                y2="40"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#059669" />
                <stop offset="1" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <rect width="48" height="48" rx="14" fill="url(#pcg2)" />
            <path
              d="M14 18c0-3.3 2.7-6 6-6h8c3.3 0 6 2.7 6 6v5c0 2.2-1.2 4.1-3 5.1V31h-4v-2.2c-.7.1-1.3.2-2 .2h-5c-3.3 0-6-2.7-6-6v-5z"
              fill="white"
              fillOpacity="0.95"
            />
            <circle cx="32" cy="30" r="3" fill="white" fillOpacity="0.9" />
          </svg>
          <div className="leading-tight">
            <p className="text-xl font-bold tracking-tight text-gray-900">
              PouchCare
            </p>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-700">
              Agency OS
            </p>
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Branch Salary Report
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900">{branchName}</p>
          <p className="mt-0.5 text-gray-600">
            Period:{" "}
            <span className="font-semibold text-gray-900">{periodLabel}</span>
          </p>
        </div>
      </header>

      {/* Summary cards */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Staff Count
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {entries.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-emerald-50/60 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
            Net Payroll
          </p>
          <p className="mt-1 text-lg font-bold text-emerald-800">
            {formatBdt(totalNet)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Paid
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{paidCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-amber-50/60 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">
            Pending
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-800">
            {pendingCount}
          </p>
        </div>
      </section>

      {/* Staff payroll table */}
      <section className="mt-8 break-inside-avoid">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Complete Staff Salary Summary — {branchName}
        </h2>
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-600">
              <th className="py-2.5 pl-3 pr-1 w-8">#</th>
              <th className="py-2.5 px-2">Staff Name</th>
              <th className="py-2.5 px-2">Role</th>
              <th className="py-2.5 px-2 text-right">Base Salary</th>
              <th className="py-2.5 px-2 text-right">Bonus</th>
              <th className="py-2.5 px-2 text-right">Deductions</th>
              <th className="py-2.5 px-2 text-right">Net Pay</th>
              <th className="py-2.5 px-2 text-center">Status</th>
              <th className="py-2.5 pl-2 pr-3">Method</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((entry, idx) => (
              <tr
                key={entry.id}
                className={idx % 2 === 1 ? "bg-gray-50/40" : ""}
              >
                <td className="py-2.5 pl-3 pr-1 text-xs text-gray-400 tabular-nums">
                  {idx + 1}
                </td>
                <td className="py-2.5 px-2 font-medium text-gray-900">
                  {entry.staffName}
                </td>
                <td className="py-2.5 px-2 text-xs text-gray-600">
                  {entry.role.replace(/_/g, " ")}
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums">
                  {formatBdt(entry.baseSalary)}
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums text-emerald-700">
                  {entry.bonus > 0 ? `+${formatBdt(entry.bonus)}` : "—"}
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums text-red-600">
                  {entry.deductions > 0
                    ? `−${formatBdt(entry.deductions)}`
                    : "—"}
                </td>
                <td className="py-2.5 px-2 text-right font-semibold tabular-nums text-gray-900">
                  {formatBdt(entry.netPay)}
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      entry.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {entry.status}
                  </span>
                </td>
                <td className="py-2.5 pl-2 pr-3 text-xs text-gray-500">
                  {entry.paymentMethod || "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold text-gray-900">
              <td className="py-3 pl-3 pr-1" />
              <td className="py-3 px-2" colSpan={2}>
                TOTAL ({entries.length} staff)
              </td>
              <td className="py-3 px-2 text-right tabular-nums">
                {formatBdt(totalBase)}
              </td>
              <td className="py-3 px-2 text-right tabular-nums text-emerald-700">
                {totalBonus > 0 ? `+${formatBdt(totalBonus)}` : "—"}
              </td>
              <td className="py-3 px-2 text-right tabular-nums text-red-600">
                {totalDeductions > 0 ? `−${formatBdt(totalDeductions)}` : "—"}
              </td>
              <td className="py-3 px-2 text-right text-lg tabular-nums text-emerald-800">
                {formatBdt(totalNet)}
              </td>
              <td className="py-3 px-2" />
              <td className="py-3 pl-2 pr-3" />
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Note */}
      <section className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3 text-xs text-gray-600">
        <span className="font-semibold text-gray-700">Note:</span> This salary
        report covers all {entries.length} shoulders assigned to the{" "}
        <span className="font-semibold">{branchName}</span> branch for{" "}
        {periodLabel}.
        {pendingCount > 0 && (
          <span className="text-amber-700">
            {" "}
            {pendingCount} payment(s) are still pending.
          </span>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-10 flex flex-col gap-8 break-inside-avoid border-t border-gray-200 pt-6 sm:flex-row sm:justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">Generated on</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-xs font-medium text-gray-500">Authorized by</p>
          <div className="mt-8 border-t border-gray-400 pt-2">
            <p className="text-xs text-gray-500">Branch Manager / HR</p>
          </div>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-xs font-medium text-gray-500">Approved by</p>
          <div className="mt-8 border-t border-gray-400 pt-2">
            <p className="text-xs text-gray-500">CEO / MD</p>
          </div>
        </div>
      </footer>

      <p className="mt-6 text-center text-[10px] text-gray-400">
        PouchCare OS — Confidential salary document. For internal use only.
      </p>
    </div>
  );
}

/**
 * Hook to print a branch-level salary summary sheet for all staff in a branch.
 */
export function useBranchPayrollPrint() {
  const [printData, setPrintData] = useState<BranchPayrollSheetProps | null>(
    null,
  );

  const printBranchSheet = (data: BranchPayrollSheetProps) => {
    setPrintData(data);
  };

  useEffect(() => {
    if (!printData) return;
    document.documentElement.classList.add("payroll-slip-mode");
    const raf = requestAnimationFrame(() => {
      window.print();
    });
    const onAfterPrint = () => {
      document.documentElement.classList.remove("payroll-slip-mode");
      setPrintData(null);
    };
    window.addEventListener("afterprint", onAfterPrint, { once: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [printData]);

  const portal =
    printData &&
    createPortal(
      <div id="payroll-slip-root" aria-hidden>
        <BranchPayrollSheet {...printData} />
      </div>,
      document.body,
    );

  return { printBranchSheet, branchPortal: portal };
}

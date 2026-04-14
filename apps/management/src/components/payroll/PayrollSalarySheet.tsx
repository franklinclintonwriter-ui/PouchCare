import type { PayrollEntry } from '@/types/models';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** CEO name — matches company leadership (.cursorrules). */
export const PAYROLL_CEO_NAME = 'Abdullah Al Mamun';
export const PAYROLL_CEO_TITLE = 'Chief Executive Officer';

function formatBdt(n: number): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function PouchCareLogoMark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        className="h-11 w-11 shrink-0"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="pcg" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#059669" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="14" fill="url(#pcg)" />
        <path
          d="M14 18c0-3.3 2.7-6 6-6h8c3.3 0 6 2.7 6 6v5c0 2.2-1.2 4.1-3 5.1V31h-4v-2.2c-.7.1-1.3.2-2 .2h-5c-3.3 0-6-2.7-6-6v-5z"
          fill="white"
          fillOpacity="0.95"
        />
        <circle cx="32" cy="30" r="3" fill="white" fillOpacity="0.9" />
      </svg>
      <div className="leading-tight">
        <p className="text-xl font-bold tracking-tight text-gray-900">PouchCare</p>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-700">Agency OS</p>
      </div>
    </div>
  );
}

export interface PayrollSalarySheetProps {
  entry: PayrollEntry;
  /** Shown near footer — defaults to today */
  issuedOn?: Date;
}

/**
 * Printable salary slip — BDT amounts. Styled for A4; pair with payroll-slip-mode print CSS.
 */
export function PayrollSalarySheet({ entry, issuedOn = new Date() }: PayrollSalarySheetProps) {
  const periodLabel = `${MONTH_NAMES[(entry.month ?? 1) - 1]} ${entry.year}`;
  const roleLabel = entry.role.replace(/_/g, ' ');
  const paidLabel =
    entry.status === 'PAID' && entry.paymentDate
      ? new Date(entry.paymentDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;

  return (
    <div className="payroll-slip-sheet mx-auto max-w-[210mm] bg-white px-6 py-8 text-gray-900 print:px-8 print:py-10">
      {/* Header */}
      <header className="flex flex-col gap-6 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <PouchCareLogoMark />
        <div className="text-right text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Salary statement</p>
          <p className="mt-1 text-lg font-bold text-gray-900">Pay slip</p>
          <p className="mt-0.5 text-gray-600">Pay period: <span className="font-semibold text-gray-900">{periodLabel}</span></p>
        </div>
      </header>

      {/* Employee */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Employee</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{entry.staffName}</p>
          <p className="mt-2 text-xs text-gray-600">
            Staff ID: <span className="font-mono text-gray-800">{entry.staffId.slice(0, 8)}…</span>
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Assignment</p>
          <p className="mt-1 text-sm text-gray-800">
            <span className="font-medium">Role:</span> {roleLabel}
          </p>
          <p className="mt-1 text-sm text-gray-800">
            <span className="font-medium">Branch:</span> {entry.branch || '—'}
          </p>
          <p className="mt-1 text-sm text-gray-800">
            <span className="font-medium">Status:</span>{' '}
            <span className="font-semibold">{entry.status.replace('_', ' ')}</span>
          </p>
        </div>
      </section>

      {/* Amounts table */}
      <section className="mt-8 break-inside-avoid">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Earnings & deductions</h2>
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
              <th className="py-2.5 pl-3 pr-2">Description</th>
              <th className="py-2.5 pl-2 pr-3 text-right">Amount (BDT)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 pl-3 text-gray-800">Base salary</td>
              <td className="py-3 pr-3 text-right font-medium tabular-nums">{formatBdt(entry.baseSalary)}</td>
            </tr>
            <tr>
              <td className="py-3 pl-3 text-gray-800">Bonus</td>
              <td className="py-3 pr-3 text-right font-medium tabular-nums text-emerald-700">
                {entry.bonus > 0 ? '+' : ''}{formatBdt(entry.bonus)}
              </td>
            </tr>
            <tr>
              <td className="py-3 pl-3 text-gray-800">Deductions</td>
              <td className="py-3 pr-3 text-right font-medium tabular-nums text-red-600">
                −{formatBdt(entry.deductions)}
              </td>
            </tr>
            <tr className="border-t-2 border-gray-300 bg-emerald-50/60">
              <td className="py-4 pl-3 text-base font-bold text-gray-900">Net pay</td>
              <td className="py-4 pr-3 text-right text-lg font-bold tabular-nums text-emerald-800">
                {formatBdt(entry.netPay)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Payment details */}
      <section className="mt-6 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
        <p>
          <span className="font-medium text-gray-600">Payment method:</span>{' '}
          {entry.paymentMethod || '—'}
        </p>
        {paidLabel && (
          <p>
            <span className="font-medium text-gray-600">Payment date:</span>{' '}
            {paidLabel}
          </p>
        )}
      </section>

      {entry.notes ? (
        <section className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3 text-sm text-gray-700">
          <span className="font-medium text-gray-600">Notes: </span>
          {entry.notes}
        </section>
      ) : null}

      {/* Sign-off */}
      <footer className="mt-12 flex flex-col gap-10 break-inside-avoid border-t border-gray-200 pt-8 sm:flex-row sm:justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">Prepared on</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {issuedOn.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-xs font-medium text-gray-500">Authorized by</p>
          <p
            className="mt-6 text-3xl text-gray-800"
            style={{ fontFamily: "'Great Vibes', cursive" }}
          >
            {PAYROLL_CEO_NAME}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{PAYROLL_CEO_TITLE}</p>
          <p className="mt-4 text-[10px] uppercase tracking-widest text-gray-400">Signature</p>
          <div className="mx-auto mt-2 h-px w-48 bg-gray-400 sm:ml-auto sm:mr-0" />
        </div>
      </footer>

      <p className="mt-8 text-center text-[10px] text-gray-400">
        This document is generated from PouchCare OS — confidential.
      </p>
    </div>
  );
}

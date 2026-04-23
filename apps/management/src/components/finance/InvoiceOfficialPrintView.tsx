import type { Invoice } from "@/types/models";
import { INVOICE_OFFICIAL } from "@/constants/invoiceOfficialBranding";
import { cn } from "@/utils/cn";
import pouchcareLogo from "../../../pouchcare-logo.png";

type Props = {
  invoice: Invoice;
  formatUsd: (n: number) => string;
  issueLabel: string;
  dueLabel: string;
};

const label =
  "text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400";
const panel =
  "rounded-xl border border-slate-200/70 bg-white/90 shadow-sm shadow-slate-900/[0.03] ring-1 ring-slate-900/[0.03] print:border-slate-200 print:bg-white print:shadow-none print:ring-0";
const proNumber = "font-variant-numeric tabular-nums";

/**
 * PouchCare invoice — premium stationery layout, print- and PDF-safe.
 */
export function InvoiceOfficialPrintView({
  invoice,
  formatUsd,
  issueLabel,
  dueLabel,
}: Props) {
  const txTime = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  const paid = invoice.status === "PAID";
  const balance = Math.max(0, invoice.total - invoice.paidAmount);
  const lines =
    invoice.items?.length > 0
      ? invoice.items
      : [
          {
            description: "Professional services",
            quantity: 1,
            rate: invoice.total,
            amount: invoice.total,
          },
        ];

  const paymentCopy =
    invoice.paymentMethod?.trim() || INVOICE_OFFICIAL.defaultPaymentMethods;

  const projectTitle =
    invoice.projectReference?.trim() ||
    invoice.service?.trim() ||
    "Professional services";

  const projectBody =
    invoice.notes?.trim() ||
    invoice.service?.trim() ||
    "Services as described in the line items below.";

  return (
    <div
      className={cn(
        "relative mx-auto max-w-[210mm] bg-white text-slate-800 antialiased",
        "[font-feature-settings:'tnum','lnum']",
        "px-5 pb-9 pt-0 sm:px-9 sm:pb-10",
        /* print:pt-4 clears physical top of masthead */
        "print:max-w-none print:px-7 print:pb-8 print:pt-4",
        "selection:bg-slate-200/80",
      )}
    >
      {/* Masthead */}
      <header className="border-b border-slate-200/90 bg-gradient-to-b from-slate-50/40 to-white pb-8 print:border-slate-200 print:bg-white print:pb-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between print:flex-row print:gap-6">
          <div className="flex min-w-0 flex-1 gap-5 sm:gap-6">
            <div className="shrink-0 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm print:rounded-xl print:p-2.5">
              <img
                src={pouchcareLogo}
                alt="PouchCare"
                className="h-11 w-auto max-h-[48px] max-w-[180px] object-contain object-left sm:h-12 print:h-10"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-slate-400">
                {INVOICE_OFFICIAL.companyShort}
              </p>
              <p className="mt-1 text-base font-semibold leading-snug tracking-tight text-slate-950 sm:text-lg">
                {INVOICE_OFFICIAL.companyLine}
              </p>
              <p className="mt-3 max-w-md text-xs leading-relaxed text-slate-500 sm:text-[0.8125rem]">
                {INVOICE_OFFICIAL.addressLine}
              </p>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
                <span className="font-medium text-slate-400">Web:</span>{" "}
                {INVOICE_OFFICIAL.web}
                <span className="text-slate-300"> · </span>
                <span className="font-medium text-slate-400">Email:</span>{" "}
                {INVOICE_OFFICIAL.email}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {INVOICE_OFFICIAL.phone}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "w-full shrink-0 border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-white p-5 shadow-md shadow-slate-900/10 ring-1 ring-slate-900/[0.06]",
              "lg:max-w-[288px] lg:rounded-xl lg:text-right",
              "print:max-w-[260px] print:rounded-lg print:px-4 print:py-4 print:pt-4 print:shadow-sm print:ring-1",
            )}
          >
            <p className="font-mono text-[0.8125rem] font-semibold tracking-tight text-slate-800 sm:text-sm">
              <span className="font-sans text-xs font-medium uppercase tracking-wider text-slate-400">
                No.
              </span>{" "}
              {invoice.number}
            </p>
            <dl className="mt-4 space-y-3 text-left text-xs text-slate-700 lg:ml-auto lg:max-w-[16rem] lg:text-right print:ml-auto print:text-right">
              <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100/80 pb-2 last:border-0 sm:justify-end print:flex-col print:items-end print:gap-1">
                <dt className={label}>Invoice date</dt>
                <dd className={cn(proNumber, "text-slate-800")}>{issueLabel}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100/80 pb-2 last:border-0 sm:justify-end print:flex-col print:items-end print:gap-1">
                <dt className={label}>Due date</dt>
                <dd className={cn(proNumber, "text-slate-800")}>{dueLabel}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 sm:justify-end print:flex-col print:items-end print:gap-1">
                <dt className={label}>Time (UTC)</dt>
                <dd className={cn(proNumber, "text-slate-800")}>
                  {txTime}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      {/* Brand ribbon */}
      <div className="mt-6 flex items-center justify-center gap-4 border-b border-slate-200/90 py-4 print:mt-5">
        <span
          className="h-px flex-1 max-w-[5rem] bg-gradient-to-r from-transparent via-slate-300 to-slate-200 sm:max-w-[6rem] print:via-slate-400"
          aria-hidden
        />
        <p className="shrink-0 text-center text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-slate-500">
          {INVOICE_OFFICIAL.ribbon}
        </p>
        <span
          className="h-px flex-1 max-w-[5rem] bg-gradient-to-l from-transparent via-slate-300 to-slate-200 sm:max-w-[6rem] print:via-slate-400"
          aria-hidden
        />
      </div>

      {/* Brand accent — below ribbon (screen bleed, print inset) */}
      <div
        className="-mx-5 mt-2 mb-8 h-1.5 bg-gradient-to-r from-emerald-600 via-slate-700 to-slate-900 sm:-mx-9 print:mx-0 print:mt-3 print:mb-6 print:h-1 print:rounded-sm"
        aria-hidden
      />

      {/* Payment status */}
      <div
        className={cn(
          "mt-6 flex gap-4 rounded-xl border border-slate-200/80 border-l-[3px] px-4 py-4 sm:px-5 sm:py-5 print:mt-5 print:bg-white",
          paid
            ? "border-l-emerald-600 bg-emerald-50/45"
            : "border-l-amber-500 bg-amber-50/40",
        )}
      >
        <span
          className={cn(
            "mt-0.5 h-2 w-2 shrink-0 rounded-full",
            paid ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]" : "bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.2)]",
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-xs font-semibold tracking-wide",
            paid ? "text-emerald-900" : "text-amber-950",
          )}
        >
          {paid
            ? "Payment verified"
            : "Payment outstanding"}
        </p>
        <p className="mt-1.5 text-sm text-slate-500">
          {paid
            ? "This invoice has been settled in full."
            : "Please remit the amount below by the due date."}
        </p>
        <p className="mt-3 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl print:text-lg">
          <span className="text-slate-500">
            {paid ? "Amount received" : "Amount due"}{" "}
          </span>
          <span className={cn(proNumber, "text-slate-900")}>
            {formatUsd(paid ? invoice.paidAmount : invoice.total)}
          </span>
          <span className="ml-1 text-sm font-medium text-slate-500">USD</span>
        </p>
        {!paid && balance > 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            Remaining:{" "}
            <span className={cn("font-medium text-slate-700", proNumber)}>
              {formatUsd(balance)} USD
            </span>
          </p>
        ) : null}
        </div>
      </div>

      {/* Billed to */}
      <section className="mt-9 print:mt-7">
        <p className={label}>Billed to</p>
        <div className={cn("mt-3 p-4 sm:p-5", panel)}>
          <p className="text-base font-semibold text-slate-900 sm:text-lg">
            {invoice.clientName}
          </p>
          <p className="mt-1 text-sm text-slate-600">{invoice.clientEmail}</p>
        </div>
      </section>

      {/* Project */}
      <section className="mt-7 print:mt-6">
        <p className={label}>Project details</p>
        <div className={cn("mt-3 p-4 sm:p-5", panel)}>
          <p className="text-sm font-semibold text-slate-900 sm:text-base">
            {projectTitle}
          </p>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-600 sm:text-[0.9rem]">
            <span className="font-medium text-slate-700">Scope — </span>
            {projectBody}
          </p>
        </div>
      </section>

      {/* Line items */}
      <section className="mt-9 print:mt-8">
        <p className={cn("mb-3", label)}>Line items</p>
        <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-sm shadow-slate-900/[0.04] print:overflow-visible print:rounded-lg print:shadow-none">
          <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-0 text-left text-xs sm:text-[0.8rem]">
            <thead>
              <tr className="bg-gradient-to-b from-slate-800 to-slate-950 text-left text-white">
                <th
                  scope="col"
                  className="w-10 px-2.5 py-3 text-center text-[0.6rem] font-semibold uppercase tracking-[0.12em]"
                >
                  #
                </th>
                <th
                  scope="col"
                  className="px-2.5 py-3 text-[0.6rem] font-semibold uppercase tracking-[0.12em]"
                >
                  Service
                </th>
                <th
                  scope="col"
                  className="px-2.5 py-3 text-[0.6rem] font-semibold uppercase tracking-[0.12em]"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-2.5 py-3 text-[0.6rem] font-semibold uppercase tracking-[0.12em]"
                >
                  Deliverables
                </th>
                <th
                  scope="col"
                  className="w-28 px-2.5 py-3 text-right text-[0.6rem] font-semibold uppercase tracking-[0.12em]"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((row, i) => (
                <tr
                  key={`${row.description}-${i}`}
                  className={cn(
                    "align-top",
                    i % 2 === 0
                      ? "bg-white"
                      : "bg-slate-50/70",
                    "border-b border-slate-100 last:border-0",
                  )}
                >
                  <td
                    className={cn(
                      "px-2 py-3 text-center text-xs text-slate-500",
                      proNumber,
                    )}
                  >
                    {i + 1}
                  </td>
                  <td className="px-2 py-3 font-medium text-slate-900">
                    {invoice.service?.trim() ||
                      row.description.split(/[.(\n]/)[0]?.trim() ||
                      "Services"}
                  </td>
                  <td className="px-2 py-3 text-slate-600">{row.description}</td>
                  <td className="px-2 py-3 text-slate-500">
                    {i === 0 && invoice.notes?.trim()
                      ? invoice.notes.trim().slice(0, 220)
                      : "Per agreement"}
                  </td>
                  <td
                    className={cn(
                      "px-2 py-3 text-right text-sm font-semibold text-slate-900",
                      proNumber,
                    )}
                  >
                    {formatUsd(row.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Total */}
      <div className="mt-6 flex flex-col items-end gap-1.5 print:mt-5">
        <div className="min-w-[13rem] border border-slate-300/80 bg-gradient-to-b from-slate-50 to-white px-6 py-4 text-right shadow-sm sm:min-w-[15rem] print:border-slate-300 print:shadow-none">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Total (USD)
          </p>
          <p
            className={cn(
              "mt-1.5 border-t border-slate-200/80 pt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-[1.7rem] print:text-xl",
              proNumber,
            )}
          >
            {formatUsd(invoice.total)}
          </p>
        </div>
        <p className="text-[0.62rem] text-slate-400">All figures in US dollars.</p>
      </div>

      {/* Payment methods */}
      <section
        className={cn(
          "mt-9 rounded-xl border border-slate-200/90 bg-slate-50/35 p-5 sm:p-6",
          "border-l-[3px] border-l-slate-800",
          "print:mt-7 print:bg-white",
        )}
      >
        <p className={label}>Payment & settlement</p>
        <p className="mt-3 whitespace-pre-line text-xs leading-[1.65] text-slate-600 sm:text-[0.8rem]">
          {paymentCopy}
        </p>
      </section>

      {/* Summary + terms */}
      <section className="mt-8 grid gap-8 border-t border-slate-200/90 pt-9 md:grid-cols-2 print:mt-7 print:grid-cols-2 print:gap-7 print:pt-7">
        <div>
          <p className={label}>Summary</p>
          <div className="mt-3 space-y-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white text-sm shadow-sm sm:text-[0.85rem] print:shadow-none">
            <div className="flex justify-between gap-4 border-b border-slate-100 px-3 py-2.5">
              <span className="text-slate-500">Subtotal</span>
              <span className={cn("font-medium text-slate-900", proNumber)}>
                {formatUsd(invoice.subtotal)}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 px-3 py-2.5">
              <span className="text-slate-500">Discount</span>
              <span className={cn(proNumber, "text-slate-700")}>
                {formatUsd(0)}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 px-3 py-2.5">
              <span className="text-slate-500">Tax</span>
              <span className={cn(proNumber, "text-slate-700")}>
                {formatUsd(invoice.tax)}
              </span>
            </div>
            {invoice.amountBdt != null && invoice.amountBdt > 0 ? (
              <div className="flex justify-between gap-4 px-3 py-2.5">
                <span className="text-slate-500">Reference (BDT)</span>
                <span className={cn("font-medium text-slate-800", proNumber)}>
                  {invoice.amountBdt.toLocaleString("en-BD", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  BDT
                </span>
              </div>
            ) : null}
          </div>
        </div>
        <div>
          <p className={label}>Terms &amp; conditions</p>
          <p className="mt-3 whitespace-pre-line text-xs leading-[1.65] text-slate-500 sm:text-[0.8rem]">
            {INVOICE_OFFICIAL.terms}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200/90 pt-10 print:mt-10 print:pt-8">
        <div className="grid gap-10 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-8">
          <div className="order-2 sm:order-1">
            <div
              className="h-[2px] max-w-[14rem] rounded-full bg-slate-400/80"
              aria-hidden
            />
            <p className="mt-5 text-base font-semibold tracking-tight text-slate-950">
              {INVOICE_OFFICIAL.companyShort}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {INVOICE_OFFICIAL.signatoryTitle}
            </p>
          </div>
          <div className="order-1 flex flex-col items-center gap-3 sm:order-2 sm:items-end">
            <img
              src={pouchcareLogo}
              alt=""
              className="h-10 w-auto opacity-95 print:h-9"
              aria-hidden
            />
            <p className="max-w-[14rem] text-center text-xs leading-relaxed text-slate-500 sm:text-right">
              Thank you for your business.
            </p>
          </div>
        </div>
        <p className="mt-10 text-center text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-slate-400 print:mt-8">
          {INVOICE_OFFICIAL.mission}
        </p>
      </footer>
    </div>
  );
}

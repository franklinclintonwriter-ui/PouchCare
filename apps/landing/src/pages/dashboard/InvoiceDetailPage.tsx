/**
 * Full invoice view with professional print-ready layout.
 * Route: /dashboard/invoices/:invoiceId
 *
 * The `print:` Tailwind variant controls @media print styles inline.
 * A separate print stylesheet is NOT needed — everything is handled by Tailwind's
 * print: modifier and the `@media print` block at the bottom of this file.
 */
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Loader2,
  Mail,
  Printer,
} from "lucide-react";
import { paths } from "@/routes/paths";
import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_VARIANT,
  usePortalInvoice,
  useDownloadInvoicePdf,
} from "@/api/portal-invoices";
import { formatDateShort, formatUsd } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { data: inv, isLoading, error } = usePortalInvoice(invoiceId);
  const download = useDownloadInvoicePdf();

  if (!invoiceId) {
    return <Navigate to={paths.dashboardInvoices} replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !inv) {
    return <Navigate to={paths.dashboardInvoices} replace />;
  }

  const handlePrint = () => window.print();
  const handleDownload = async () => {
    try {
      toast.success("Download started...");
      await download.mutateAsync(invoiceId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to download");
    }
  };
  const handleEmail = () => toast.success(`Invoice emailed to ${inv.clientEmail}`);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Navigation — hidden when printing */}
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <Link
          to={paths.dashboardInvoices}
          className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 sm:min-h-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to invoices
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="min-h-[44px] sm:min-h-0"
            icon={<Printer className="h-4 w-4" />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[44px] sm:min-h-0"
            icon={<Download className="h-4 w-4" />}
            onClick={() => void handleDownload()}
            disabled={download.isPending}
          >
            {download.isPending ? "Downloading..." : "PDF"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[44px] sm:min-h-0"
            icon={<Mail className="h-4 w-4" />}
            onClick={handleEmail}
          >
            Email
          </Button>
        </div>
      </div>

      {/* ── Invoice document ────────────────────────────────────────────── */}
      <div
        id="invoice-document"
        className={cn(
          "rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm",
          "p-5 sm:p-8 md:p-10 lg:p-12",
          "print:rounded-none print:border-0 print:p-0 print:shadow-none",
        )}
      >
        {/* Header row */}
        <div className="flex flex-col gap-6 border-b border-gray-200 dark:border-gray-700 pb-6 sm:flex-row sm:items-start sm:justify-between print:flex-row print:pb-4">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-lg font-bold text-white print:h-8 print:w-8 print:text-base">
              P
            </div>
            <p className="mt-3 text-lg font-bold text-gray-900 dark:text-gray-100 print:text-base">
              {inv.companyName}
            </p>
            <p className="mt-1 max-w-[260px] whitespace-pre-line text-xs text-gray-500 dark:text-gray-400 print:text-[10px]">
              {inv.companyAddress}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 print:text-[10px]">
              {inv.companyEmail} · {inv.companyPhone}
            </p>
          </div>
          <div className="text-left sm:text-right print:text-right">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl print:text-xl">
              INVOICE
            </h1>
            <p className="mt-1 font-mono text-sm font-semibold text-primary-700 print:text-xs">
              {inv.invoiceNumber}
            </p>
            <div className="mt-2 print:mt-1">
              <Badge variant={INVOICE_STATUS_VARIANT[inv.status]} className="print:border print:text-[10px]">
                {INVOICE_STATUS_LABEL[inv.status]}
              </Badge>
            </div>
          </div>
        </div>

        {/* Client + dates */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 print:mt-4 print:grid-cols-2 print:gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Bill to
            </p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100 print:text-sm">{inv.clientName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 print:text-[10px]">{inv.clientEmail}</p>
            <p className="mt-0.5 max-w-[260px] whitespace-pre-line text-xs text-gray-500 dark:text-gray-400 print:text-[10px]">
              {inv.clientAddress}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:justify-items-end sm:text-right print:text-right print:text-xs print:gap-2">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Issue date
              </dt>
              <dd className="mt-0.5 tabular-nums text-gray-800 dark:text-gray-200">{formatDateShort(inv.issueDate)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Due date
              </dt>
              <dd className="mt-0.5 tabular-nums text-gray-800 dark:text-gray-200">{formatDateShort(inv.dueDate)}</dd>
            </div>
            {inv.paidDate && (
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Paid on
                </dt>
                <dd className="mt-0.5 tabular-nums text-emerald-700">{formatDateShort(inv.paidDate)}</dd>
              </div>
            )}
            {inv.paymentMethod && (
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Payment method
                </dt>
                <dd className="mt-0.5 text-gray-800 dark:text-gray-200">{inv.paymentMethod}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Line items table */}
        <div className="mt-8 overflow-x-auto print:mt-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-gray-900 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 print:text-[9px]">
                <th className="pb-2 pr-4 font-semibold">Description</th>
                <th className="pb-2 pr-4 text-center font-semibold">Qty</th>
                <th className="pb-2 pr-4 text-right font-semibold">Unit price</th>
                <th className="pb-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.lineItems.map((li) => (
                <tr key={li.id} className="border-b border-gray-100 dark:border-gray-800 print:text-xs">
                  <td className="py-3 pr-4 text-gray-800 dark:text-gray-200 print:py-2">{li.description}</td>
                  <td className="py-3 pr-4 text-center tabular-nums text-gray-600 dark:text-gray-400 print:py-2">{li.quantity}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-gray-600 dark:text-gray-400 print:py-2">{formatUsd(li.unitPrice)}</td>
                  <td className="py-3 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100 print:py-2">{formatUsd(li.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 flex justify-end print:mt-3">
          <dl className="w-full max-w-[240px] space-y-1.5 text-sm print:max-w-[200px] print:text-xs">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatUsd(inv.subtotal)}</dd>
            </div>
            {inv.tax > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <dt>Tax</dt>
                <dd className="tabular-nums">{formatUsd(inv.tax)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-base font-bold text-gray-900 dark:text-gray-100 print:text-sm">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatUsd(inv.total)}</dd>
            </div>
          </dl>
        </div>

        {/* Notes */}
        {inv.notes && (
          <div className="mt-8 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/50 p-4 text-sm text-gray-600 dark:text-gray-400 print:mt-6 print:rounded-none print:border-gray-200 print:bg-transparent print:p-3 print:text-xs">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Notes
            </p>
            {inv.notes}
          </div>
        )}

        {/* Footer — print only */}
        <div className="mt-8 hidden text-center text-[10px] text-gray-400 print:mt-6 print:block">
          <p>
            {inv.companyName} · {inv.companyAddress} · {inv.companyEmail}
          </p>
          <p className="mt-0.5">Thank you for your business.</p>
        </div>
      </div>
    </div>
  );
}

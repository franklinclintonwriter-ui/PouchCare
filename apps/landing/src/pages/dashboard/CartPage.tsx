/**
 * Full checkout page — line item list + sticky order summary sidebar on desktop.
 * The quick CartFlyout in the header covers the common "peek and remove" flow;
 * this page handles payment confirmation.
 */
import { Link } from "react-router-dom";
import { Minus, Package, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { usePlaceOrder } from "@/api/portal-dashboard";
import { paths } from "@/routes/paths";
import { formatUsd } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function CartPage() {
  const { lines, updateQty, remove, clear } = useCartStore();
  const place = usePlaceOrder();

  const subtotal = lines.reduce((acc, l) => acc + l.unitPriceUsd * l.quantity, 0);

  const checkout = async () => {
    if (!lines.length) return;
    try {
      for (const line of lines) {
        await place.mutateAsync({
          serviceId: line.serviceId,
          quantity: line.quantity,
          requirements: `Ordered from cart — ${line.name} (${line.slug})`,
        });
      }
      clear();
      toast.success("Order placed successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">Cart</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review your order. Each item creates a separate order charged to your wallet.
          </p>
        </div>
        <Link
          to={paths.dashboardServices}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-colors sm:min-h-0"
        >
          Browse services
        </Link>
      </div>

      {!lines.length ? (
        <DashboardPanel title="" description="">
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <ShoppingBag className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Your cart is empty</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Browse the service catalog and add items to get started.
              </p>
            </div>
            <Link
              to={paths.dashboardServices}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary-600 px-6 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              Browse services
            </Link>
          </div>
        </DashboardPanel>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
          {/* ── Line items ─────────────────────────────────────────────── */}
          <DashboardPanel
            title="Items"
            description={`${lines.length} item${lines.length > 1 ? "s" : ""} in your cart`}
          >
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {lines.map((line) => (
                <li key={line.serviceId} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100">
                      <Package className="h-5 w-5 text-primary-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{line.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{line.slug}</p>
                      <p className="mt-1 text-sm font-semibold text-primary-700">
                        {formatUsd(line.unitPriceUsd)} each
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {/* Quantity stepper */}
                    <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => updateQty(line.serviceId, line.quantity - 1)}
                        className="flex h-10 w-10 items-center justify-center text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 touch-manipulation"
                        aria-label={`Decrease ${line.name} quantity`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-[2.5rem] select-none px-1 text-center text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(line.serviceId, line.quantity + 1)}
                        className="flex h-10 w-10 items-center justify-center text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 touch-manipulation"
                        aria-label={`Increase ${line.name} quantity`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Line total */}
                    <span className="min-w-[5rem] text-right text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                      {formatUsd(line.unitPriceUsd * line.quantity)}
                    </span>
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => remove(line.serviceId)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 touch-manipulation"
                      aria-label={`Remove ${line.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </DashboardPanel>

          {/* ── Order summary (sticky on desktop) ─────────────────────── */}
          <div className="lg:sticky lg:top-[calc(4rem+1.25rem)]">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Order summary</h2>
              <dl className="space-y-2 border-b border-gray-100 dark:border-gray-800 pb-4 text-sm">
                {lines.map((l) => (
                  <div key={l.serviceId} className="flex justify-between gap-2">
                    <dt className="min-w-0 truncate text-gray-600 dark:text-gray-400">
                      {l.name} × {l.quantity}
                    </dt>
                    <dd className="shrink-0 tabular-nums text-gray-900 dark:text-gray-100">
                      {formatUsd(l.unitPriceUsd * l.quantity)}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-center justify-between text-base font-bold text-gray-900 dark:text-gray-100">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatUsd(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Wallet is charged per order. Ensure sufficient balance before checkout.
              </p>
              <Button
                type="button"
                variant="primary"
                className="mt-5 min-h-[52px] w-full touch-manipulation"
                disabled={place.isPending}
                onClick={() => void checkout()}
              >
                {place.isPending ? "Placing orders…" : `Checkout — ${formatUsd(subtotal)}`}
              </Button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Clear all items from your cart?")) clear();
                }}
                className="mt-2 w-full py-2 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

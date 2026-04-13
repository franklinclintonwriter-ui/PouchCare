import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { usePublicServices } from "@/api/portal-dashboard";
import { useCartStore } from "@/stores/cartStore";
import { paths } from "@/routes/paths";
import { formatUsd } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function ServicesPage() {
  const { data, isLoading, isError } = usePublicServices();
  const add = useCartStore((s) => s.add);

  return (
    <DashboardPanel
      title="Services"
      description="Browse active services and add them to your cart for checkout."
      action={
        <Link to={paths.dashboardCart} className="block w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="w-full touch-manipulation sm:w-auto"
            icon={<ShoppingCart className="h-4 w-4" />}
          >
            View cart
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading catalog…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">Could not load services.</p>
      ) : !data?.length ? (
        <p className="text-sm text-gray-500">No services available.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.map((s) => {
            const price = s.basePriceUsd ?? 0;
            return (
              <li
                key={s.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-gray-50/50 p-4"
              >
                <div className="flex flex-1 flex-col">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                    {s.category ?? "Service"}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">
                    {s.name}
                  </h3>
                  {s.shortDescription && (
                    <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                      {s.shortDescription}
                    </p>
                  )}
                  <p className="mt-3 text-xl font-bold text-gray-900">
                    {formatUsd(price)}
                    {s.turnaroundDays != null && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        · ~{s.turnaroundDays} days
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  className="mt-4 w-full sm:w-auto"
                  onClick={() => {
                    add({
                      serviceId: s.id,
                      name: s.name,
                      slug: s.slug,
                      unitPriceUsd: price,
                      quantity: 1,
                    });
                    toast.success("Added to cart");
                  }}
                >
                  Add to cart
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}

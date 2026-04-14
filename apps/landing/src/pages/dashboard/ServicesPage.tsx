import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Search } from "lucide-react";
import { usePublicServices } from "@/api/portal-dashboard";
import { useCartStore } from "@/stores/cartStore";
import { paths } from "@/routes/paths";
import { formatUsd } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

export default function ServicesPage() {
  const { data, isLoading, isError } = usePublicServices();
  const add = useCartStore((s) => s.add);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = useMemo(() => {
    if (!data) return ["All"];
    const cats = new Set(data.map((s) => s.category ?? "Service"));
    return ["All", ...Array.from(cats).sort()];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (selectedCategory !== "All") {
      list = list.filter((s) => (s.category ?? "Service") === selectedCategory);
    }
    return list;
  }, [data, searchQuery, selectedCategory]);

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
        <>
          {/* Search and filter bar */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search services…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-[40px] pl-9 text-sm"
              />
            </div>
            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    selectedCategory === cat
                      ? "bg-primary-100 text-primary-800"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Services grid */}
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No services match your filters.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filtered.map((s) => {
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
        </>
      )}
    </DashboardPanel>
  );
}

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
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

export default function ServicesPage() {
  const query = usePublicServices();
  const { data, isLoading, isError, error, refetch } = query;
  const add = useCartStore((s) => s.add);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

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
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <li>
            <SkeletonCard />
          </li>
          <li>
            <SkeletonCard />
          </li>
          <li className="hidden sm:block">
            <SkeletonCard />
          </li>
          <li className="hidden sm:block">
            <SkeletonCard />
          </li>
        </ul>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState
          icon={<ShoppingCart />}
          title="No services available"
          description="Please check back later. If you believe this is a mistake, contact support."
          action={
            <Link to={paths.dashboardSupport}>
              <Button size="sm" variant="outline">
                Contact support
              </Button>
            </Link>
          }
        />
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
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Services grid */}
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title={searchQuery.trim() ? "No results" : "No services match"}
              description={
                searchQuery.trim()
                  ? "Try a different search term or clear filters."
                  : "Try clearing filters."
              }
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filtered.map((s) => {
                const price = s.basePriceUsd ?? 0;
                const desc = s.shortDescription ?? "";
                const isExpanded = expanded.has(s.id);
                const canToggle = desc.trim().length > 140;
                return (
                  <li
                    key={s.id}
                    className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-4"
                  >
                    <div className="flex flex-1 flex-col">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                        {s.category ?? "Service"}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {s.name}
                      </h3>
                      {s.shortDescription && (
                        <p
                          className={cn(
                            "mt-2 text-sm text-gray-600 dark:text-gray-400",
                            !isExpanded && "line-clamp-3",
                          )}
                        >
                          {s.shortDescription}
                        </p>
                      )}
                      {canToggle && (
                        <button
                          type="button"
                          className="mt-2 self-start text-xs font-semibold text-primary-700 hover:text-primary-800"
                          onClick={() => {
                            setExpanded((prev) => {
                              const next = new Set(prev);
                              if (next.has(s.id)) next.delete(s.id);
                              else next.add(s.id);
                              return next;
                            });
                          }}
                        >
                          {isExpanded ? "Show less" : "Read more"}
                        </button>
                      )}
                      <p className="mt-3 text-xl font-bold text-gray-900 dark:text-gray-100">
                        {formatUsd(price)}
                        {s.turnaroundDays != null && (
                          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
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

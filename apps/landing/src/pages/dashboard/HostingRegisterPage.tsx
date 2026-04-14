/**
 * Domain search + hosting plan picker. Wire to registrar API.
 * @see HOSTING_PORTAL.md — keep forms and grids responsive (1 col → 2 → 3).
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Globe2, Loader2, Search } from "lucide-react";
import { paths } from "@/routes/paths";
import { useSearchDomains, useRegisterDomain } from "@/api/portal-hosting";
import { formatUsd } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { HostingPlanCard } from "@/components/hosting/HostingPlanCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

const HOSTING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    blurb: "Single site, email forwarding, free SSL.",
    monthlyUsd: 6.5,
    features: ["5 GB SSD", "Unmetered bandwidth", "Weekly backups"],
  },
  {
    id: "business",
    name: "Business Pro",
    blurb: "Production SLA, staging, priority DNS.",
    monthlyUsd: 24.99,
    features: ["100 GB SSD", "500 GB transfer", "Daily backups", "Staging"],
  },
  {
    id: "scale",
    name: "Scale",
    blurb: "High traffic, dedicated support channel.",
    monthlyUsd: 89,
    features: ["200 GB SSD", "Dedicated pool", "Hourly backups"],
  },
];

const DEFAULT_PLAN =
  HOSTING_PLANS[1] ?? HOSTING_PLANS[0]!;

export default function HostingRegisterPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [checkoutPlanId, setCheckoutPlanId] = useState<string>(DEFAULT_PLAN.id);

  const selectedPlan =
    HOSTING_PLANS.find((p) => p.id === checkoutPlanId) ?? DEFAULT_PLAN;

  const { data: suggestions = [], isLoading: searchLoading } =
    useSearchDomains(submitted);

  const registerMutation = useRegisterDomain();

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      toast.error("Enter at least 2 characters (e.g. mybrand)");
      return;
    }
    setSubmitted(q);
  };

  const addDomainToPortfolio = async (fqdn: string) => {
    try {
      await registerMutation.mutateAsync({
        fqdn,
        planId: checkoutPlanId,
        planName: selectedPlan.name,
        monthlyUsd: selectedPlan.monthlyUsd,
      });
      toast.success(`Registered ${fqdn} (${selectedPlan.name})`);
      navigate(paths.dashboardHosting);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not register domain");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardPanel
        title="Search & register"
        description="Check mock availability and pricing. Checkout will connect to billing when live."
      >
        <form
          onSubmit={runSearch}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="domain-q">Domain name</Label>
            <Input
              id="domain-q"
              name="domain"
              type="text"
              autoComplete="off"
              placeholder="e.g. myproject or myproject.com"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[48px] text-base sm:text-sm"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={searchLoading}
            className="min-h-[48px] w-full shrink-0 px-6 sm:w-auto sm:min-h-[44px]"
            icon={
              searchLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Search className="h-4 w-4" aria-hidden />
              )
            }
          >
            Search
          </Button>
        </form>

        {suggestions.length > 0 && (
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {suggestions.map((s) => (
              <li
                key={s.fqdn}
                className={
                  s.available
                    ? "flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:border-primary-200 hover:shadow-lg"
                    : "flex flex-col rounded-xl border border-dashed border-gray-200 bg-slate-50 p-4 opacity-90 transition-shadow"
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="break-all font-mono text-sm font-semibold text-gray-900 sm:text-base">
                    {s.fqdn}
                  </span>
                  <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {s.tld}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500 sm:text-sm">
                  {s.available ? "Available" : "Taken"}
                </p>
                <p className="mt-3 text-lg font-bold tabular-nums text-gray-900">
                  {formatUsd(s.pricePerYearUsd)}
                  <span className="text-sm font-normal text-gray-500"> /yr</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Hosting: {selectedPlan.name} ({formatUsd(selectedPlan.monthlyUsd)}
                  /mo)
                </p>
                <Button
                  type="button"
                  variant={s.available ? "primary" : "outline"}
                  size="sm"
                  disabled={!s.available || registerMutation.isPending}
                  className="mt-4 w-full min-h-[44px] sm:min-h-0"
                  onClick={() => addDomainToPortfolio(s.fqdn)}
                >
                  {s.available ? "Register & host" : "Unavailable"}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {!submitted && (
          <p className="mt-6 text-center text-sm text-gray-500">
            Enter a name and tap Search to check availability.
          </p>
        )}
      </DashboardPanel>

      <DashboardPanel
        title="Hosting plans"
        description="Pair a domain with managed hosting (mock pricing). The selected plan is used when you add a domain from search."
      >
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {HOSTING_PLANS.map((plan, i) => (
            <HostingPlanCard
              key={plan.id}
              plan={plan}
              index={i}
              className={cn(
                checkoutPlanId === plan.id &&
                  "ring-2 ring-primary-400 ring-offset-2",
              )}
              onSelectPlan={(p) => {
                setCheckoutPlanId(p.id);
                toast.message(`Using ${p.name} plan`);
              }}
            />
          ))}
        </ul>
      </DashboardPanel>

      <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Already own domains?
            </p>
            <p className="mt-0.5 text-sm text-gray-600">
              Manage DNS and renewals under My domains.
            </p>
          </div>
        </div>
        <Link
          to={paths.dashboardHosting}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:bg-gray-50 sm:min-h-0"
        >
          Open My domains
        </Link>
      </div>
    </div>
  );
}

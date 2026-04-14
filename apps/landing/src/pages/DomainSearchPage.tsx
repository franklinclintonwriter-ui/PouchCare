/**
 * Public domain search page — no login required.
 * Users can search for domains, pick a hosting plan, and add to cart.
 * Cart actions redirect to login if the visitor is not authenticated.
 */
import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Globe2,
  Search,
  ShoppingCart,
  Loader2,
  ArrowRight,
  Check,
  Server,
} from "lucide-react";
import { PageSEO } from "@/components/seo/PageSEO";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  SectionLabel,
  SectionHeading,
  SectionSub,
} from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { HostingPlanCard } from "@/components/hosting/HostingPlanCard";
import { useCartStore } from "@/stores/cartStore";
import { usePortalAuthStore } from "@/stores/portalAuthStore";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/cn";
import { paths } from "@/routes/paths";
import { toast } from "sonner";

/* ── Mock TLD pricing (matches API mock) ────────────────────────────── */

interface DomainSuggestion {
  fqdn: string;
  tld: string;
  available: boolean;
  pricePerYearUsd: number;
}

const TLD_PRICES: { tld: string; price: number }[] = [
  { tld: ".com", price: 12.99 },
  { tld: ".net", price: 11.99 },
  { tld: ".io", price: 34.99 },
  { tld: ".co", price: 29.99 },
  { tld: ".dev", price: 14.99 },
  { tld: ".org", price: 9.99 },
  { tld: ".app", price: 19.99 },
  { tld: ".xyz", price: 4.99 },
];

/** Deterministic-ish availability based on domain string hash. */
function isAvailable(fqdn: string): boolean {
  let h = 0;
  for (let i = 0; i < fqdn.length; i++) h = (h * 31 + fqdn.charCodeAt(i)) | 0;
  return Math.abs(h) % 3 !== 0; // ~67 % available
}

function buildSuggestions(query: string): DomainSuggestion[] {
  const base = query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9-]/g, "");
  if (!base) return [];
  return TLD_PRICES.map(({ tld, price }) => {
    const fqdn = base.includes(".") ? base : `${base}${tld}`;
    return { fqdn, tld, available: isAvailable(fqdn), pricePerYearUsd: price };
  });
}

/* ── Hosting plans (same as ServicesHostingPage / HostingRegisterPage) ─ */

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

const DEFAULT_PLAN = HOSTING_PLANS[1]!;

/* ── Page ────────────────────────────────────────────────────────────── */

export default function DomainSearchPage() {
  const navigate = useNavigate();
  const addToCart = useCartStore((s) => s.add);
  const cartLines = useCartStore((s) => s.lines);
  const isAuthenticated = usePortalAuthStore((s) => s.isAuthenticated);

  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<DomainSuggestion[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState(DEFAULT_PLAN.id);

  const selectedPlan =
    HOSTING_PLANS.find((p) => p.id === selectedPlanId) ?? DEFAULT_PLAN;

  const runSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (q.length < 2) {
        toast.error("Enter at least 2 characters (e.g. mybrand)");
        return;
      }
      setSearching(true);
      setSubmitted(q);
      // Simulate brief network delay
      setTimeout(() => {
        setResults(buildSuggestions(q));
        setSearching(false);
      }, 400);
    },
    [query],
  );

  const handleAddToCart = (s: DomainSuggestion) => {
    addToCart({
      serviceId: `domain-${s.fqdn}`,
      name: `${s.fqdn} — ${selectedPlan.name} hosting`,
      slug: s.fqdn,
      unitPriceUsd: s.pricePerYearUsd + selectedPlan.monthlyUsd * 12,
    });
    toast.success(`${s.fqdn} added to cart`);
  };

  const goToCheckout = () => {
    if (isAuthenticated) {
      navigate(paths.dashboardCart);
    } else {
      navigate(paths.login, {
        state: { from: paths.dashboardCart },
      });
    }
  };

  const inCart = (fqdn: string) =>
    cartLines.some((l) => l.serviceId === `domain-${fqdn}`);

  const totalItems = cartLines.length;

  return (
    <>
      <PageSEO
        title="Domain Name Search — Check Availability & Register Instantly"
        description="Search domain availability across .com, .net, .io, .dev and 8+ TLDs. Compare prices, bundle with managed hosting, and register your perfect domain name today."
        canonical="/services/hosting/search"
        keywords="domain search, domain name availability, register domain, buy domain name, cheap domain registration, domain name checker, PouchCare domains"
      />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-violet-50 via-white to-gray-50 pt-[68px] pb-10 sm:pb-16">
        <div className="container-max relative z-10 px-4 text-center sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel>Domain search</SectionLabel>
            <SectionHeading className="mb-4">
              Find your perfect{" "}
              <span className="text-gradient">domain name</span>
            </SectionHeading>
            <SectionSub className="mx-auto mb-8 max-w-2xl">
              Search availability across popular TLDs, pair with managed
              hosting, and add to cart. No account needed to browse — sign in
              when you are ready to purchase.
            </SectionSub>
          </ScrollReveal>

          {/* Search form */}
          <form
            onSubmit={runSearch}
            className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="relative min-w-0 flex-1">
              <Globe2
                className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <Input
                name="domain"
                type="text"
                autoComplete="off"
                placeholder="e.g. mybrand or mybrand.com"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[50px] pl-11 text-base"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={searching}
              className="min-h-[50px] w-full shrink-0 sm:w-auto"
              icon={
                searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Search className="h-4 w-4" aria-hidden />
                )
              }
            >
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────── */}
      {results.length > 0 && (
        <section className="section-pad border-b border-gray-100 bg-white">
          <div className="container-max">
            <ScrollReveal>
              <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-sora text-lg font-bold text-gray-900">
                    Results for &ldquo;{submitted}&rdquo;
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {results.filter((r) => r.available).length} of{" "}
                    {results.length} domains available
                  </p>
                </div>
                {totalItems > 0 && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={goToCheckout}
                    icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
                    iconRight={
                      <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                        {totalItems}
                      </span>
                    }
                  >
                    Proceed to checkout
                  </Button>
                )}
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {results.map((s) => {
                const added = inCart(s.fqdn);
                return (
                  <div
                    key={s.fqdn}
                    className={cn(
                      "flex flex-col rounded-xl border p-4 shadow-sm transition-all",
                      s.available
                        ? added
                          ? "border-emerald-300 bg-emerald-50/50 shadow-emerald-100"
                          : "border-gray-200 bg-white hover:border-primary-200 hover:shadow-lg"
                        : "border-dashed border-gray-200 bg-slate-50 opacity-90",
                    )}
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
                      {s.available ? (
                        <span className="text-emerald-600 font-medium">
                          Available
                        </span>
                      ) : (
                        "Taken"
                      )}
                    </p>
                    <p className="mt-3 text-lg font-bold tabular-nums text-gray-900">
                      {formatUsd(s.pricePerYearUsd)}
                      <span className="text-sm font-normal text-gray-500">
                        {" "}
                        /yr
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      + {selectedPlan.name} hosting (
                      {formatUsd(selectedPlan.monthlyUsd)}/mo)
                    </p>
                    <Button
                      type="button"
                      variant={
                        added ? "outline" : s.available ? "primary" : "outline"
                      }
                      size="sm"
                      disabled={!s.available || added}
                      className="mt-4 w-full min-h-[44px] sm:min-h-0"
                      onClick={() => handleAddToCart(s)}
                      icon={
                        added ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ShoppingCart className="h-4 w-4" />
                        )
                      }
                    >
                      {added
                        ? "In cart"
                        : s.available
                          ? "Add to cart"
                          : "Unavailable"}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Floating cart bar (mobile) */}
            {totalItems > 0 && (
              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-4 backdrop-blur sm:hidden">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={goToCheckout}
                  icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
                >
                  Checkout ({totalItems} item{totalItems > 1 ? "s" : ""})
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Idle state */}
      {!submitted && results.length === 0 && (
        <section className="py-16 bg-white">
          <div className="container-max px-4 text-center">
            <Globe2 className="mx-auto h-12 w-12 text-gray-200" />
            <p className="mt-4 text-sm text-gray-500">
              Enter a domain name above and tap{" "}
              <span className="font-semibold text-gray-700">Search</span> to
              check availability.
            </p>
          </div>
        </section>
      )}

      {/* ── Hosting plan picker ──────────────────────────────────── */}
      <section className="section-pad bg-gray-50/80">
        <div className="container-max">
          <ScrollReveal>
            <div className="mb-10 text-center">
              <SectionLabel>Hosting plans</SectionLabel>
              <SectionHeading className="mb-3 text-xl sm:text-2xl">
                Pair your domain with managed hosting
              </SectionHeading>
              <SectionSub className="mx-auto max-w-lg">
                Select a plan below — it will be bundled with every domain you
                add to cart.
              </SectionSub>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {HOSTING_PLANS.map((plan, i) => (
              <ScrollReveal key={plan.id} delay={i * 60}>
                <HostingPlanCard
                  plan={plan}
                  index={i}
                  asListItem={false}
                  className={cn(
                    selectedPlanId === plan.id &&
                      "ring-2 ring-primary-400 ring-offset-2",
                  )}
                  onSelectPlan={(p) => {
                    setSelectedPlanId(p.id);
                    toast.message(`Using ${p.name} plan`);
                  }}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <section className="section-pad">
        <div className="container-max">
          <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-start gap-3">
              <Server className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
              <div>
                <p className="font-sora text-base font-bold text-gray-900">
                  Already have an account?
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Log in to manage your domains, DNS records, and renewals from
                  the dashboard.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                to={paths.login}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-700 touch-manipulation"
              >
                Sign in
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
              <Link
                to="/services/hosting"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 touch-manipulation"
              >
                Hosting overview
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

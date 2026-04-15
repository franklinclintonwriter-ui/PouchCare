/**
 * Public domain search page — no login required.
 * Attractive, professional, fully responsive with real Name.com results.
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
  Shield,
  Zap,
  Star,
  Gift,
  Users,
  BadgeCheck,
  Sparkles,
  TrendingUp,
  Lock,
  HeadphonesIcon,
  ChevronRight,
  X,
} from "lucide-react";
import { PageSEO } from "@/components/seo/PageSEO";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cartStore";
import { usePortalAuthStore } from "@/stores/portalAuthStore";
import {
  usePublicDomainSearch,
  type DomainSearchResult,
} from "@/api/portal-hosting";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/cn";
import { paths } from "@/routes/paths";
import { toast } from "sonner";

/* ── Plans ────────────────────────────────────────────────────────────── */
const HOSTING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    badge: null,
    blurb: "Perfect for personal sites & blogs.",
    monthlyUsd: 6.5,
    yearlyUsd: 6.5 * 12,
    color: "from-sky-500 to-blue-600",
    accent: "bg-sky-50 border-sky-200 text-sky-700",
    features: [
      "5 GB NVMe SSD",
      "Free SSL certificate",
      "Email forwarding",
      "Weekly backups",
      "1 website",
    ],
  },
  {
    id: "business",
    name: "Business Pro",
    badge: "Most Popular",
    blurb: "For growing businesses & agencies.",
    monthlyUsd: 24.99,
    yearlyUsd: 24.99 * 12,
    color: "from-primary-600 to-violet-600",
    accent: "bg-primary-50 border-primary-300 text-primary-700",
    features: [
      "100 GB NVMe SSD",
      "Staging environment",
      "Daily backups",
      "Priority DNS",
      "Unlimited sites",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    badge: "Best Value",
    blurb: "High-traffic & enterprise workloads.",
    monthlyUsd: 89,
    yearlyUsd: 89 * 12,
    color: "from-violet-600 to-purple-700",
    accent: "bg-violet-50 border-violet-200 text-violet-700",
    features: [
      "200 GB NVMe SSD",
      "Dedicated pool",
      "Hourly backups",
      "24/7 priority support",
      "Custom nameservers",
    ],
  },
];
const DEFAULT_PLAN = HOSTING_PLANS[1]!;

/* ── Trust badges ─────────────────────────────────────────────────────── */
const TRUST_ITEMS = [
  { icon: Shield, label: "Free SSL on all domains" },
  { icon: Zap, label: "< 1s propagation" },
  { icon: BadgeCheck, label: "99.9% uptime SLA" },
  { icon: HeadphonesIcon, label: "24/7 expert support" },
];

/* ── Popular TLD quick-picks ──────────────────────────────────────────── */
const POPULAR_TLDS = [
  ".com",
  ".net",
  ".io",
  ".co",
  ".dev",
  ".app",
  ".store",
  ".tech",
];

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function DomainSearchPage() {
  const navigate = useNavigate();
  const addToCart = useCartStore((s) => s.add);
  const cartLines = useCartStore((s) => s.lines);
  const isAuthenticated = usePortalAuthStore((s) => s.isAuthenticated);

  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(DEFAULT_PLAN.id);
  const [memberBannerDismissed, setMemberBannerDismissed] = useState(false);

  const selectedPlan =
    HOSTING_PLANS.find((p) => p.id === selectedPlanId) ?? DEFAULT_PLAN;

  const { data: results = [], isLoading: searching } =
    usePublicDomainSearch(submitted);

  const available = results.filter((r) => r.available);
  const taken = results.filter((r) => !r.available);

  const runSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim().toLowerCase().replace(/\s+/g, "");
      if (q.length < 2) {
        toast.error("Enter at least 2 characters");
        return;
      }
      setSubmitted(q);
    },
    [query],
  );

  const handleAddToCart = (s: DomainSearchResult) => {
    addToCart({
      serviceId: `domain-${s.fqdn}`,
      name: `${s.fqdn} — ${selectedPlan.name} hosting`,
      slug: s.fqdn,
      unitPriceUsd: s.pricePerYearUsd + selectedPlan.monthlyUsd * 12,
    });
    toast.success(`${s.fqdn} added to cart`);
  };

  const goToCheckout = () => {
    if (isAuthenticated) navigate(paths.dashboardCart);
    else navigate(paths.login, { state: { from: paths.dashboardCart } });
  };

  const inCart = (fqdn: string) =>
    cartLines.some((l) => l.serviceId === `domain-${fqdn}`);
  const totalItems = cartLines.length;

  return (
    <>
      <PageSEO
        title="Domain Name Search — Check Availability & Register Instantly | PouchCare"
        description="Search domain availability across .com, .net, .io, .dev and 50+ TLDs powered by Name.com. Bundle with managed hosting at unbeatable prices. Join PouchCare today."
        canonical="/services/hosting/search"
        keywords="domain search, domain availability checker, register domain, buy domain, cheap domain registration, PouchCare hosting"
      />

      {/* ── Member promo banner ───────────────────────────────────── */}
      {!isAuthenticated && !memberBannerDismissed && (
        <div className="relative z-30 bg-gradient-to-r from-primary-700 via-primary-600 to-violet-600 text-white">
          <div className="container-max flex items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <Gift className="h-4 w-4 shrink-0 text-yellow-300" aria-hidden />
              <span className="truncate">
                <span className="font-bold text-yellow-300">
                  Members save up to 60%
                </span>{" "}
                — Free SSL &amp; daily backups included on all plans.{" "}
                <Link
                  to={paths.register}
                  className="underline underline-offset-2 hover:text-yellow-200 transition-colors"
                >
                  Join free →
                </Link>
              </span>
            </div>
            <button
              onClick={() => setMemberBannerDismissed(true)}
              className="shrink-0 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#080e1a] pt-[72px] pb-14 sm:pb-20">
        {/* Animated mesh background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.35) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(124,58,237,0.18) 0%, transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hero-grid opacity-30"
        />

        <div className="container-max relative z-10 px-4 sm:px-6 lg:px-8">
          {/* Eyebrow */}
          <ScrollReveal>
            <div className="mb-5 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-500/30 bg-primary-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-primary-300">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Powered by Name.com — 50+ TLDs
              </span>
            </div>

            <h1 className="font-sora mx-auto mb-4 max-w-3xl text-center text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">
              Find &amp; claim your{" "}
              <span
                style={{
                  background: "linear-gradient(135deg,#60a5fa 0%,#a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                perfect domain
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-xl text-center text-base text-gray-400 sm:text-lg">
              Real-time availability across every major TLD. Bundle with managed
              hosting and launch today.
            </p>
          </ScrollReveal>

          {/* ── Search bar ─────────────────────────────────────── */}
          <ScrollReveal delay={80}>
            <form
              onSubmit={runSearch}
              className="mx-auto flex max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-[0_8px_40px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:rounded-[20px]"
            >
              <div className="relative min-w-0 flex-1">
                <Globe2
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <input
                  name="domain"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="yourname, yourname.com, mybrand…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-12 w-full bg-transparent pl-12 pr-4 text-base text-white placeholder-gray-500 outline-none sm:h-14 sm:text-lg"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white transition-all hover:bg-primary-500 active:scale-[0.97] disabled:opacity-70 sm:h-14 sm:px-7 sm:text-base"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Search className="h-4 w-4" aria-hidden />
                )}
                <span className="hidden sm:inline">
                  {searching ? "Searching…" : "Search"}
                </span>
              </button>
            </form>

            {/* Popular TLD pills */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {POPULAR_TLDS.map((tld) => (
                <button
                  key={tld}
                  type="button"
                  onClick={() => {
                    const base =
                      query.replace(/\.[a-z]+$/, "").trim() || "mybrand";
                    const q = base + tld;
                    setQuery(q);
                    setSubmitted(q);
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-400 transition-colors hover:border-primary-500/50 hover:bg-primary-500/10 hover:text-primary-300"
                >
                  {tld}
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* Trust badges */}
          <ScrollReveal delay={140}>
            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-xs text-gray-500"
                >
                  <Icon className="h-3.5 w-3.5 text-primary-400" aria-hidden />
                  {label}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Searching skeleton ────────────────────────────────────── */}
      {searching && (
        <section className="bg-gray-50 py-12">
          <div className="container-max px-4 sm:px-6">
            <div className="mb-6 h-6 w-48 animate-pulse rounded-lg bg-gray-200" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl bg-gray-200"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Results ──────────────────────────────────────────────── */}
      {!searching && results.length > 0 && (
        <section className="bg-gray-50 py-12 sm:py-16">
          <div className="container-max px-4 sm:px-6 lg:px-8">
            {/* Results header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-sora text-xl font-bold text-gray-900 sm:text-2xl">
                  Results for{" "}
                  <span className="text-primary-600">
                    &ldquo;{submitted}&rdquo;
                  </span>
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  <span className="font-semibold text-emerald-600">
                    {available.length} available
                  </span>{" "}
                  · {taken.length} taken · powered by Name.com
                </p>
              </div>
              {totalItems > 0 && (
                <button
                  onClick={goToCheckout}
                  className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-500 active:scale-[0.97]"
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden />
                  Checkout
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-black">
                    {totalItems}
                  </span>
                </button>
              )}
            </div>

            {/* Plan selector strip */}
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Bundle with hosting plan
              </p>
              <div className="flex flex-wrap gap-2">
                {HOSTING_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
                      selectedPlanId === plan.id
                        ? "border-primary-400 bg-primary-50 text-primary-700 shadow-sm"
                        : "border-gray-200 text-gray-600 hover:border-primary-200 hover:bg-gray-50",
                    )}
                  >
                    {plan.badge && (
                      <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {plan.badge}
                      </span>
                    )}
                    {plan.name}
                    <span className="text-gray-400">
                      {formatUsd(plan.monthlyUsd)}/mo
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Available domains grid */}
            {available.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    Available ({available.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {available.map((s) => {
                    const added = inCart(s.fqdn);
                    const isPremium = (s as any).premium === true;
                    return (
                      <div
                        key={s.fqdn}
                        className={cn(
                          "card-hover group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-5 shadow-sm",
                          added
                            ? "border-emerald-300 bg-emerald-50/60 shadow-emerald-100"
                            : "border-gray-200 hover:border-primary-300 hover:shadow-md",
                        )}
                      >
                        {/* Shimmer line at top */}
                        {!added && (
                          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary-500 to-violet-500 opacity-0 transition-opacity group-hover:opacity-100" />
                        )}

                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="break-all font-mono text-sm font-bold text-gray-900 sm:text-[15px]">
                              {s.fqdn}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span className="text-xs font-medium text-emerald-600">
                                Available
                              </span>
                              {isPremium && (
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                  Premium
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">
                            .{s.tld}
                          </span>
                        </div>

                        <div className="mt-auto">
                          <div className="mb-3">
                            <span className="text-2xl font-extrabold tabular-nums text-gray-900">
                              {formatUsd(s.pricePerYearUsd)}
                            </span>
                            <span className="text-sm text-gray-400">/yr</span>
                            <p className="mt-0.5 text-xs text-gray-400">
                              + {formatUsd(selectedPlan.monthlyUsd)}/mo hosting
                            </p>
                          </div>

                          <button
                            disabled={added}
                            onClick={() => handleAddToCart(s)}
                            className={cn(
                              "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.97]",
                              added
                                ? "bg-emerald-100 text-emerald-700 cursor-default"
                                : "bg-primary-600 text-white shadow-sm shadow-primary-600/20 hover:bg-primary-500",
                            )}
                          >
                            {added ? (
                              <>
                                <Check className="h-4 w-4" aria-hidden />
                                In cart
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-4 w-4" aria-hidden />
                                Add to cart
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Taken domains row */}
            {taken.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-300" />
                  <span className="text-sm font-semibold text-gray-400">
                    Taken ({taken.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {taken.map((s) => (
                    <div
                      key={s.fqdn}
                      className="flex items-center justify-between rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 opacity-70"
                    >
                      <span className="font-mono text-sm font-medium text-gray-500">
                        {s.fqdn}
                      </span>
                      <span className="rounded-md bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                        Taken
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inline member CTA after results */}
            {!isAuthenticated && <MemberBannerInline />}
          </div>
        </section>
      )}

      {/* ── Idle state ───────────────────────────────────────────── */}
      {!searching && !submitted && (
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="container-max px-4 sm:px-6 lg:px-8">
            {/* Popular extensions showcase */}
            <ScrollReveal>
              <div className="mb-12 text-center">
                <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-gray-400">
                  Search across 50+ popular extensions
                </p>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  {[
                    {
                      tld: ".com",
                      color: "bg-blue-50 text-blue-700 border-blue-200",
                    },
                    {
                      tld: ".net",
                      color: "bg-sky-50 text-sky-700 border-sky-200",
                    },
                    {
                      tld: ".io",
                      color: "bg-violet-50 text-violet-700 border-violet-200",
                    },
                    {
                      tld: ".co",
                      color:
                        "bg-emerald-50 text-emerald-700 border-emerald-200",
                    },
                    {
                      tld: ".dev",
                      color: "bg-orange-50 text-orange-700 border-orange-200",
                    },
                    {
                      tld: ".app",
                      color: "bg-pink-50 text-pink-700 border-pink-200",
                    },
                    {
                      tld: ".store",
                      color: "bg-amber-50 text-amber-700 border-amber-200",
                    },
                    {
                      tld: ".tech",
                      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
                    },
                    {
                      tld: ".org",
                      color: "bg-teal-50 text-teal-700 border-teal-200",
                    },
                    {
                      tld: ".ai",
                      color:
                        "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
                    },
                  ].map(({ tld, color }) => (
                    <span
                      key={tld}
                      className={cn(
                        "rounded-xl border px-4 py-2 font-mono text-sm font-bold",
                        color,
                      )}
                    >
                      {tld}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Feature cards */}
            <ScrollReveal delay={60}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    icon: Zap,
                    title: "Instant results",
                    desc: "Real-time availability from Name.com registry in seconds.",
                    color: "text-amber-500",
                    bg: "bg-amber-50",
                  },
                  {
                    icon: Lock,
                    title: "Free SSL included",
                    desc: "Every domain gets a certificate automatically on activation.",
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                  },
                  {
                    icon: Shield,
                    title: "WHOIS privacy",
                    desc: "Your personal details stay private at no extra charge.",
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                  },
                  {
                    icon: TrendingUp,
                    title: "One-click renew",
                    desc: "Auto-renew from your dashboard — never lose a domain again.",
                    color: "text-violet-600",
                    bg: "bg-violet-50",
                  },
                ].map(({ icon: Icon, title, desc, color, bg }) => (
                  <div
                    key={title}
                    className="card-hover rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div
                      className={cn("mb-3 inline-flex rounded-xl p-2.5", bg)}
                    >
                      <Icon className={cn("h-5 w-5", color)} aria-hidden />
                    </div>
                    <h3 className="mb-1 font-sora text-sm font-bold text-gray-900">
                      {title}
                    </h3>
                    <p className="text-xs leading-relaxed text-gray-500">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── Hosting plans section ─────────────────────────────────── */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-12 text-center">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-primary-600">
                <Star className="h-3.5 w-3.5" aria-hidden />
                Managed hosting plans
              </span>
              <h2 className="font-sora mt-3 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Bundle domain +{" "}
                <span className="text-gradient">hosting &amp; save</span>
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500 sm:text-base">
                Every PouchCare plan includes free SSL, email forwarding, and
                DNS management. No hidden fees.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {HOSTING_PLANS.map((plan, i) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <ScrollReveal key={plan.id} delay={i * 80}>
                  <div
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={cn(
                      "card-hover relative cursor-pointer rounded-2xl border-2 bg-white p-6 shadow-sm transition-all",
                      isSelected
                        ? "border-primary-500 shadow-lg shadow-primary-500/10"
                        : "border-gray-200 hover:border-primary-300",
                    )}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white",
                            `bg-gradient-to-r ${plan.color}`,
                          )}
                        >
                          <Star className="h-3 w-3" aria-hidden />
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    <div
                      className={cn(
                        "mb-4 inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold",
                        plan.accent,
                      )}
                    >
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full bg-gradient-to-r",
                          plan.color,
                        )}
                      />
                      {plan.name}
                    </div>

                    <div className="mb-1">
                      <span className="text-3xl font-extrabold text-gray-900">
                        {formatUsd(plan.monthlyUsd)}
                      </span>
                      <span className="text-sm text-gray-400">/mo</span>
                    </div>
                    <p className="mb-4 text-xs text-gray-400">
                      {formatUsd(plan.yearlyUsd)} billed annually
                    </p>

                    <p className="mb-4 text-sm text-gray-600">{plan.blurb}</p>

                    <ul className="mb-5 space-y-2">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-sm text-gray-700"
                        >
                          <Check
                            className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                            aria-hidden
                          />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all",
                        isSelected
                          ? `bg-gradient-to-r ${plan.color} text-white shadow-sm`
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                      )}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-4 w-4" aria-hidden />
                          Selected plan
                        </>
                      ) : (
                        "Select plan"
                      )}
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Become a member CTA ──────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="relative overflow-hidden bg-[#080e1a] py-16 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(37,99,235,0.25) 0%, transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hero-grid opacity-20"
          />

          <div className="container-max relative z-10 px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mx-auto max-w-3xl text-center">
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-yellow-400">
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  Join 1,000+ members
                </span>

                <h2 className="font-sora mt-4 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
                  Unlock the full{" "}
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg,#fbbf24 0%,#f97316 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    PouchCare
                  </span>{" "}
                  experience
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-gray-400 sm:text-lg">
                  Create a free account to purchase domains, manage DNS, track
                  renewals, and access exclusive member pricing — all from one
                  dashboard.
                </p>

                {/* Perks grid */}
                <div className="mt-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
                  {[
                    { icon: Gift, text: "Member-only pricing — up to 60% off" },
                    {
                      icon: Shield,
                      text: "Free WHOIS privacy on every domain",
                    },
                    { icon: Zap, text: "One-click domain + hosting bundles" },
                    {
                      icon: BadgeCheck,
                      text: "Centralized DNS &amp; renewal dashboard",
                    },
                    {
                      icon: TrendingUp,
                      text: "Refer friends &amp; earn commissions",
                    },
                    {
                      icon: HeadphonesIcon,
                      text: "Dedicated 24/7 support team",
                    },
                  ].map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3"
                    >
                      <Icon
                        className="h-4 w-4 shrink-0 text-primary-400"
                        aria-hidden
                      />
                      <span
                        className="text-sm text-gray-300"
                        dangerouslySetInnerHTML={{ __html: text }}
                      />
                    </div>
                  ))}
                </div>

                {/* CTA buttons */}
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    to={paths.register}
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-600 to-violet-600 px-8 font-bold text-white shadow-xl shadow-primary-900/30 transition-all hover:from-primary-500 hover:to-violet-500 active:scale-[0.97] sm:w-auto sm:text-base"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Create free account
                  </Link>
                  <Link
                    to={paths.login}
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 text-sm font-semibold text-gray-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white sm:w-auto sm:text-base"
                  >
                    I already have an account
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>

                <p className="mt-4 text-xs text-gray-600">
                  No credit card required · Cancel anytime · Free forever tier
                  available
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── Social proof strip ───────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-white py-10">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {[
                { value: "50+", label: "TLD extensions" },
                { value: "99.9%", label: "Uptime SLA" },
                { value: "< 1s", label: "DNS propagation" },
                { value: "24/7", label: "Expert support" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="font-sora text-2xl font-extrabold text-gray-900 sm:text-3xl">
                    {value}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Floating checkout bar (mobile, when items in cart) ────── */}
      {totalItems > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-4 shadow-2xl backdrop-blur sm:hidden">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={goToCheckout}
            icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
          >
            Checkout · {totalItems} item{totalItems > 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </>
  );
}

/* ── Inline member CTA (shown between results and taken) ── */
function MemberBannerInline() {
  return (
    <ScrollReveal>
      <div className="mt-10 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-violet-700 p-6 shadow-xl shadow-primary-900/20 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-300" aria-hidden />
              <span className="text-xs font-bold uppercase tracking-widest text-yellow-300">
                Members save more
              </span>
            </div>
            <h3 className="font-sora text-lg font-extrabold text-white sm:text-xl">
              Purchase these domains &amp; get hosting free for 1 month
            </h3>
            <p className="mt-1 text-sm text-primary-200">
              Create a free PouchCare account to unlock member pricing, DNS
              management, and exclusive deals.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link
              to={paths.register}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.97]"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Join free
            </Link>
            <Link
              to={paths.login}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/20"
            >
              Sign in
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}

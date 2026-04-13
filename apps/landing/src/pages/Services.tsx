import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowRight,
  MessageCircle,
  CheckCircle,
  TrendingUp,
  Zap,
  Users,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  SectionLabel,
  SectionHeading,
  SectionSub,
} from "@/components/ui/SectionLabel";
import { PageSEO } from "@/components/seo/PageSEO";
import { getServices } from "@/lib/api";
import type { ServiceItem } from "@/lib/constants";
import { mergeWithMarketingHosting } from "@/data/marketingHosting";
import { paths } from "@/routes/paths";

const CATEGORIES = [
  "All",
  "Hosting",
  "SEO",
  "Dev",
  "Design",
  "Content",
  "Ads",
];

const BADGE_MAP: Record<
  string,
  "sky" | "indigo" | "green" | "yellow" | "red" | "slate"
> = {
  SEO: "sky",
  Hosting: "slate",
  Dev: "indigo",
  Development: "indigo",
  Design: "green",
  Content: "yellow",
  Ads: "red",
};

const CATEGORY_ACCENT: Record<string, string> = {
  SEO: "from-sky-500 to-blue-600",
  Hosting: "from-violet-500 to-purple-600",
  Dev: "from-indigo-500 to-violet-600",
  Development: "from-indigo-500 to-violet-600",
  Design: "from-emerald-500 to-teal-600",
  Content: "from-amber-500 to-orange-500",
  Ads: "from-rose-500 to-pink-600",
};

export default function Services() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    getServices().then((data) => {
      setServices(mergeWithMarketingHosting(data));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchesCat =
        category === "All" ||
        s.category === category ||
        s.category.startsWith(category);
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [services, search, category]);

  return (
    <>
      <PageSEO
        title="SEO & Digital Marketing Services"
        description="Browse PouchCare's full range of 14+ specialist digital marketing services — SEO, link building, web development, content writing, Google Ads, and more. Transparent pricing."
        canonical="/services"
      />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-gray-50 pt-[68px] pb-16 sm:pb-20">
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-8 left-1/4 w-72 h-72 rounded-full bg-sky-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-4 right-1/4 w-56 h-56 rounded-full bg-indigo-400/10 blur-[80px] pointer-events-none" />

        <div className="container-max px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
              <Sparkles size={12} className="text-blue-500" />
              14+ specialist services — transparent pricing, no hidden fees
            </div>
            <SectionLabel>What we offer</SectionLabel>
            <SectionHeading className="mb-4">
              Our <span className="text-gradient">Services</span>
            </SectionHeading>
            <SectionSub className="max-w-xl mx-auto mb-12">
              Full-spectrum digital growth — SEO, development, design, content
              and advertising delivered by specialist teams. All pricing is
              transparent with no hidden fees.
            </SectionSub>
            {/* Trust stats row */}
            <div className="flex flex-wrap justify-center gap-8 sm:gap-14">
              {[
                { val: "14+", label: "Specialist services" },
                { val: "500+", label: "Clients served" },
                { val: "30+", label: "Countries" },
                { val: "98%", label: "Satisfaction rate" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-sora font-bold text-2xl sm:text-3xl text-blue-700 mb-0.5">
                    {stat.val}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Domains & hosting — cross-sell */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-violet-50/90 to-sky-50/80">
        <div className="container-max px-4 py-6 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex flex-col gap-4 rounded-2xl border border-violet-200/70 bg-white/95 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
                  Infrastructure
                </p>
                <h2 className="mt-1 font-sora text-lg font-bold text-gray-900 sm:text-xl">
                  Domains, DNS & hosting
                </h2>
                <p className="mt-1 max-w-xl text-sm text-gray-600">
                  Search names, manage SSL, and pick a plan in the client portal —
                  same mock data as{" "}
                  <Link
                    to="/services/hosting"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    domains & hosting
                  </Link>
                  .
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
                <Link
                  to="/services/hosting"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold text-violet-900 transition-colors hover:bg-violet-50 touch-manipulation"
                >
                  Learn more
                </Link>
                <Link
                  to={paths.dashboardHostingRegister}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 touch-manipulation"
                >
                  Search domains
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Sticky filters */}
      <div className="sticky top-16 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-xl">
        <div className="container-max px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-base text-gray-900 placeholder-gray-500 transition-colors focus:border-primary-500/60 focus:outline-none focus:ring-1 focus:ring-primary-500/30 sm:text-sm touch-manipulation"
            />
          </div>
          {/* Category pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-nowrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex-shrink-0 ${
                  category === cat
                    ? "bg-sky-500 text-white shadow-glow-sky"
                    : "border border-gray-300 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Service grid */}
      <section className="section-pad">
        <div className="container-max">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="glass-card h-48 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 sm:py-24">
              <div className="text-4xl mb-4">🔍</div>
              <p className="mb-3 text-gray-600">
                No services match your search.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
                className="text-sm text-primary-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm text-gray-500">
                {filtered.length} service{filtered.length !== 1 ? "s" : ""}{" "}
                found
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filtered.map((s, i) => (
                  <ScrollReveal key={s.name} delay={i * 35}>
                    <div className="glass-card card-hover group flex h-full flex-col overflow-hidden">
                      {/* Category accent bar */}
                      <div
                        className={`h-1 w-full bg-gradient-to-r ${CATEGORY_ACCENT[s.category] ?? "from-gray-400 to-gray-500"}`}
                      />
                      <div className="flex flex-col flex-1 p-5 sm:p-6">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-50 to-blue-50 border border-blue-100/80 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200">
                          {s.icon}
                        </div>
                        <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                          <h3 className="text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-blue-700">
                            {s.name}
                          </h3>
                          <Badge
                            variant={BADGE_MAP[s.category] ?? "slate"}
                            className="shrink-0 text-[10px]"
                          >
                            {s.category}
                          </Badge>
                        </div>
                        <p className="flex-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
                          {s.description}
                        </p>
                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                          <span className="font-mono text-xs font-bold text-blue-700 sm:text-sm">
                            {s.price}
                          </span>
                          <a
                            href="/contact"
                            className="flex items-center gap-1 text-xs font-semibold text-gray-400 transition-all hover:text-blue-700 hover:gap-1.5"
                          >
                            Get quote <ArrowRight size={11} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Why our services section */}
      <section className="pb-10 pt-0 px-4 sm:px-6 lg:px-8">
        <div className="container-max">
          <ScrollReveal>
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-soft sm:p-10 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <SectionLabel>Why choose us</SectionLabel>
                  <h2 className="mb-5 font-sora text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
                    Every service is delivered by{" "}
                    <span className="text-gradient">specialist teams</span>
                  </h2>
                  <p className="mb-4 leading-relaxed text-gray-600">
                    Unlike generalist agencies that assign one person to manage
                    your SEO, ads, and development, PouchCare uses dedicated
                    specialist teams for each service category. Your link
                    building campaign is handled exclusively by our outreach
                    team — not split with someone also running Google Ads.
                  </p>
                  <p className="mb-6 leading-relaxed text-gray-600">
                    This focused approach means deeper expertise, faster
                    execution, and measurably better results. We have been
                    refining each service line since 2016 — you benefit from
                    hundreds of campaigns worth of optimisation built into every
                    workflow.
                  </p>
                  <div className="space-y-2.5">
                    {[
                      "All services include a dedicated project manager",
                      "Weekly progress updates via email or Slack",
                      "Live reporting dashboard for every campaign",
                      "White-label delivery available for agencies",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2.5 text-sm text-gray-700"
                      >
                        <CheckCircle
                          size={14}
                          className="text-sky-400 shrink-0"
                        />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      icon: TrendingUp,
                      title: "Measurable ROI",
                      desc: "Every service ties back to organic traffic, leads, and revenue — not just activity metrics.",
                    },
                    {
                      icon: Zap,
                      title: "Fast Delivery",
                      desc: "Guest posts live in 5–7 days. Development sprints in 2-week cycles. No waiting months for results.",
                    },
                    {
                      icon: Users,
                      title: "Dedicated Teams",
                      desc: "A specialist squad owns your account — not a generalist juggling 60 clients at once.",
                    },
                    {
                      icon: CheckCircle,
                      title: "Quality Guarantee",
                      desc: "Not satisfied? We redo the work or refund. No arguments, no delays.",
                    },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div
                      key={title}
                      className="group rounded-xl border border-gray-200 bg-white p-5 card-hover hover:border-blue-200 hover:bg-blue-50/40 shadow-soft"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                        <Icon size={16} className="text-blue-600" />
                      </div>
                      <div className="mb-1 text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                        {title}
                      </div>
                      <div className="text-xs leading-relaxed text-gray-600">
                        {desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* How to get started */}
      <section className="pb-14 pt-4 px-4 sm:px-6 lg:px-8">
        <div className="container-max">
          <ScrollReveal>
            <div className="text-center mb-8">
              <SectionLabel>Getting started</SectionLabel>
              <h2 className="mb-3 font-sora text-2xl font-bold text-gray-900 sm:text-3xl">
                Order a service in{" "}
                <span className="text-gradient">3 simple steps</span>
              </h2>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-gray-600">
                No lengthy onboarding processes, no confusing portals. Getting
                started with PouchCare takes less than 10 minutes from first
                contact to campaign kickoff.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                step: "01",
                title: "Choose a service & contact us",
                desc: 'Pick the service above that matches your needs and click "Get a quote". Fill in your website URL, target keywords or goals, and your budget. Takes 2 minutes.',
              },
              {
                step: "02",
                title: "Receive your custom proposal",
                desc: "Within 4 business hours, a specialist will send a detailed proposal with pricing, timeline, and expected outcomes specific to your site and niche.",
              },
              {
                step: "03",
                title: "We execute — you track results",
                desc: "After approval, your campaign launches within 48 hours. Track everything via your live dashboard: rankings, links live, traffic growth, week by week.",
              },
            ].map((s) => (
              <ScrollReveal key={s.step}>
                <div className="group rounded-2xl border border-gray-200 bg-white p-6 sm:p-7 text-center card-hover shadow-soft hover:border-blue-200 hover:shadow-elevated">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                    <span className="font-mono font-bold text-white text-lg">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="mb-2 font-sora text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                    {s.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-gray-600">
                    {s.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-16 sm:pb-20 pt-0">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 sm:p-12 text-center">
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mx-auto mb-5">
                  <MessageCircle size={26} className="text-white" />
                </div>
                <h3 className="mb-3 font-sora text-xl font-bold text-white sm:text-2xl">
                  Can&apos;t find what you need?
                </h3>
                <p className="mx-auto mb-8 max-w-md text-sm text-white/75 sm:text-base leading-relaxed">
                  We offer custom packages for unique requirements. Tell us your
                  goals and we will build a tailored solution with transparent
                  pricing.
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-bold text-base hover:bg-white/90 hover:-translate-y-0.5 transition-all duration-200 shadow-xl"
                >
                  Request a Custom Package <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

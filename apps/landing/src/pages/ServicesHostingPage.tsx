import { Link } from "react-router-dom";
import { ArrowRight, Globe2, Lock, Sparkles } from "lucide-react";
import { PageSEO } from "@/components/seo/PageSEO";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  SectionLabel,
  SectionHeading,
  SectionSub,
} from "@/components/ui/SectionLabel";
import { MARKETING_HOSTING_SERVICES } from "@/data/marketingHosting";

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
import { paths } from "@/routes/paths";
import { HostingPlanCard } from "@/components/hosting/HostingPlanCard";

export default function ServicesHostingPage() {
  return (
    <>
      <PageSEO
        title="Domains & Web Hosting — PouchCare"
        description="Register domains, manage DNS and SSL, and choose hosting plans. Connect your stack to our client portal for renewals and monitoring."
        canonical="/services/hosting"
      />

      <div className="relative overflow-hidden bg-gradient-to-b from-violet-50 via-white to-gray-50 pt-[68px] pb-14 sm:pb-20">
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" />
        <div className="container-max relative z-10 px-4 text-center sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold text-violet-800">
              <Sparkles size={12} className="shrink-0" />
              Domains · DNS · SSL · hosting
            </div>
            <SectionLabel>Infrastructure</SectionLabel>
            <SectionHeading className="mb-4">
              <span className="text-gradient">Domains</span> & hosting
            </SectionHeading>
            <SectionSub className="mx-auto mb-8 max-w-2xl">
              Everything you need to launch and run sites: register names, point
              DNS, secure TLS certificates, and scale hosting — managed from the
              client portal alongside your SEO and marketing work.
            </SectionSub>
            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                to={paths.dashboardHostingRegister}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-base font-semibold text-white shadow-soft transition-all hover:from-primary-700 hover:to-primary-600 hover:-translate-y-0.5 hover:shadow-elevated active:translate-y-0 sm:w-auto touch-manipulation"
              >
                Search domains in portal
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
              <Link
                to={paths.register}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 hover:-translate-y-0.5 active:translate-y-0 sm:w-auto touch-manipulation"
              >
                Create client account
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>

      <section className="section-pad border-b border-gray-100 bg-white">
        <div className="container-max">
          <ScrollReveal>
            <div className="mb-10 text-center">
              <SectionLabel>What we cover</SectionLabel>
              <SectionHeading className="mb-3 text-xl sm:text-2xl">
                Built for reliability
              </SectionHeading>
              <p className="mx-auto max-w-2xl text-sm text-gray-600 sm:text-base">
                These offerings appear in the public services catalog and map to
                tools inside{" "}
                <Link
                  to={paths.dashboardHosting}
                  className="font-medium text-primary-600 hover:underline"
                >
                  My domains
                </Link>{" "}
                when you are signed in.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MARKETING_HOSTING_SERVICES.map((s, i) => (
              <ScrollReveal key={s.name} delay={i * 50}>
                <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-gray-50/50 p-5 shadow-sm sm:p-6">
                  <span className="mb-3 text-2xl" aria-hidden>
                    {s.icon}
                  </span>
                  <h3 className="font-sora text-base font-semibold text-gray-900">
                    {s.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                    {s.description}
                  </p>
                  <p className="mt-4 font-mono text-sm font-bold text-violet-700">
                    {s.price}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-gray-50/80">
        <div className="container-max">
          <ScrollReveal>
            <div className="mb-10 text-center">
              <SectionLabel>Plans</SectionLabel>
              <SectionHeading className="mb-3 text-xl sm:text-2xl">
                Hosting tiers (mock pricing)
              </SectionHeading>
              <SectionSub className="mx-auto max-w-lg">
                Same plan cards as the portal register flow — one source in{" "}
                <code className="rounded bg-gray-200/80 px-1 text-xs">mockHosting.ts</code>.
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
                  footerSlot={
                    <Link
                      to={paths.dashboardHostingRegister}
                      className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-700 touch-manipulation"
                    >
                      Start in portal
                    </Link>
                  }
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-max">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="font-sora text-xl font-bold text-gray-900 sm:text-2xl">
                  Why pair hosting with PouchCare?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                  Keep domains, SSL, and DNS next to your SEO orders and support
                  tickets — fewer handoffs, clearer renewals, and a single login
                  for your team.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                    Registrar-style search and mock checkout (live billing later).
                  </li>
                  <li className="flex gap-2">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Certificate tracking and DNS tables in the domain detail view.
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  to={paths.dashboard}
                  className="inline-flex min-h-[48px] w-full flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-center text-base font-semibold text-white shadow-soft transition-all hover:from-primary-700 hover:to-primary-600 touch-manipulation"
                >
                  Open dashboard
                </Link>
                <Link
                  to="/services"
                  className="inline-flex min-h-[48px] w-full flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-center text-base font-semibold text-gray-700 transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 touch-manipulation"
                >
                  All marketing services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

import { useState } from "react";
import {
  Check,
  ArrowRight,
  Zap,
  Shield,
  RefreshCw,
  Users,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  SectionLabel,
  SectionHeading,
  SectionSub,
} from "@/components/ui/SectionLabel";
import { PageSEO } from "@/components/seo/PageSEO";
import { PLANS } from "@/lib/constants";
import { cn } from "@/lib/cn";

const ANNUAL_DISCOUNT = 0.2;

const FAQ = [
  {
    q: "Can I cancel anytime?",
    a: "Yes — there are no long-term contracts. Cancel before your next billing date and you will not be charged again.",
  },
  {
    q: "What is included in the monthly reports?",
    a: "Rankings for all target keywords, links built that month with live URLs, traffic data from Search Console, and a strategy update for the following month.",
  },
  {
    q: "Do you offer a money-back guarantee?",
    a: "Yes. If you are not satisfied after the first 30 days, we will refund your payment in full — no questions asked.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Absolutely. You can switch plans at any time. Upgrades take effect immediately; downgrades apply from the next billing cycle.",
  },
  {
    q: "Are the guest post sites real traffic sites?",
    a: "Yes. Every site we publish on is manually vetted for real traffic, editorial quality, and niche relevance. No spam or PBN sites.",
  },
  {
    q: "How do I get started?",
    a: "Simply fill in our contact form and one of our specialists will reach out within 4 business hours with a tailored proposal and onboarding details.",
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const formatPrice = (monthly: number) => {
    const p = annual ? Math.round(monthly * (1 - ANNUAL_DISCOUNT)) : monthly;
    return p.toLocaleString();
  };

  return (
    <>
      <PageSEO
        title="Pricing — SEO Retainer Plans"
        description="Simple, transparent SEO pricing with no lock-in contracts. Choose from Starter, Growth, or Agency plans. Monthly billing, cancel anytime, 30-day money-back guarantee."
        canonical="/pricing"
      />

      {/* Sub-header */}
      <div className="border-b border-gray-200 bg-white pt-[68px] pb-10 sm:pb-12">
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <SectionLabel>Transparent pricing</SectionLabel>
            <SectionHeading className="mb-4">
              Simple, <span className="text-gradient">results-driven</span>{" "}
              plans
            </SectionHeading>
            <SectionSub className="max-w-xl mx-auto">
              No hidden fees. No lock-in contracts. Just real SEO results that
              compound every month.
            </SectionSub>
          </ScrollReveal>

          {/* Monthly / Annual toggle */}
          <ScrollReveal delay={150}>
            <div className="flex items-center justify-center gap-3 mt-8">
              <span
                className={cn(
                  "text-sm font-medium",
                  !annual ? "text-gray-900" : "text-gray-500",
                )}
              >
                Monthly
              </span>
              <button
                onClick={() => setAnnual((a) => !a)}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                  annual
                    ? "bg-primary-500"
                    : "border border-gray-300 bg-gray-300",
                )}
                aria-label="Toggle annual billing"
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                    annual ? "translate-x-6" : "translate-x-0",
                  )}
                />
              </button>
              <span
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium",
                  annual ? "text-gray-900" : "text-gray-500",
                )}
              >
                Annual
                <Badge variant="green">Save 20%</Badge>
              </span>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Plan cards */}
      <section className="section-pad">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 mb-10 sm:mb-12">
            {PLANS.map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 100}>
                <div
                  className={cn(
                    "relative flex flex-col rounded-2xl p-6 sm:p-8 border transition-all duration-200 h-full",
                    plan.isPopular
                      ? "border-primary-300 bg-gradient-to-b from-primary-50 to-white shadow-elevated"
                      : "glass-card hover:border-sky-500/20",
                  )}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-primary-600 text-white text-xs font-bold shadow-[0_0_18px_rgba(37,99,235,0.35)]">
                        <Zap size={11} /> Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-5 sm:mb-6">
                    <h3
                      className={cn(
                        "font-sora font-bold text-xl mb-1",
                        plan.color,
                      )}
                    >
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-3">
                      <span className="font-mono text-4xl font-bold text-gray-900 sm:text-5xl">
                        ${formatPrice(plan.monthlyPrice)}
                      </span>
                      <span className="text-sm text-gray-500">/month</span>
                    </div>
                    {annual && (
                      <p className="text-xs text-green-400 mt-1.5">
                        Billed annually · saves $
                        {Math.round(
                          plan.monthlyPrice * ANNUAL_DISCOUNT * 12,
                        ).toLocaleString()}
                        /yr
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 sm:space-y-3 flex-1 mb-7 sm:mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <Check
                          size={14}
                          className="text-sky-400 mt-0.5 shrink-0"
                        />
                        <span className="text-gray-700">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    as="a"
                    href="/contact"
                    variant={plan.isPopular ? "primary" : "outline"}
                    fullWidth
                    iconRight={<ArrowRight size={14} />}
                  >
                    Get {plan.name} Plan
                  </Button>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Enterprise */}
          <ScrollReveal>
            <div className="glass-card p-6 sm:p-8 text-center">
              <Badge variant="indigo" className="mb-3">
                Enterprise
              </Badge>
              <h3 className="mb-2 font-sora text-xl font-bold text-gray-900 sm:text-2xl">
                Need a custom solution?
              </h3>
              <p className="mx-auto mb-6 max-w-lg text-sm text-gray-600 sm:text-base">
                White-label services, custom reporting, dedicated account
                management and bespoke link-building campaigns at scale.
                Let&apos;s build something together.
              </p>
              <Button
                as="a"
                href="/contact"
                variant="outline"
                size="lg"
                iconRight={<ArrowRight size={16} />}
              >
                Contact Our Sales Team
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* What's included — guarantee strip */}
      <section className="pb-4 pt-0 px-4 sm:px-6 lg:px-8">
        <div className="container-max">
          <ScrollReveal>
            <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-soft sm:p-10">
              <div className="text-center mb-8">
                <SectionLabel>Every plan includes</SectionLabel>
                <h2 className="mb-3 font-sora text-xl font-bold text-gray-900 sm:text-2xl">
                  No upsells. No hidden add-ons.{" "}
                  <span className="text-gradient">Everything is included.</span>
                </h2>
                <p className="mx-auto max-w-xl text-sm leading-relaxed text-gray-600">
                  Every PouchCare plan ships with a full suite of tools and
                  protections that other agencies charge extra for. Here is
                  exactly what you get, regardless of which plan you choose.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {
                    icon: Shield,
                    title: "30-Day Money-Back",
                    desc: "Not satisfied in the first 30 days? Full refund, no questions asked. We are confident you will see results — but we want you to feel safe.",
                  },
                  {
                    icon: RefreshCw,
                    title: "Cancel Anytime",
                    desc: 'No minimum term, no cancellation fee, no "call to cancel" runarounds. Cancel by email before your next billing date and you are done.',
                  },
                  {
                    icon: Users,
                    title: "Dedicated Manager",
                    desc: "Every account has one named account manager. You will always know exactly who to contact and get a reply within one business day.",
                  },
                  {
                    icon: Award,
                    title: "White-Label Reports",
                    desc: "Need to show results to your own clients? All reports are available in white-label format with your branding — included in every plan.",
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="text-center group">
                    <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-sky-500/20 transition-colors">
                      <Icon size={18} className="text-sky-400" />
                    </div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary-700">
                      {title}
                    </h3>
                    <p className="text-xs leading-relaxed text-gray-600">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Comparison note */}
      <section className="pb-10 pt-4 px-4 sm:px-6 lg:px-8">
        <div className="container-max">
          <ScrollReveal>
            <div className="rounded-2xl border border-sky-500/15 bg-sky-500/4 p-7 sm:p-8">
              <h2 className="mb-4 font-sora text-xl font-bold text-gray-900 sm:text-2xl">
                How to choose the right plan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="mb-2 font-semibold text-gray-900">
                    🚀 Choose Starter if…
                  </div>
                  <p className="leading-relaxed text-gray-600">
                    You are a small business or solo operator just getting
                    started with SEO. Your domain authority is below 25 and you
                    want to build a solid foundation with an audit plus a steady
                    stream of quality links each month without a large upfront
                    commitment.
                  </p>
                </div>
                <div>
                  <div className="mb-2 font-semibold text-gray-900">
                    📈 Choose Growth if…
                  </div>
                  <p className="leading-relaxed text-gray-600">
                    You have an established site with some organic traffic
                    already and want to accelerate ranking growth significantly.
                    The Growth plan is ideal for e-commerce stores, SaaS
                    companies, and SMBs targeting 5+ competitive keywords with a
                    serious 6-month growth trajectory.
                  </p>
                </div>
                <div>
                  <div className="mb-2 font-semibold text-gray-900">
                    🏢 Choose Agency if…
                  </div>
                  <p className="leading-relaxed text-gray-600">
                    You are a high-revenue business, a digital agency
                    white-labelling our services, or a company targeting highly
                    competitive keywords in industries like finance, legal, or
                    SaaS. The Agency plan delivers the volume and dedicated
                    management needed to dominate competitive niches.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-pad bg-gray-50">
        <div className="container-max">
          <div className="text-center mb-10">
            <ScrollReveal>
              <SectionLabel>FAQ</SectionLabel>
              <SectionHeading>Frequently asked questions</SectionHeading>
            </ScrollReveal>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQ.map((item, i) => (
              <ScrollReveal key={i} delay={i * 40}>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-5 py-4 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 sm:px-6"
                  >
                    <span>{item.q}</span>
                    <span
                      className={cn(
                        "ml-4 shrink-0 text-lg leading-none text-primary-600 transition-transform duration-200",
                        openFaq === i ? "rotate-45" : "",
                      )}
                    >
                      +
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="border-t border-gray-200 px-5 pb-5 pt-4 text-sm leading-relaxed text-gray-600 sm:px-6">
                      {item.a}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div className="text-center mt-10">
              <p className="mb-4 text-sm text-gray-600">
                Still have questions?
              </p>
              <Button
                as="a"
                href="/contact"
                variant="outline"
                iconRight={<ArrowRight size={14} />}
              >
                Talk to a Specialist
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

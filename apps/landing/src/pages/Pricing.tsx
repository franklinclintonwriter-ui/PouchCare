import { useState } from 'react';
import { Check, ArrowRight, Zap, Shield, RefreshCw, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { SectionLabel, SectionHeading, SectionSub } from '@/components/ui/SectionLabel';
import { PageSEO } from '@/components/seo/PageSEO';
import { PLANS } from '@/lib/constants';
import { cn } from '@/lib/cn';

const ANNUAL_DISCOUNT = 0.2;

const FAQ = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — there are no long-term contracts. Cancel before your next billing date and you will not be charged again.',
  },
  {
    q: 'What is included in the monthly reports?',
    a: 'Rankings for all target keywords, links built that month with live URLs, traffic data from Search Console, and a strategy update for the following month.',
  },
  {
    q: 'Do you offer a money-back guarantee?',
    a: 'Yes. If you are not satisfied after the first 30 days, we will refund your payment in full — no questions asked.',
  },
  {
    q: 'Can I upgrade or downgrade my plan?',
    a: 'Absolutely. You can switch plans at any time. Upgrades take effect immediately; downgrades apply from the next billing cycle.',
  },
  {
    q: 'Are the guest post sites real traffic sites?',
    a: 'Yes. Every site we publish on is manually vetted for real traffic, editorial quality, and niche relevance. No spam or PBN sites.',
  },
  {
    q: 'How do I get started?',
    a: 'Simply fill in our contact form and one of our specialists will reach out within 4 business hours with a tailored proposal and onboarding details.',
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
      <div className="pt-[68px] pb-10 sm:pb-12 bg-navy-800 border-b border-navy-600">
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <SectionLabel>Transparent pricing</SectionLabel>
            <SectionHeading className="mb-4">
              Simple, <span className="text-gradient">results-driven</span> plans
            </SectionHeading>
            <SectionSub className="max-w-xl mx-auto">
              No hidden fees. No lock-in contracts. Just real SEO results that compound every month.
            </SectionSub>
          </ScrollReveal>

          {/* Monthly / Annual toggle */}
          <ScrollReveal delay={150}>
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={cn('text-sm font-medium', !annual ? 'text-slate-100' : 'text-slate-400')}>
                Monthly
              </span>
              <button
                onClick={() => setAnnual((a) => !a)}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
                  annual ? 'bg-sky-500' : 'bg-navy-500 border border-navy-400',
                )}
                aria-label="Toggle annual billing"
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                    annual ? 'translate-x-6' : 'translate-x-0',
                  )}
                />
              </button>
              <span className={cn('text-sm font-medium flex items-center gap-1.5', annual ? 'text-slate-100' : 'text-slate-400')}>
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
                    'relative flex flex-col rounded-2xl p-6 sm:p-8 border transition-all duration-200 h-full',
                    plan.isPopular
                      ? 'bg-gradient-to-b from-sky-500/10 to-navy-700/80 border-sky-500/40 shadow-glow-sky'
                      : 'glass-card hover:border-sky-500/20',
                  )}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-sky-500 text-white text-xs font-bold shadow-glow-sky">
                        <Zap size={11} /> Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-5 sm:mb-6">
                    <h3 className={cn('font-sora font-bold text-xl mb-1', plan.color)}>{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-3">
                      <span className="font-mono font-bold text-4xl sm:text-5xl text-slate-50">
                        ${formatPrice(plan.monthlyPrice)}
                      </span>
                      <span className="text-slate-400 text-sm">/month</span>
                    </div>
                    {annual && (
                      <p className="text-xs text-green-400 mt-1.5">
                        Billed annually · saves ${Math.round(plan.monthlyPrice * ANNUAL_DISCOUNT * 12).toLocaleString()}/yr
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 sm:space-y-3 flex-1 mb-7 sm:mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <Check size={14} className="text-sky-400 mt-0.5 shrink-0" />
                        <span className="text-slate-300">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    as="a"
                    href="/contact"
                    variant={plan.isPopular ? 'primary' : 'outline'}
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
              <Badge variant="indigo" className="mb-3">Enterprise</Badge>
              <h3 className="font-sora font-bold text-xl sm:text-2xl text-slate-50 mb-2">
                Need a custom solution?
              </h3>
              <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto mb-6">
                White-label services, custom reporting, dedicated account management and bespoke
                link-building campaigns at scale. Let&apos;s build something together.
              </p>
              <Button as="a" href="/contact" variant="outline" size="lg" iconRight={<ArrowRight size={16} />}>
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
            <div className="rounded-2xl border border-navy-600/60 bg-navy-800/50 p-7 sm:p-10">
              <div className="text-center mb-8">
                <SectionLabel>Every plan includes</SectionLabel>
                <h2 className="font-sora font-bold text-xl sm:text-2xl text-slate-50 mb-3">
                  No upsells. No hidden add-ons. <span className="text-gradient">Everything is included.</span>
                </h2>
                <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
                  Every PouchCare plan ships with a full suite of tools and protections that other agencies charge extra for.
                  Here is exactly what you get, regardless of which plan you choose.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { icon: Shield, title: '30-Day Money-Back', desc: 'Not satisfied in the first 30 days? Full refund, no questions asked. We are confident you will see results — but we want you to feel safe.' },
                  { icon: RefreshCw, title: 'Cancel Anytime', desc: 'No minimum term, no cancellation fee, no "call to cancel" runarounds. Cancel by email before your next billing date and you are done.' },
                  { icon: Users, title: 'Dedicated Manager', desc: 'Every account has one named account manager. You will always know exactly who to contact and get a reply within one business day.' },
                  { icon: Award, title: 'White-Label Reports', desc: 'Need to show results to your own clients? All reports are available in white-label format with your branding — included in every plan.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="text-center group">
                    <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-sky-500/20 transition-colors">
                      <Icon size={18} className="text-sky-400" />
                    </div>
                    <h3 className="font-semibold text-slate-100 text-sm mb-2 group-hover:text-sky-300 transition-colors">{title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
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
              <h2 className="font-sora font-bold text-xl sm:text-2xl text-slate-50 mb-4">
                How to choose the right plan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="font-semibold text-slate-300 mb-2">🚀 Choose Starter if…</div>
                  <p className="text-slate-400 leading-relaxed">
                    You are a small business or solo operator just getting started with SEO.
                    Your domain authority is below 25 and you want to build a solid foundation
                    with an audit plus a steady stream of quality links each month without
                    a large upfront commitment.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-slate-300 mb-2">📈 Choose Growth if…</div>
                  <p className="text-slate-400 leading-relaxed">
                    You have an established site with some organic traffic already and want to
                    accelerate ranking growth significantly. The Growth plan is ideal for
                    e-commerce stores, SaaS companies, and SMBs targeting 5+ competitive keywords
                    with a serious 6-month growth trajectory.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-slate-300 mb-2">🏢 Choose Agency if…</div>
                  <p className="text-slate-400 leading-relaxed">
                    You are a high-revenue business, a digital agency white-labelling our services,
                    or a company targeting highly competitive keywords in industries like finance,
                    legal, or SaaS. The Agency plan delivers the volume and dedicated management
                    needed to dominate competitive niches.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-pad bg-navy-800">
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
                <div className="rounded-xl border border-navy-600 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 sm:px-6 py-4 text-left text-slate-100 font-medium text-sm hover:bg-navy-700/60 transition-colors"
                  >
                    <span>{item.q}</span>
                    <span className={cn('text-sky-400 transition-transform duration-200 text-lg leading-none ml-4 shrink-0', openFaq === i ? 'rotate-45' : '')}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 sm:px-6 pb-5 text-slate-400 text-sm leading-relaxed border-t border-navy-600 pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div className="text-center mt-10">
              <p className="text-slate-400 text-sm mb-4">Still have questions?</p>
              <Button as="a" href="/contact" variant="outline" iconRight={<ArrowRight size={14} />}>
                Talk to a Specialist
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

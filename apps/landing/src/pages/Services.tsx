import { useState, useEffect, useMemo } from 'react';
import { Search, ArrowRight, MessageCircle, CheckCircle, TrendingUp, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { SectionLabel, SectionHeading, SectionSub } from '@/components/ui/SectionLabel';
import { PageSEO } from '@/components/seo/PageSEO';
import { getServices } from '@/lib/api';
import type { ServiceItem } from '@/lib/constants';

const CATEGORIES = ['All', 'SEO', 'Dev', 'Design', 'Content', 'Ads'];

const BADGE_MAP: Record<string, 'sky' | 'indigo' | 'green' | 'yellow' | 'red' | 'slate'> = {
  SEO: 'sky',
  Dev: 'indigo',
  Development: 'indigo',
  Design: 'green',
  Content: 'yellow',
  Ads: 'red',
};

export default function Services() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    getServices().then((data) => {
      setServices(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchesCat = category === 'All' || s.category === category || s.category.startsWith(category);
      const q = search.toLowerCase();
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
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

      {/* Sub-header */}
      <div className="pt-[68px] pb-10 sm:pb-12 bg-navy-800 border-b border-navy-600">
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <SectionLabel>What we offer</SectionLabel>
            <SectionHeading className="mb-4">
              Our <span className="text-gradient">Services</span>
            </SectionHeading>
            <SectionSub className="max-w-xl mx-auto">
              Full-spectrum digital growth — SEO, development, design, content and advertising
              delivered by specialists. All pricing is transparent with no hidden fees.
            </SectionSub>
          </ScrollReveal>
        </div>
      </div>

      {/* Sticky filters */}
      <div className="sticky top-16 z-30 bg-navy-900/95 backdrop-blur-xl border-b border-navy-600/80">
        <div className="container-max px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-navy-700 border border-navy-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/40 transition-colors"
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
                    ? 'bg-sky-500 text-white shadow-glow-sky'
                    : 'bg-navy-700 border border-navy-500 text-slate-400 hover:text-slate-200 hover:border-sky-500/40'
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
              <p className="text-slate-400 mb-3">No services match your search.</p>
              <button
                onClick={() => { setSearch(''); setCategory('All'); }}
                className="text-sky-400 text-sm hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <p className="text-slate-500 text-sm mb-5">{filtered.length} service{filtered.length !== 1 ? 's' : ''} found</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filtered.map((s, i) => (
                  <ScrollReveal key={s.name} delay={i * 35}>
                    <div className="glass-card p-5 sm:p-6 hover:border-sky-500/30 hover:shadow-card-hover transition-all duration-200 group h-full flex flex-col">
                      <div className="text-2xl sm:text-3xl mb-3">{s.icon}</div>
                      <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-slate-100 group-hover:text-sky-400 transition-colors text-sm leading-snug">{s.name}</h3>
                        <Badge variant={BADGE_MAP[s.category] ?? 'slate'} className="shrink-0 text-[10px]">
                          {s.category}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed flex-1">{s.description}</p>
                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-navy-600/60">
                        <span className="font-mono font-semibold text-sky-400 text-xs sm:text-sm">{s.price}</span>
                        <a
                          href="/contact"
                          className="text-xs font-medium text-slate-500 hover:text-sky-400 transition-colors flex items-center gap-1"
                        >
                          Get quote <ArrowRight size={11} />
                        </a>
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
            <div className="rounded-2xl border border-navy-600/60 bg-navy-800/50 p-8 sm:p-10 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <SectionLabel>Why choose us</SectionLabel>
                  <h2 className="font-sora font-bold text-2xl sm:text-3xl text-slate-50 mb-5 leading-tight">
                    Every service is delivered by <span className="text-gradient">specialist teams</span>
                  </h2>
                  <p className="text-slate-400 leading-relaxed mb-4">
                    Unlike generalist agencies that assign one person to manage your SEO, ads, and development,
                    PouchCare uses dedicated specialist teams for each service category. Your link building
                    campaign is handled exclusively by our outreach team — not split with someone also
                    running Google Ads.
                  </p>
                  <p className="text-slate-400 leading-relaxed mb-6">
                    This focused approach means deeper expertise, faster execution, and measurably better
                    results. We have been refining each service line since 2016 — you benefit from hundreds
                    of campaigns worth of optimisation built into every workflow.
                  </p>
                  <div className="space-y-2.5">
                    {[
                      'All services include a dedicated project manager',
                      'Weekly progress updates via email or Slack',
                      'Live reporting dashboard for every campaign',
                      'White-label delivery available for agencies',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2.5 text-slate-300 text-sm">
                        <CheckCircle size={14} className="text-sky-400 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: TrendingUp, title: 'Measurable ROI', desc: 'Every service ties back to organic traffic, leads, and revenue — not just activity metrics.' },
                    { icon: Zap, title: 'Fast Delivery', desc: 'Guest posts live in 5–7 days. Development sprints in 2-week cycles. No waiting months for results.' },
                    { icon: Users, title: 'Dedicated Teams', desc: 'A specialist squad owns your account — not a generalist juggling 60 clients at once.' },
                    { icon: CheckCircle, title: 'Quality Guarantee', desc: 'Not satisfied? We redo the work or refund. No arguments, no delays.' },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="p-4 rounded-xl border border-navy-600/60 bg-navy-700/30 hover:border-sky-500/20 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center mb-3 group-hover:bg-sky-500/20 transition-colors">
                        <Icon size={15} className="text-sky-400" />
                      </div>
                      <div className="font-semibold text-slate-100 text-sm mb-1 group-hover:text-sky-300 transition-colors">{title}</div>
                      <div className="text-slate-400 text-xs leading-relaxed">{desc}</div>
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
              <h2 className="font-sora font-bold text-2xl sm:text-3xl text-slate-50 mb-3">
                Order a service in <span className="text-gradient">3 simple steps</span>
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
                No lengthy onboarding processes, no confusing portals. Getting started with PouchCare
                takes less than 10 minutes from first contact to campaign kickoff.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { step: '01', title: 'Choose a service & contact us', desc: 'Pick the service above that matches your needs and click "Get a quote". Fill in your website URL, target keywords or goals, and your budget. Takes 2 minutes.' },
              { step: '02', title: 'Receive your custom proposal', desc: 'Within 4 business hours, a specialist will send a detailed proposal with pricing, timeline, and expected outcomes specific to your site and niche.' },
              { step: '03', title: 'We execute — you track results', desc: 'After approval, your campaign launches within 48 hours. Track everything via your live dashboard: rankings, links live, traffic growth, week by week.' },
            ].map((s) => (
              <ScrollReveal key={s.step}>
                <div className="p-6 rounded-2xl border border-navy-600/60 bg-navy-700/20 hover:border-sky-500/20 transition-all group text-center">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-4 group-hover:border-sky-500/40 transition-colors">
                    <span className="font-mono font-bold text-sky-400">{s.step}</span>
                  </div>
                  <h3 className="font-sora font-semibold text-slate-100 text-sm mb-2 group-hover:text-sky-300 transition-colors">{s.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
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
            <div className="glass-card p-6 sm:p-10 text-center">
              <MessageCircle size={32} className="text-sky-400 mx-auto mb-4" />
              <h3 className="font-sora font-bold text-xl sm:text-2xl text-slate-50 mb-2">
                Can&apos;t find what you need?
              </h3>
              <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto mb-6">
                We offer custom packages for unique requirements. Tell us your goals and
                we will build a tailored solution with transparent pricing.
              </p>
              <Button as="a" href="/contact" size="lg" iconRight={<ArrowRight size={16} />}>
                Request a Custom Package
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, CheckCircle2, MessageCircle, Shield, Clock, Globe, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { SectionLabel, SectionHeading, SectionSub } from '@/components/ui/SectionLabel';
import { PageSEO } from '@/components/seo/PageSEO';
import { getBacklinkPackages } from '@/lib/api';
import type { BacklinkPackage } from '@/lib/constants';

const TYPES = ['All', 'Guest Post', 'Niche Edit', 'Mixed', 'Web 2.0', 'Profile'];

const BENEFITS = [
  'Manual outreach — no PBNs',
  'Contextual placements only',
  'Full link report included',
  'Indexed within 7 days guaranteed',
  'Free replacement for non-indexed',
  'Niche-relevant sites only',
];

export default function Backlinks() {
  const [packages, setPackages] = useState<BacklinkPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('All');

  useEffect(() => {
    getBacklinkPackages().then((data) => {
      setPackages(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () => (type === 'All' ? packages : packages.filter((p) => p.type === type)),
    [packages, type],
  );

  return (
    <>
      <PageSEO
        title="Backlink Packages — High-Authority Link Building"
        description="Buy high-DA guest posts, niche edits, and contextual backlinks from manually vetted websites. All white-hat, permanent placements with full link reports."
        canonical="/backlinks"
      />

      {/* Sub-header */}
      <div className="pt-[68px] pb-10 sm:pb-12 bg-navy-800 border-b border-navy-600">
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <SectionLabel>Link building</SectionLabel>
            <SectionHeading className="mb-4">
              High-Authority <span className="text-gradient">Backlinks</span>
            </SectionHeading>
            <SectionSub className="max-w-xl mx-auto">
              Guest posts, niche edits and bulk orders at wholesale prices.
              Volume discounts up to 28% — the more you order, the more you save.
            </SectionSub>
          </ScrollReveal>
        </div>
      </div>

      {/* Benefits strip */}
      <div className="bg-sky-500/5 border-b border-sky-500/10">
        <div className="container-max px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-6">
            {BENEFITS.map((b) => (
              <span key={b} className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-300">
                <CheckCircle2 size={12} className="text-sky-400 shrink-0" />
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Type filter */}
      <div className="sticky top-16 z-30 bg-navy-900/95 backdrop-blur-xl border-b border-navy-600/80">
        <div className="container-max px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center gap-2 overflow-x-auto">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex-shrink-0 ${
                type === t
                  ? 'bg-sky-500 text-white shadow-glow-sky'
                  : 'bg-navy-700 border border-navy-500 text-slate-400 hover:text-slate-200 hover:border-sky-500/40'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing — desktop table / mobile cards */}
      <section className="section-pad">
        <div className="container-max">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-navy-700 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop table — hidden on mobile */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-navy-600">
                <table className="min-w-full divide-y divide-navy-600">
                  <thead className="bg-navy-800">
                    <tr>
                      {['Package', 'Authority', 'Type', 'Per Link', '×10', '×50', '×100', '×1,000', ''].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap first:pl-6 last:pr-6"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-600/60 bg-navy-900">
                    {filtered.map((pkg, i) => (
                      <tr key={pkg.name + i} className="hover:bg-navy-700/40 transition-colors group">
                        <td className="px-4 py-4 pl-6 whitespace-nowrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-100 text-sm">{pkg.name}</span>
                            {pkg.isPopular && <Badge variant="sky">Popular</Badge>}
                            {pkg.isBestValue && <Badge variant="green">Best Value</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-slate-300 text-sm font-medium">{pkg.da}</td>
                        <td className="px-4 py-4 whitespace-nowrap"><Badge variant="indigo">{pkg.type}</Badge></td>
                        <td className="px-4 py-4 whitespace-nowrap font-mono font-semibold text-sky-400 text-sm">{pkg.perLink}</td>
                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-300 text-sm">{pkg.x10}</td>
                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-300 text-sm">{pkg.x50}</td>
                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-300 text-sm">{pkg.x100}</td>
                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-300 text-sm">{pkg.x1000}</td>
                        <td className="px-4 py-4 pr-6 whitespace-nowrap">
                          <a
                            href="/contact"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                          >
                            Order <ArrowRight size={11} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards — shown on mobile only */}
              <div className="md:hidden space-y-3">
                {filtered.map((pkg, i) => (
                  <div key={pkg.name + i} className="glass-card p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-slate-100 text-sm">{pkg.name}</span>
                          {pkg.isPopular && <Badge variant="sky">Popular</Badge>}
                          {pkg.isBestValue && <Badge variant="green">Best Value</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="indigo">{pkg.type}</Badge>
                          <span className="text-slate-400 text-xs">{pkg.da}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-sky-400 text-base">{pkg.perLink}</div>
                        <div className="text-slate-500 text-xs">per link</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-navy-600/60">
                      {[['×10', pkg.x10], ['×50', pkg.x50], ['×100', pkg.x100]].map(([label, val]) => (
                        <div key={label} className="bg-navy-700/40 rounded-lg p-2">
                          <div className="text-slate-500 mb-0.5">{label}</div>
                          <div className="font-mono text-slate-300 font-medium">{val}</div>
                        </div>
                      ))}
                    </div>
                    <a
                      href="/contact"
                      className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-sky-400 border border-sky-500/25 rounded-xl hover:bg-sky-500/8 transition-colors"
                    >
                      Get a quote <ArrowRight size={11} />
                    </a>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* What makes our links different */}
      <section className="pb-10 pt-0 px-4 sm:px-6 lg:px-8">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <ScrollReveal direction="left">
              <div className="rounded-2xl border border-navy-600/60 bg-navy-800/50 p-7 sm:p-8">
                <SectionLabel>Our link quality standards</SectionLabel>
                <h2 className="font-sora font-bold text-xl sm:text-2xl text-slate-50 mb-4 leading-tight">
                  What separates our links from the rest
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">
                  Not all backlinks are equal. A link from a site with fake traffic or spammy content
                  can actively damage your rankings. Every site in our network is manually vetted
                  through a 14-point quality checklist before we publish a single link on it.
                </p>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">
                  We check Domain Authority, organic traffic from third-party tools (Ahrefs + SEMrush),
                  spam score, content quality, editorial standards, niche relevance, and whether
                  the site has a history of selling links. Sites that fail any check are removed
                  from our network permanently.
                </p>
                <div className="space-y-2.5">
                  {[
                    { icon: Shield, text: '14-point site vetting — every single publisher' },
                    { icon: Globe, text: 'Real editorial sites with genuine organic traffic' },
                    { icon: Clock, text: 'Links go live within 5–7 business days guaranteed' },
                    { icon: BarChart3, text: 'Full report with live URLs, DA, and traffic data' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5 text-slate-300 text-sm">
                      <div className="w-6 h-6 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
                        <Icon size={12} className="text-sky-400" />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="space-y-4">
                <div className="rounded-2xl border border-navy-600/60 bg-navy-800/50 p-7">
                  <h3 className="font-sora font-semibold text-slate-100 mb-3 text-base">Guest Posts vs Niche Edits — which is right for you?</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    <strong className="text-slate-300">Guest Posts</strong> are entirely new articles published on authoritative sites with a link back to your target URL. They provide the most control over anchor text, surrounding content, and placement. Ideal for building brand authority and targeting specific keywords.
                  </p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    <strong className="text-slate-300">Niche Edits</strong> (also called curated links) insert your link into an existing, already-indexed article. Since the page already has authority and backlinks of its own, the link power is often stronger per dollar. Best for fast rank improvements on competitive keywords.
                  </p>
                </div>
                <div className="rounded-2xl border border-navy-600/60 bg-navy-800/50 p-7">
                  <h3 className="font-sora font-semibold text-slate-100 mb-3 text-base">Volume pricing — how it works</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-3">
                    Our per-link price drops significantly at volume. The ×10 column shows the bundle price for 10 links — which is already 8–13% cheaper than 10 individual orders. At ×1,000 links, you save up to 30% versus the single-link rate.
                  </p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    For orders over 1,000 links per month or recurring campaigns, contact us for a custom enterprise rate — which is not published in the table above.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Custom quote CTA */}
      <section className="pb-16 sm:pb-20 pt-0">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
              <div className="glass-card p-6 sm:p-10 text-center glow-border">
              <MessageCircle size={32} className="text-sky-400 mx-auto mb-4" />
              <h3 className="font-sora font-bold text-xl sm:text-2xl lg:text-3xl text-slate-50 mb-3">
                Need 1,000+ links or a custom campaign?
              </h3>
              <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto mb-7">
                Tell us your niche, targets and budget. We will build a tailored bulk link
                package with enterprise pricing not listed publicly.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Button as="a" href="/contact" size="lg" iconRight={<ArrowRight size={16} />}>
                  Get Custom Quote
                </Button>
                <Button as="a" href="/pricing" variant="outline" size="lg">
                  View Standard Pricing
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

import { useState, useEffect, useMemo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Shield,
  Clock,
  Globe,
  BarChart3,
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
import { getBacklinkPackages } from "@/lib/api";
import type { BacklinkPackage } from "@/lib/constants";

const TYPES = [
  "All",
  "Guest Post",
  "Niche Edit",
  "Mixed",
  "Web 2.0",
  "Profile",
];

const BENEFITS = [
  "Manual outreach — no PBNs",
  "Contextual placements only",
  "Full link report included",
  "Indexed within 7 days guaranteed",
  "Free replacement for non-indexed",
  "Niche-relevant sites only",
];

export default function Backlinks() {
  const [packages, setPackages] = useState<BacklinkPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("All");

  useEffect(() => {
    getBacklinkPackages().then((data) => {
      setPackages(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () => (type === "All" ? packages : packages.filter((p) => p.type === type)),
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
      <div className="border-b border-gray-200 bg-white pt-[68px] pb-10 sm:pb-12">
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <SectionLabel>Link building</SectionLabel>
            <SectionHeading className="mb-4">
              High-Authority <span className="text-gradient">Backlinks</span>
            </SectionHeading>
            <SectionSub className="max-w-xl mx-auto">
              Guest posts, niche edits and bulk orders at wholesale prices.
              Volume discounts up to 28% — the more you order, the more you
              save.
            </SectionSub>
          </ScrollReveal>
        </div>
      </div>

      {/* Benefits strip */}
      <div className="bg-sky-500/5 border-b border-sky-500/10">
        <div className="container-max px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-6">
            {BENEFITS.map((b) => (
              <span
                key={b}
                className="flex items-center gap-1.5 text-xs text-gray-700 sm:text-sm"
              >
                <CheckCircle2 size={12} className="text-sky-400 shrink-0" />
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Type filter */}
      <div className="sticky top-16 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-xl">
        <div className="container-max px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center gap-2 overflow-x-auto">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex-shrink-0 ${
                type === t
                  ? "bg-sky-500 text-white shadow-glow-sky"
                  : "border border-gray-300 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-700"
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
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl bg-gray-200"
                />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop table — hidden on mobile */}
              <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "Package",
                        "Authority",
                        "Type",
                        "Per Link",
                        "×10",
                        "×50",
                        "×100",
                        "×1,000",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 first:pl-6 last:pr-6"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filtered.map((pkg, i) => (
                      <tr
                        key={pkg.name + i}
                        className="group transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-4 pl-6 whitespace-nowrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">
                              {pkg.name}
                            </span>
                            {pkg.isPopular && (
                              <Badge variant="sky">Popular</Badge>
                            )}
                            {pkg.isBestValue && (
                              <Badge variant="green">Best Value</Badge>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-700">
                          {pkg.da}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant="indigo">{pkg.type}</Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-mono font-semibold text-sky-400 text-sm">
                          {pkg.perLink}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-mono text-sm text-gray-700">
                          {pkg.x10}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-mono text-sm text-gray-700">
                          {pkg.x50}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-mono text-sm text-gray-700">
                          {pkg.x100}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-mono text-sm text-gray-700">
                          {pkg.x1000}
                        </td>
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
                  <div
                    key={pkg.name + i}
                    className="glass-card p-4 shadow-soft"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {pkg.name}
                          </span>
                          {pkg.isPopular && (
                            <Badge variant="sky">Popular</Badge>
                          )}
                          {pkg.isBestValue && (
                            <Badge variant="green">Best Value</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="indigo">{pkg.type}</Badge>
                          <span className="text-xs text-gray-600">
                            {pkg.da}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-sky-400 text-base">
                          {pkg.perLink}
                        </div>
                        <div className="text-xs text-gray-500">per link</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-t border-gray-200 pt-3 text-center text-xs">
                      {[
                        ["×10", pkg.x10],
                        ["×50", pkg.x50],
                        ["×100", pkg.x100],
                      ].map(([label, val]) => (
                        <div key={label} className="rounded-lg bg-gray-100 p-2">
                          <div className="mb-0.5 text-gray-500">{label}</div>
                          <div className="font-mono font-medium text-gray-700">
                            {val}
                          </div>
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
              <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-soft sm:p-8">
                <SectionLabel>Our link quality standards</SectionLabel>
                <h2 className="mb-4 font-sora text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
                  What separates our links from the rest
                </h2>
                <p className="mb-5 text-sm leading-relaxed text-gray-600">
                  Not all backlinks are equal. A link from a site with fake
                  traffic or spammy content can actively damage your rankings.
                  Every site in our network is manually vetted through a
                  14-point quality checklist before we publish a single link on
                  it.
                </p>
                <p className="mb-5 text-sm leading-relaxed text-gray-600">
                  We check Domain Authority, organic traffic from third-party
                  tools (Ahrefs + SEMrush), spam score, content quality,
                  editorial standards, niche relevance, and whether the site has
                  a history of selling links. Sites that fail any check are
                  removed from our network permanently.
                </p>
                <div className="space-y-2.5">
                  {[
                    {
                      icon: Shield,
                      text: "14-point site vetting — every single publisher",
                    },
                    {
                      icon: Globe,
                      text: "Real editorial sites with genuine organic traffic",
                    },
                    {
                      icon: Clock,
                      text: "Links go live within 5–7 business days guaranteed",
                    },
                    {
                      icon: BarChart3,
                      text: "Full report with live URLs, DA, and traffic data",
                    },
                  ].map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex items-center gap-2.5 text-sm text-gray-700"
                    >
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
                <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-soft">
                  <h3 className="mb-3 font-sora text-base font-semibold text-gray-900">
                    Guest Posts vs Niche Edits — which is right for you?
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-gray-600">
                    <strong className="text-gray-900">Guest Posts</strong> are
                    entirely new articles published on authoritative sites with
                    a link back to your target URL. They provide the most
                    control over anchor text, surrounding content, and
                    placement. Ideal for building brand authority and targeting
                    specific keywords.
                  </p>
                  <p className="text-sm leading-relaxed text-gray-600">
                    <strong className="text-gray-900">Niche Edits</strong> (also
                    called curated links) insert your link into an existing,
                    already-indexed article. Since the page already has
                    authority and backlinks of its own, the link power is often
                    stronger per dollar. Best for fast rank improvements on
                    competitive keywords.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-soft">
                  <h3 className="mb-3 font-sora text-base font-semibold text-gray-900">
                    Volume pricing — how it works
                  </h3>
                  <p className="mb-3 text-sm leading-relaxed text-gray-600">
                    Our per-link price drops significantly at volume. The ×10
                    column shows the bundle price for 10 links — which is
                    already 8–13% cheaper than 10 individual orders. At ×1,000
                    links, you save up to 30% versus the single-link rate.
                  </p>
                  <p className="text-sm leading-relaxed text-gray-600">
                    For orders over 1,000 links per month or recurring
                    campaigns, contact us for a custom enterprise rate — which
                    is not published in the table above.
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
              <h3 className="mb-3 font-sora text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
                Need 1,000+ links or a custom campaign?
              </h3>
              <p className="mx-auto mb-7 max-w-lg text-sm text-gray-600 sm:text-base">
                Tell us your niche, targets and budget. We will build a tailored
                bulk link package with enterprise pricing not listed publicly.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Button
                  as="a"
                  href="/contact"
                  size="lg"
                  iconRight={<ArrowRight size={16} />}
                >
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

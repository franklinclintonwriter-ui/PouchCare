import { ArrowRight, Heart, Target, Users, Globe, TrendingUp, Award, CheckCircle, Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { SectionLabel, SectionHeading, SectionSub } from '@/components/ui/SectionLabel';
import { PageSEO } from '@/components/seo/PageSEO';
import { TEAM, STATS } from '@/lib/constants';

/* ── JSON-LD: Person (Founder) ─────────────────────────────────────────────
 * Canonical description (user-verified):
 * "Abdullah Al Mamun, also known as Abdullah Babu, is a Bangladeshi
 *  Entrepreneur and Digital Strategist based in Dubai. He is the founder
 *  of AAWS and PouchCare. Babu is best known for his work in search engine
 *  reputation management in Asia."
 * ────────────────────────────────────────────────────────────────────────── */
const FOUNDER_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://pouchcare.com/#founder',

  /* ── Identity ── */
  name: 'Abdullah Al Mamun',
  alternateName: ['Abdullah Babu', 'Abdullah Al Mamun Babu'],
  givenName: 'Abdullah',
  familyName: 'Al Mamun',

  /* ── Canonical bio — mirrors verified public record ── */
  description:
    'Abdullah Al Mamun, also known as Abdullah Babu, is a Bangladeshi Entrepreneur and Digital Strategist based in Dubai. He is the founder of AAWS and PouchCare. Babu is best known for his work in search engine reputation management in Asia. An award-winning SEO expert with 10+ years of experience, he is widely recognised as South Asia\'s Marketing Pioneer and has been featured in India.com, Republic World, Free Press Journal, Silicon India, and ABP Live.',

  /* ── Role & affiliation ── */
  jobTitle: 'Founder & CEO',
  worksFor: {
    '@type': 'Organization',
    '@id': 'https://pouchcare.com/#organization',
    name: 'PouchCare',
    url: 'https://pouchcare.com',
  },
  founder: [
    {
      '@type': 'Organization',
      name: 'PouchCare',
      url: 'https://pouchcare.com',
    },
    {
      '@type': 'Organization',
      name: 'AAWS',
    },
  ],

  /* ── Location & nationality ── */
  nationality: {
    '@type': 'Country',
    name: 'Bangladesh',
  },
  homeLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Dubai',
      addressRegion: 'Dubai',
      addressCountry: 'AE',
    },
  },

  /* ── Online presence ── */
  url: 'http://abdullahbabu.com/',
  image: {
    '@type': 'ImageObject',
    url: 'https://pouchcare.com/pouchcare-logo-main.png',
    description: 'Abdullah Babu — Founder of PouchCare',
  },

  /* ── Expertise ── */
  knowsAbout: [
    'Search Engine Reputation Management',
    'Search Engine Optimisation',
    'Digital Marketing',
    'Link Building',
    'Affiliate Marketing',
    'Google Penalty Recovery',
    'WordPress Automation',
    'Web Monetisation',
    'Content Marketing',
    'Technical SEO',
  ],

  /* ── Recognition ── */
  award: [
    "South Asia's Marketing Pioneer",
    'Award-Winning SEO Expert',
  ],

  /* ── Verified sameAs — every URL confirms the same identity to Google ── */
  sameAs: [
    'http://abdullahbabu.com/',
    'https://www.linkedin.com/in/abdullahbabu',
    'https://www.instagram.com/abdullahbabuofficial',
    'https://www.devex.com/people/abdullah-babu-2637152',
    'https://www.republicworld.com/initiatives/abdullah-babu-an-seo-strategist-with-a-practical-approach-to-digital-marketing',
    'https://www.india.com/money/abdullah-babu-the-seo-genius-transforming-digital-marketing-in-asia-7866495/',
    'https://www.freepressjournal.in/latest-news/abdullah-al-mamun-the-seo-visionary-from-asia-empowering-global-digital-growth',
    'https://www.siliconindia.com/news/general/abdullah-babu-building-digital-growth-through-simplicity-and-strategy-nid-236632-cid-1.html',
    'https://www.thehansindia.com/news/business/redefining-digital-growth-with-vision-and-integrity-in-asia-986908',
    'https://news.abplive.com/brand-wire/abdullah-al-mamun-babu-the-seo-expert-and-digital-entrepreneur-changing-asia-s-online-world-1796913',
    'https://www.msn.com/en-us/money/smallbusiness/abdullah-al-mamun-babu-the-seo-genius-and-digital-entrepreneur-redefining-asia-s-online-growth/ar-AA1L5gHo',
  ],
};

const VALUES = [
  { icon: Target, title: 'Results-obsessed', description: 'Every strategy decision is driven by one question: will this move the needle for our clients? Vanity metrics have no place here.' },
  { icon: Heart, title: 'Client-first always', description: 'We treat every client like a partner, not a ticket. Your success is our success — and we mean that literally.' },
  { icon: Users, title: 'Transparency at scale', description: 'Live dashboards, weekly standups, direct Slack access. No black boxes, no hiding behind jargon.' },
  { icon: Globe, title: 'Global thinking', description: 'With offices across three continents and clients in 30+ countries, we understand nuanced, international SEO.' },
];

const OFFICES = [
  { city: 'Dubai', flag: '🇦🇪', address: 'Business Bay, Dubai, UAE' },
  { city: 'London', flag: '🇬🇧', address: 'Canary Wharf, London, UK' },
  { city: 'Dhaka', flag: '🇧🇩', address: 'Gulshan, Dhaka, Bangladesh' },
  { city: 'Karachi', flag: '🇵🇰', address: 'DHA Phase 6, Karachi, Pakistan' },
  { city: 'Lahore', flag: '🇵🇰', address: 'Johar Town, Lahore, Pakistan' },
];

const MEDIA_FEATURES = [
  { name: 'India.com', url: 'https://www.india.com/money/abdullah-babu-the-seo-genius-transforming-digital-marketing-in-asia-7866495/' },
  { name: 'Republic World', url: 'https://www.republicworld.com/initiatives/abdullah-babu-an-seo-strategist-with-a-practical-approach-to-digital-marketing' },
  { name: 'Free Press Journal', url: 'https://www.freepressjournal.in/latest-news/abdullah-al-mamun-the-seo-visionary-from-asia-empowering-global-digital-growth' },
  { name: 'Silicon India', url: 'https://www.siliconindia.com/news/general/abdullah-babu-building-digital-growth-through-simplicity-and-strategy-nid-236632-cid-1.html' },
  { name: 'The Hans India', url: 'https://www.thehansindia.com/news/business/redefining-digital-growth-with-vision-and-integrity-in-asia-986908' },
  { name: 'ABP Live', url: 'https://news.abplive.com/brand-wire/abdullah-al-mamun-babu-the-seo-expert-and-digital-entrepreneur-changing-asia-s-online-world-1796913' },
];

export default function About() {
  return (
    <>
      <PageSEO
        title="About PouchCare — Founder Abdullah Babu & Our Story"
        description="PouchCare was founded by Abdullah Al Mamun (Abdullah Babu), award-winning SEO strategist and South Asia's Marketing Pioneer. Learn about our 10+ year journey from a one-laptop operation in Bangladesh to a 60+ person agency across 5 global offices."
        canonical="/about"
        keywords="PouchCare, Abdullah Babu, Abdullah Al Mamun, SEO agency founder, digital marketing agency, PouchCare about us"
        schema={FOUNDER_SCHEMA}
      />

      {/* Hero */}
      <div className="pt-[68px] pb-12 bg-navy-800 border-b border-navy-600">
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <SectionLabel>Our story</SectionLabel>
            <SectionHeading className="mb-4">
              Built by an SEO visionary, <span className="text-gradient">for real results</span>
            </SectionHeading>
            <SectionSub className="max-w-xl mx-auto">
              PouchCare was born from a second-hand laptop in Bangladesh. Today it is a 60+ person
              team across 5 offices, serving 500+ clients in 30+ countries.
            </SectionSub>
          </ScrollReveal>
        </div>
      </div>

      {/* Founder Story */}
      <section className="section-pad">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left">
              <div>
                <SectionLabel>The founder</SectionLabel>
                <h2 className="font-sora font-bold text-2xl sm:text-3xl text-slate-50 mb-5 leading-tight">
                  From a second-hand laptop in Dhaka to{' '}
                  <span className="text-gradient">a global agency</span>
                </h2>
                <div className="space-y-4 text-slate-400 leading-relaxed">
                  <p>
                    <strong className="text-slate-200">Abdullah Al Mamun</strong>, also known as{' '}
                    <strong className="text-slate-200">Abdullah Babu</strong>, is a{' '}
                    <strong className="text-slate-200">Bangladeshi Entrepreneur and Digital Strategist</strong>{' '}
                    based in Dubai. He is the founder of{' '}
                    <strong className="text-slate-200">AAWS</strong> and{' '}
                    <strong className="text-slate-200">PouchCare</strong>. Babu is best known for
                    his work in{' '}
                    <strong className="text-slate-200">
                      search engine reputation management in Asia
                    </strong>
                    .
                  </p>
                  <p>
                    With 10+ years in digital marketing, Abdullah is widely recognised as an
                    award-winning SEO expert and{' '}
                    <strong className="text-slate-200">South Asia's Marketing Pioneer</strong>. His
                    journey began with a second-hand laptop and a slow internet connection in
                    Bangladesh — through relentless self-learning he mastered SEO, content
                    marketing, affiliate strategy, Google penalty recovery, and web monetisation.
                  </p>
                  <p>
                    PouchCare is the agency he built to solve the problem he kept seeing: great
                    businesses struggling to be found online while lesser competitors dominated
                    search results. Today the agency serves 500+ clients across 30+ countries from
                    5 global offices, with Abdullah leading strategy from Dubai, UAE.
                  </p>
                </div>

                {/* Media badges */}
                <div className="mt-6">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-3 font-medium">Featured in</p>
                  <div className="flex flex-wrap gap-2">
                    {MEDIA_FEATURES.map((m) => (
                      <a
                        key={m.name}
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-navy-500 text-slate-400 text-xs hover:text-sky-400 hover:border-sky-500/30 transition-colors"
                      >
                        {m.name}
                        <ExternalLink size={10} className="opacity-60" />
                      </a>
                    ))}
                  </div>
                </div>

                <a
                  href="http://abdullahbabu.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 text-sky-400 text-sm font-medium hover:text-sky-300 transition-colors group"
                >
                  Visit Abdullah&apos;s personal site
                  <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </ScrollReveal>

            {/* Stats grid */}
            <ScrollReveal direction="right">
              <div className="grid grid-cols-2 gap-4">
                {STATS.map((s, i) => (
                  <div key={s.label} className={`glass-card p-6 text-center ${i === 1 ? 'mt-6' : i === 3 ? '-mt-6' : ''}`}>
                    <div className="font-sora font-bold text-4xl text-slate-50 mb-2">
                      <AnimatedCounter end={s.value} suffix={s.suffix} />
                    </div>
                    <div className="text-slate-400 text-sm">{s.label}</div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-pad bg-navy-800">
        <div className="container-max">
          <div className="text-center mb-12">
            <ScrollReveal>
              <SectionLabel>What drives us</SectionLabel>
              <SectionHeading>Our values</SectionHeading>
            </ScrollReveal>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <ScrollReveal key={v.title} delay={i * 80}>
                  <div className="p-6 rounded-2xl border border-navy-600/60 hover:border-sky-500/20 transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-100 mb-2">{v.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{v.description}</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-pad">
        <div className="container-max">
          <div className="text-center mb-12">
            <ScrollReveal>
              <SectionLabel>Meet the team</SectionLabel>
              <SectionHeading>The people behind <span className="text-gradient">your results</span></SectionHeading>
            </ScrollReveal>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEAM.map((member, i) => (
              <ScrollReveal key={member.name} delay={i * 80}>
                <div className={`glass-card p-6 flex items-start gap-4 group hover:border-sky-500/30 transition-all ${i === 0 ? 'lg:col-span-1 border-sky-500/20 bg-sky-500/5' : ''}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sky-400 font-bold font-sora text-lg shrink-0 border ${i === 0 ? 'bg-gradient-to-br from-sky-500/30 to-indigo-500/30 border-sky-500/40' : 'bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border-sky-500/20'}`}>
                    {member.avatar}
                  </div>
                  <div>
                    <h3 className={`font-semibold group-hover:text-sky-400 transition-colors ${i === 0 ? 'text-sky-300' : 'text-slate-100'}`}>{member.name}</h3>
                    <p className="text-sky-400 text-xs font-medium mb-2">{member.role}</p>
                    <p className="text-slate-400 text-sm leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones timeline */}
      <section className="section-pad px-4 sm:px-6 lg:px-8 bg-navy-800">
        <div className="container-max">
          <div className="text-center mb-10">
            <ScrollReveal>
              <SectionLabel>Our journey</SectionLabel>
              <SectionHeading className="mb-3">
                Ten years of <span className="text-gradient">compounding growth</span>
              </SectionHeading>
              <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
                From a one-person freelance operation with a slow internet connection in Bangladesh
                to a global agency with 60+ specialists across 5 offices — here is the PouchCare story.
              </p>
            </ScrollReveal>
          </div>
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-sky-500/40 via-indigo-500/20 to-transparent hidden sm:block" />
            <div className="space-y-6">
              {[
                {
                  year: '2014',
                  title: 'The beginning — a self-taught freelancer',
                  desc: 'Abdullah Babu, then a teenager in Bangladesh, teaches himself SEO, content marketing, and affiliate strategy on a second-hand laptop. First freelance earnings begin.',
                },
                {
                  year: '2016',
                  title: 'PouchCare founded',
                  desc: 'After years of self-learning and freelance success, Abdullah launches PouchCare as a structured SEO consultancy. First paid clients onboarded. Link building becomes the flagship service.',
                },
                {
                  year: '2018',
                  title: 'First dedicated office · Team of 8',
                  desc: 'Compounding referrals fund PouchCare\'s first office in Dhaka. A specialist team is hired. The publisher network grows to 500+ verified sites.',
                },
                {
                  year: '2020',
                  title: 'Dubai & London expansion',
                  desc: 'PouchCare establishes offices in Business Bay, Dubai and Canary Wharf, London. Abdullah relocates to Dubai. Client roster crosses 100 active accounts across 15 countries.',
                },
                {
                  year: '2022',
                  title: '60-person team · 300+ clients',
                  desc: 'Headcount triples. White-label agency platform launched. PouchCare recognised as a top-50 link building agency globally. Karachi and Lahore offices open.',
                },
                {
                  year: '2024–25',
                  title: '500+ clients · 30+ countries',
                  desc: 'The agency now serves 500+ businesses across 30+ countries from 5 offices. Publisher network exceeds 5,000 verified sites. Abdullah featured in India.com, Republic World, Free Press Journal, Silicon India, ABP Live and more.',
                },
              ].map((m, i) => (
                <ScrollReveal key={m.year} delay={i * 80}>
                  <div className={`flex items-start gap-5 sm:gap-8 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                    <div className="flex-1 p-5 rounded-2xl border border-navy-600/60 bg-navy-700/30 hover:border-sky-500/20 hover:bg-navy-700/50 transition-all group">
                      <div className="text-sky-400 font-mono font-bold text-sm mb-1">{m.year}</div>
                      <h3 className="font-sora font-semibold text-slate-100 mb-2 group-hover:text-sky-300 transition-colors">{m.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Achievements strip */}
      <section className="pb-10 pt-0 px-4 sm:px-6 lg:px-8">
        <div className="container-max">
          <ScrollReveal>
            <div className="rounded-2xl border border-navy-600/60 bg-navy-800/50 p-7 sm:p-8">
              <div className="text-center mb-8">
                <SectionLabel>Recognition</SectionLabel>
                <h2 className="font-sora font-bold text-xl sm:text-2xl text-slate-50 mb-3">
                  Awards &amp; industry recognition
                </h2>
                <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
                  We do not pursue awards for the sake of it. But when our clients&apos; results speak
                  for themselves, the industry takes notice.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { icon: Award, title: 'Top 50 Link Building Agency', sub: 'Clutch.co · 2024' },
                  { icon: TrendingUp, title: "South Asia's Marketing Pioneer", sub: 'Abdullah Babu · Recognised industry-wide' },
                  { icon: CheckCircle, title: '4.9/5 Average Client Rating', sub: 'Based on 200+ verified reviews' },
                  { icon: Zap, title: 'Google Partner Certified', sub: 'Ads management team' },
                ].map(({ icon: Icon, title, sub }) => (
                  <div key={title} className="text-center p-5 rounded-xl border border-navy-600/40 bg-navy-700/20 hover:border-sky-500/20 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-sky-500/20 transition-colors">
                      <Icon size={18} className="text-sky-400" />
                    </div>
                    <div className="font-semibold text-slate-100 text-sm mb-1 group-hover:text-sky-300 transition-colors">{title}</div>
                    <div className="text-slate-500 text-xs">{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Offices */}
      <section className="section-pad bg-navy-800">
        <div className="container-max">
          <div className="text-center mb-10">
            <ScrollReveal>
              <SectionLabel>Where we are</SectionLabel>
              <SectionHeading>Our offices</SectionHeading>
            </ScrollReveal>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {OFFICES.map((o, i) => (
              <ScrollReveal key={o.city} delay={i * 60}>
                <div className="glass-card p-5 text-center hover:border-sky-500/30 transition-colors">
                  <div className="text-3xl mb-2">{o.flag}</div>
                  <h3 className="font-semibold text-slate-100 mb-1">{o.city}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{o.address}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad">
        <div className="container-max text-center">
          <ScrollReveal>
            <SectionHeading className="mb-4">
              Ready to work with a team that{' '}
              <span className="text-gradient">cares about results?</span>
            </SectionHeading>
            <SectionSub className="max-w-lg mx-auto mb-10">
              Book a free 30-minute strategy call and let us show you exactly how we will grow your
              organic traffic.
            </SectionSub>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button as="a" href="/contact" size="xl" iconRight={<ArrowRight size={18} />}>
                Book a Free Strategy Call
              </Button>
              <Button as="a" href="/services" variant="outline" size="xl">
                View Our Services
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

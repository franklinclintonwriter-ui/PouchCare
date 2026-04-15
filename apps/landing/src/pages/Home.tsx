import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Star,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  BarChart3,
  Users,
  Award,
  Clock,
  Sparkles,
  BookOpen,
  Target,
  LineChart,
  MessageSquare,
  Layers,
  Link2,
  Search,
  RefreshCw,
  HeartHandshake,
  Lightbulb,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import {
  SectionLabel,
  SectionHeading,
  SectionSub,
} from "@/components/ui/SectionLabel";
import { PageSEO } from "@/components/seo/PageSEO";
import {
  SERVICES,
  WHY_US,
  TESTIMONIALS,
  STATS,
  BLOG_POSTS,
  PLANS,
} from "@/lib/constants";
import { cn } from "@/lib/cn";

// ── Hero ──────────────────────────────────────────────────────────────────

function Hero() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-100 gpu">
      {/* Cursor glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(700px circle at ${mousePos.x}% ${mousePos.y}%, rgba(37,99,235,0.08) 0%, transparent 60%)`,
        }}
      />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-sky-600/10 blur-[140px] animate-float pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px] animate-float-slow pointer-events-none" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-sky-500/8 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-8 animate-fade-up">
          <Sparkles size={13} className="animate-pulse-slow" />
          Trusted by 500+ businesses across 30+ countries
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
        </div>

        <h1
          className="font-sora font-bold leading-[1.05] tracking-tight mb-7 animate-fade-up animation-delay-100"
          style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
        >
          <span className="text-slate-900">Rank Higher.</span>{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #38bdf8 100%)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmer 4s linear infinite",
            }}
          >
            Build Faster.
          </span>
          <br />
          <span className="text-slate-900">Grow </span>
          <span
            style={{
              background: "linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Smarter.
          </span>
        </h1>

        <p
          className="text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up animation-delay-200"
          style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)" }}
        >
          Premium SEO, link building, web development and digital marketing
          services that deliver real, measurable results — no lock-in contracts,
          no hidden fees.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-14 animate-fade-up animation-delay-300">
          <Link
            to="/contact"
            className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-white text-base overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
              transition:
                "transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease",
              willChange: "transform",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(0)";
            }}
          >
            <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-[background-color] duration-200" />
            <span className="relative">Get a Free Strategy Call</span>
            <ArrowRight
              size={17}
              className="relative group-hover:translate-x-1 transition-transform duration-200"
            />
          </Link>
          <Link
            to="/services"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-gray-700 text-base border border-gray-300 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50"
            style={{
              transition:
                "color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, transform 0.25s cubic-bezier(0.22,1,0.36,1)",
              willChange: "transform",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(0)";
            }}
          >
            Explore Services
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 animate-fade-up animation-delay-400">
          {[
            { icon: Shield, text: "White-hat only" },
            { icon: CheckCircle, text: "No contracts" },
            { icon: Award, text: "Money-back guarantee" },
            { icon: Clock, text: "24/7 support" },
          ].map(({ icon: Icon, text }) => (
            <span
              key={text}
              className="flex items-center gap-1.5 text-slate-500 text-xs sm:text-sm"
            >
              <Icon size={13} className="text-sky-500" />
              {text}
            </span>
          ))}
        </div>

        {/* ── Review Trust Bar ─────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8 animate-fade-up animation-delay-400">
          {/* Trustpilot */}
          <a
            href="https://trustpilot.com/review/pouchcare.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-[#00b67a]/40 hover:bg-[#f7fef9] shadow-soft transition-all duration-200"
          >
            <span className="w-6 h-6 rounded-md bg-[#00b67a] flex items-center justify-center shrink-0">
              <Star size={14} className="text-white fill-white" />
            </span>
            <span className="flex flex-col items-start leading-none">
              <span className="text-[11px] text-gray-500 font-medium">
                Trustpilot
              </span>
              <span className="flex items-center gap-0.5 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={9}
                    className="text-[#00b67a] fill-[#00b67a]"
                  />
                ))}
              </span>
            </span>
          </a>
          {/* Google Reviews */}
          <a
            href="https://share.google/6nNEF76YLXDvM3PYE"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-[#4285f4]/40 hover:bg-blue-50/50 shadow-soft transition-all duration-200"
          >
            <span className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0 text-sm leading-none font-bold overflow-hidden">
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                  fill="#fff"
                />
                <path
                  d="M20.64 12.2c0-.63-.06-1.25-.16-1.84H12v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.63z"
                  fill="#4285F4"
                />
                <path
                  d="M12 21c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H3.96v2.33C5.44 19.1 8.51 21 12 21z"
                  fill="#34A853"
                />
                <path
                  d="M6.97 13.71A5.95 5.95 0 0 1 6.66 12c0-.59.1-1.17.31-1.71V7.96H3.96A9.98 9.98 0 0 0 2 12c0 1.61.39 3.14 1.07 4.49a.5.5 0 0 0 .89 0l2.01-2.78z"
                  fill="#FBBC04"
                />
                <path
                  d="M12 6.58c1.32 0 2.51.45 3.44 1.34l2.58-2.58C16.46 3.89 14.43 3 12 3 8.51 3 5.44 4.9 3.96 7.75l3.01 2.33C7.68 8.16 9.66 6.58 12 6.58z"
                  fill="#EA4335"
                />
              </svg>
            </span>
            <span className="flex flex-col items-start leading-none">
              <span className="text-[11px] text-gray-500 font-medium">
                Google Reviews
              </span>
              <span className="flex items-center gap-0.5 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={9}
                    className="text-[#FBBC04] fill-[#FBBC04]"
                  />
                ))}
              </span>
            </span>
          </a>
          {/* Facebook */}
          <a
            href="https://www.facebook.com/pouchcare"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-[#1877f2]/40 hover:bg-blue-50/50 shadow-soft transition-all duration-200"
          >
            <span className="w-6 h-6 rounded-md bg-[#1877f2] flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 fill-white"
                aria-hidden="true"
              >
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.492 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
              </svg>
            </span>
            <span className="flex flex-col items-start leading-none">
              <span className="text-[11px] text-gray-500 font-medium">
                Facebook
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">
                Follow us
              </span>
            </span>
          </a>
        </div>

        {/* Floating stat cards — desktop only */}
        <div className="hidden lg:block">
          <div className="absolute left-8 top-1/3 -translate-y-1/2 bg-white border border-gray-200 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-float text-left w-52 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center">
                <TrendingUp size={14} className="text-green-600" />
              </div>
              <span className="text-gray-500 text-xs font-medium">
                Organic Traffic
              </span>
            </div>
            <div className="text-2xl font-sora font-bold text-gray-900">
              +312%
            </div>
            <div className="text-xs text-green-600 mt-0.5">↑ vs last year</div>
          </div>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-float-slow text-left w-52 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <BarChart3 size={14} className="text-blue-600" />
              </div>
              <span className="text-gray-500 text-xs font-medium">
                Keywords Ranked
              </span>
            </div>
            <div className="text-2xl font-sora font-bold text-gray-900">
              8,400+
            </div>
            <div className="text-xs text-blue-600 mt-0.5">Page 1 positions</div>
          </div>
          <div className="absolute left-16 bottom-28 bg-white border border-gray-200 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-float-slow text-left w-48 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Users size={14} className="text-indigo-600" />
              </div>
              <span className="text-gray-500 text-xs font-medium">
                Happy Clients
              </span>
            </div>
            <div className="text-xl font-sora font-bold text-gray-900">
              500+
            </div>
            <div className="flex gap-0.5 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className="text-yellow-400 fill-yellow-400"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────

function StatsBar() {
  return (
    <section className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10 lg:divide-x lg:divide-white/10">
          {STATS.map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 90}>
              <div className="text-center group lg:px-6">
                <div className="font-sora font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-1.5 group-hover:text-yellow-300 transition-colors duration-300">
                  <AnimatedCounter end={s.value} suffix={s.suffix} />
                </div>
                <div className="text-blue-200 text-xs sm:text-sm font-medium tracking-wide">
                  {s.label}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Services preview ──────────────────────────────────────────────────────

const SERVICE_ACCENT_BG: Record<string, string> = {
  SEO: "from-sky-50 to-blue-50",
  Dev: "from-indigo-50 to-violet-50",
  Design: "from-emerald-50 to-teal-50",
  Content: "from-amber-50 to-orange-50",
  Ads: "from-rose-50 to-pink-50",
};

const SERVICE_ACCENT_BORDER: Record<string, string> = {
  SEO: "group-hover:border-sky-300",
  Dev: "group-hover:border-indigo-300",
  Design: "group-hover:border-emerald-300",
  Content: "group-hover:border-amber-300",
  Ads: "group-hover:border-rose-300",
};

const SERVICE_ACCENT_TEXT: Record<string, string> = {
  SEO: "text-sky-600",
  Dev: "text-indigo-600",
  Design: "text-emerald-600",
  Content: "text-amber-600",
  Ads: "text-rose-600",
};

function ServicesPreview() {
  const preview = SERVICES.slice(0, 6);
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <ScrollReveal>
            <SectionLabel>What we offer</SectionLabel>
            <SectionHeading className="mb-4">
              Everything you need to{" "}
              <span className="text-gradient">dominate search</span>
            </SectionHeading>
            <SectionSub className="max-w-xl mx-auto">
              20+ specialist services covering every angle of your digital
              growth — SEO, development, design, content and advertising under
              one roof.
            </SectionSub>
          </ScrollReveal>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-10">
          {preview.map((s, i) => (
            <ScrollReveal key={s.name} delay={i * 60}>
              <div
                className={cn(
                  "group relative rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300",
                  SERVICE_ACCENT_BORDER[s.category] ??
                    "group-hover:border-gray-300",
                )}
              >
                {/* Image area */}
                <div
                  className={cn(
                    "relative h-40 sm:h-44 overflow-hidden bg-gradient-to-br",
                    SERVICE_ACCENT_BG[s.category] ?? "from-gray-50 to-gray-100",
                  )}
                >
                  {s.image ? (
                    <img
                      src={s.image}
                      alt={s.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-5xl">
                      {s.icon}
                    </div>
                  )}
                  {/* Badge */}
                  {s.badge && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-blue-700 border border-blue-100 shadow-sm">
                      {s.badge}
                    </span>
                  )}
                  {/* Category pill */}
                  <span
                    className={cn(
                      "absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-semibold border border-gray-100",
                      SERVICE_ACCENT_TEXT[s.category] ?? "text-gray-600",
                    )}
                  >
                    {s.category}
                  </span>
                </div>
                {/* Content */}
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-sora font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-base leading-snug">
                      {s.name}
                    </h3>
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 shrink-0 whitespace-nowrap">
                      {s.price}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                    {s.description}
                  </p>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors group-hover:gap-2.5"
                  >
                    Get a quote{" "}
                    <ArrowRight size={12} className="transition-all" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal>
          <div className="text-center">
            <Link
              to="/services"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-gray-700 border border-gray-300 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all duration-300 group"
            >
              View all 20+ services{" "}
              <ArrowRight
                size={15}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ── Problem → Solution ────────────────────────────────────────────────────

const PAIN_POINTS = [
  {
    icon: "😤",
    problem: "Your website buried on page 3+",
    solution:
      "We push you to page 1 for high-intent keywords within 90 days using proven on-page and off-page SEO strategies.",
  },
  {
    icon: "📉",
    problem: "Traffic drops after algorithm updates",
    solution:
      "White-hat, E-E-A-T focused SEO means your rankings are stable and improve after updates — not punished.",
  },
  {
    icon: "💸",
    problem: "Burning budget on Google Ads only",
    solution:
      "We build organic authority so you own your traffic long-term and reduce dependency on paid ads over time.",
  },
  {
    icon: "🕳️",
    problem: "Agency promises with zero results",
    solution:
      "Every engagement starts with a measurable 90-day goal. No fluff, no excuses — just numbers you can verify weekly.",
  },
];

function ProblemSolution() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-navy-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <ScrollReveal>
            <SectionLabel>Sound familiar?</SectionLabel>
            <SectionHeading className="mb-4">
              We solve the problems other{" "}
              <span className="text-gradient">agencies ignore</span>
            </SectionHeading>
            <SectionSub className="max-w-2xl mx-auto">
              Every day we speak to business owners who have been burned by SEO
              agencies that promised results and vanished. Here is how we are
              different — with receipts.
            </SectionSub>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PAIN_POINTS.map((p, i) => (
            <ScrollReveal key={p.problem} delay={i * 80}>
              <div className="group rounded-2xl border border-navy-600/60 bg-navy-700/30 hover:bg-navy-700/60 hover:border-sky-500/20 transition-all duration-300 overflow-hidden">
                <div className="p-6 sm:p-7">
                  {/* Problem row */}
                  <div className="flex items-start gap-4 mb-4 pb-4 border-b border-navy-600/60">
                    <span className="text-2xl shrink-0 mt-0.5">{p.icon}</span>
                    <div>
                      <div className="text-xs uppercase tracking-widest text-rose-400 font-semibold mb-1">
                        The Problem
                      </div>
                      <p className="text-slate-300 font-medium">{p.problem}</p>
                    </div>
                  </div>
                  {/* Solution row */}
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-sky-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle size={13} className="text-sky-400" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-widest text-sky-400 font-semibold mb-1">
                        Our Solution
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {p.solution}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Process section ───────────────────────────────────────────────────────

const PROCESS_STEPS = [
  {
    num: "01",
    icon: Search,
    title: "Discovery & Audit",
    desc: "We perform a deep audit of your website, competitive landscape, and keyword opportunities. This 40-point analysis identifies exactly where you are losing visibility and what it will take to dominate your niche.",
  },
  {
    num: "02",
    icon: Target,
    title: "Custom Strategy",
    desc: "Our senior strategists build a 90-day growth roadmap tailored specifically to your industry, competition level, and budget. You get a clear deliverables calendar, expected ranking milestones, and KPI targets before we start.",
  },
  {
    num: "03",
    icon: Layers,
    title: "Full Execution",
    desc: "Links go live, pages get optimised, technical fixes are deployed, and content is published — all on schedule. We handle everything from outreach to implementation so your team can focus on running the business.",
  },
  {
    num: "04",
    icon: RefreshCw,
    title: "Measure & Scale",
    desc: "We track rankings, organic traffic, and revenue impact every week. What moves the needle gets scaled. What does not gets iterated. Most clients see measurable ranking improvements within the first 30–45 days.",
  },
];

function Process() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <ScrollReveal>
            <SectionLabel>How it works</SectionLabel>
            <SectionHeading className="mb-4">
              From strategy to{" "}
              <span className="text-gradient">rankings in 4 steps</span>
            </SectionHeading>
            <SectionSub className="max-w-lg mx-auto">
              A battle-tested process refined across 500+ campaigns and 8 years
              of algorithm updates. No guesswork — just a proven system that
              compounds over time.
            </SectionSub>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 relative">
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />
          {PROCESS_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <ScrollReveal key={step.num} delay={i * 100}>
                <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-navy-600/60 bg-navy-700/30 hover:bg-navy-700/60 hover:border-sky-500/25 transition-all duration-300 group h-full">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500/15 to-indigo-500/15 border border-sky-500/20 flex items-center justify-center mb-4 group-hover:border-sky-500/40 transition-colors shrink-0">
                    <Icon size={20} className="text-sky-400" />
                  </div>
                  <div className="font-mono text-xs font-bold text-sky-500/60 mb-2">
                    {step.num}
                  </div>
                  <h3 className="font-sora font-semibold text-slate-100 mb-3 group-hover:text-sky-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Why PouchCare ─────────────────────────────────────────────────────────

const WHY_ICONS = [TrendingUp, Shield, Zap, Globe, CheckCircle, BarChart3];

function WhyUs() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-navy-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <ScrollReveal direction="left">
            <div>
              <SectionLabel>Why PouchCare</SectionLabel>
              <SectionHeading className="mb-5">
                The agency that{" "}
                <span className="text-gradient">actually delivers</span>
              </SectionHeading>
              <p className="text-slate-400 leading-relaxed mb-6">
                We have been in the trenches since 2016. While other agencies
                churn through clients with one-size-fits-all campaigns, every
                PouchCare engagement starts with a genuine deep-dive into{" "}
                <em>your</em> business, your competitors, and your customers.
              </p>
              <p className="text-slate-400 leading-relaxed mb-8">
                No vanity metrics, no hollow promises, no disappearing account
                managers. Just transparent, algorithm-proof growth you can
                measure every single week — delivered by a team of specialists
                who genuinely care about your success.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "100% white-hat — zero risk of Google penalties",
                  "Dedicated account manager, direct Slack access",
                  "Weekly live reporting dashboards you can check anytime",
                  "Free strategy audits for all new enquiries",
                  "Money-back guarantee if targets are not met",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-slate-300 text-sm"
                  >
                    <CheckCircle size={16} className="text-sky-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-sky-400 font-semibold text-sm hover:gap-3 transition-all duration-200"
              >
                Meet the team <ArrowRight size={14} />
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WHY_US.map((item, i) => {
                const Icon = WHY_ICONS[i % WHY_ICONS.length];
                return (
                  <div
                    key={item.title}
                    className="p-5 rounded-2xl border border-navy-600/60 bg-navy-800/50 hover:border-sky-500/20 hover:bg-navy-700/50 transition-all duration-200 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center mb-3 group-hover:bg-sky-500/20 transition-colors">
                      <Icon size={16} className="text-sky-400" />
                    </div>
                    <h3 className="font-semibold text-slate-100 text-sm mb-1.5 group-hover:text-sky-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ── Industries We Serve ───────────────────────────────────────────────────

const INDUSTRIES = [
  {
    icon: "🛒",
    name: "E-commerce",
    desc: "Product SEO, category optimisation, and high-authority link building that drives sales — not just traffic.",
  },
  {
    icon: "🏡",
    name: "Real Estate",
    desc: 'Local SEO dominance for property agencies. Rank for "homes for sale in [city]" and capture buyer intent at scale.',
  },
  {
    icon: "⚖️",
    name: "Legal & Finance",
    desc: "YMYL-compliant SEO that builds genuine E-E-A-T authority for law firms, accountants, and financial advisers.",
  },
  {
    icon: "🏥",
    name: "Healthcare & Med",
    desc: "Google-compliant medical SEO for clinics, telehealth platforms, and healthcare brands that need trust signals.",
  },
  {
    icon: "🖥️",
    name: "SaaS & Tech",
    desc: "High-intent keyword targeting that brings trial sign-ups, not just page views. SEO that maps to your funnel.",
  },
  {
    icon: "🏨",
    name: "Travel & Hospitality",
    desc: "Destination SEO, review management, and backlink campaigns that put your property above OTA listings.",
  },
  {
    icon: "🎓",
    name: "Education & eLearning",
    desc: "Course and programme SEO that attracts students actively searching for the knowledge you provide.",
  },
  {
    icon: "🏗️",
    name: "Construction & Trades",
    desc: "Local pack dominance and organic rankings for contractors, builders, and trade businesses across any region.",
  },
];

function Industries() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <ScrollReveal>
            <SectionLabel>Industry expertise</SectionLabel>
            <SectionHeading className="mb-4">
              We know your market, <span className="text-gradient">deeply</span>
            </SectionHeading>
            <SectionSub className="max-w-2xl mx-auto">
              SEO is not one-size-fits-all. Google weights results differently
              for YMYL industries, local businesses, and global SaaS companies.
              Our team includes niche specialists who have run campaigns in your
              vertical for years — so you never have to explain your business
              from scratch.
            </SectionSub>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {INDUSTRIES.map((ind, i) => (
            <ScrollReveal key={ind.name} delay={i * 55}>
              <div className="group p-5 sm:p-6 rounded-2xl border border-navy-600/60 bg-navy-800/40 hover:bg-navy-700/60 hover:border-sky-500/20 hover:shadow-[0_4px_24px_rgba(14,165,233,0.06)] transition-all duration-300 h-full flex flex-col">
                <span className="text-2xl mb-3">{ind.icon}</span>
                <h3 className="font-sora font-semibold text-slate-100 text-sm mb-2 group-hover:text-sky-300 transition-colors">
                  {ind.name}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed flex-1">
                  {ind.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Case Study Strip ──────────────────────────────────────────────────────

const CASE_STUDIES = [
  {
    label: "E-commerce · UK",
    title: "Online fashion retailer 3× organic revenue in 5 months",
    bullets: [
      "DA rose from 18 → 47",
      "+287% non-brand organic clicks",
      "58 first-page keywords in competitive niches",
      "Reduced paid-ad spend by 40% while growing revenue",
    ],
    tag: "SEO + Link Building",
  },
  {
    label: "SaaS · USA",
    title: "B2B SaaS company hit #1 for their core product keywords",
    bullets: [
      "Domain authority 22 → 51 in 8 months",
      "4× monthly trial sign-ups from organic",
      "Blog content strategy driving 12k/mo visitors",
      "Zero penalty risk — pure white-hat approach",
    ],
    tag: "Technical SEO + Content",
  },
  {
    label: "Real Estate · UAE",
    title: "Dubai property portal dominating Google Maps & organic",
    bullets: [
      "140+ local keywords on page 1",
      "Google Maps 3-pack for 28 property types",
      "Arabic + English multilingual SEO",
      "300% increase in qualified lead enquiries",
    ],
    tag: "Local SEO + Multilingual",
  },
];

function CaseStudies() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-navy-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <ScrollReveal>
            <SectionLabel>Proven results</SectionLabel>
            <SectionHeading className="mb-4">
              Real campaigns.{" "}
              <span className="text-gradient">Real numbers.</span>
            </SectionHeading>
            <SectionSub className="max-w-xl mx-auto">
              We do not hide behind generic "average client results"
              disclaimers. Here are three snapshots from recent campaigns with
              verifiable outcomes.
            </SectionSub>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {CASE_STUDIES.map((cs, i) => (
            <ScrollReveal key={cs.title} delay={i * 100}>
              <div className="group relative rounded-2xl overflow-hidden border border-navy-600/60 bg-navy-700/30 hover:border-sky-500/25 hover:bg-navy-700/60 transition-all duration-300 h-full flex flex-col">
                {/* Top accent line */}
                <div className="h-1 w-full bg-gradient-to-r from-sky-500 to-indigo-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="p-6 sm:p-7 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <span className="text-xs text-slate-500 font-medium">
                      {cs.label}
                    </span>
                    <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                      {cs.tag}
                    </span>
                  </div>
                  <h3 className="font-sora font-semibold text-slate-100 text-base mb-5 leading-snug group-hover:text-sky-200 transition-colors">
                    {cs.title}
                  </h3>
                  <ul className="space-y-2.5 flex-1">
                    {cs.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2.5 text-slate-400 text-sm"
                      >
                        <TrendingUp
                          size={13}
                          className="text-green-400 mt-0.5 shrink-0"
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-navy-600/60">
                    <Link
                      to="/contact"
                      className="text-xs font-semibold text-sky-400/70 hover:text-sky-400 inline-flex items-center gap-1.5 transition-colors"
                    >
                      Get similar results <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────

function Testimonials() {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = TESTIMONIALS.length;

  const go = (n: number) => {
    setIdx(n);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % count), 5500);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % count), 5500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count]);

  const t = TESTIMONIALS[idx];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <ScrollReveal>
            <SectionLabel>Client results</SectionLabel>
            <SectionHeading className="mb-4">
              What our clients say
            </SectionHeading>
            <SectionSub className="max-w-lg mx-auto">
              Over 500 businesses trust PouchCare with their organic growth.
              Here is what some of them have to say about working with our team.
            </SectionSub>
          </ScrollReveal>
        </div>

        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <div className="relative rounded-3xl border border-navy-600/70 bg-gradient-to-br from-navy-700/60 to-navy-800/60 backdrop-blur p-8 sm:p-12 text-center overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-sky-500/5 blur-[60px] pointer-events-none" />
              <div className="relative">
                <div className="flex justify-center gap-1 mb-6">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className="text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-200 text-lg sm:text-xl leading-relaxed mb-8 italic font-light">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold font-sora">
                    {t.name[0]}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-100">
                      {t.flag} {t.name}
                    </div>
                    <div className="text-slate-400 text-sm">{t.role}</div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <div className="flex items-center justify-center gap-3 mt-7">
            <button
              onClick={() => go((idx - 1 + count) % count)}
              className="w-8 h-8 rounded-full border border-navy-500 text-slate-400 hover:text-white hover:border-sky-500/50 hover:bg-sky-500/8 transition-all flex items-center justify-center"
            >
              <ChevronLeft size={15} />
            </button>
            <div className="flex gap-1.5">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === idx
                      ? "w-7 bg-sky-500"
                      : "w-1.5 bg-navy-500 hover:bg-navy-400",
                  )}
                />
              ))}
            </div>
            <button
              onClick={() => go((idx + 1) % count)}
              className="w-8 h-8 rounded-full border border-navy-500 text-slate-400 hover:text-white hover:border-sky-500/50 hover:bg-sky-500/8 transition-all flex items-center justify-center"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Pricing snapshot ──────────────────────────────────────────────────────

function PricingSnapshot() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-navy-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <ScrollReveal>
            <SectionLabel>Transparent pricing</SectionLabel>
            <SectionHeading className="mb-4">
              Simple plans, <span className="text-gradient">no surprises</span>
            </SectionHeading>
            <SectionSub className="max-w-xl mx-auto">
              Every plan includes a dedicated account manager, weekly reporting,
              and a satisfaction guarantee. Cancel any month — no minimum
              commitment, ever.
            </SectionSub>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {PLANS.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={i * 100}>
              <div
                className={cn(
                  "relative rounded-2xl border p-7 flex flex-col h-full transition-all duration-300 group",
                  plan.isPopular
                    ? "border-sky-500/40 bg-gradient-to-br from-sky-500/8 to-indigo-500/5 hover:border-sky-500/60"
                    : "border-navy-600/60 bg-navy-700/30 hover:border-sky-500/20 hover:bg-navy-700/50",
                )}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-xs font-bold shadow-lg">
                    Most Popular
                  </div>
                )}
                <div
                  className={cn(
                    "text-xs font-bold uppercase tracking-widest mb-2",
                    plan.color,
                  )}
                >
                  {plan.name}
                </div>
                <div className="flex items-end gap-1.5 mb-6">
                  <span className="font-sora font-bold text-4xl text-slate-50">
                    ${plan.monthlyPrice}
                  </span>
                  <span className="text-slate-400 text-sm mb-1">/month</span>
                </div>
                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-slate-300 text-sm"
                    >
                      <CheckCircle
                        size={14}
                        className="text-sky-400 shrink-0"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className={cn(
                    "w-full text-center py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5",
                    plan.isPopular
                      ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:shadow-[0_8px_24px_rgba(14,165,233,0.3)]"
                      : "border border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50",
                  )}
                >
                  Get started
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="text-center">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 text-sm transition-colors"
            >
              See full pricing & compare plans <ArrowRight size={13} />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ── Blog / Resources ──────────────────────────────────────────────────────

const BLOG_ICONS: Record<string, typeof BookOpen> = {
  "Link Building": Link2,
  "Case Study": LineChart,
  "Technical SEO": Lightbulb,
};

function BlogPreview() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
          <ScrollReveal>
            <div>
              <SectionLabel>Knowledge hub</SectionLabel>
              <SectionHeading className="mb-2">
                Free SEO <span className="text-gradient">resources</span>
              </SectionHeading>
              <SectionSub>
                Actionable guides, case studies, and industry insights — no
                email required.
              </SectionSub>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <Link
              to="/blog"
              className="shrink-0 inline-flex items-center gap-2 text-sky-400 font-semibold text-sm hover:gap-3 transition-all"
            >
              View all articles <ArrowRight size={13} />
            </Link>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {BLOG_POSTS.map((post, i) => {
            const Icon = BLOG_ICONS[post.category] ?? BookOpen;
            return (
              <ScrollReveal key={post.slug} delay={i * 80}>
                <div className="group rounded-2xl border border-navy-600/60 bg-navy-700/30 hover:bg-navy-700/60 hover:border-sky-500/20 hover:shadow-[0_4px_24px_rgba(14,165,233,0.06)] transition-all duration-300 overflow-hidden flex flex-col h-full">
                  {/* Fake image strip */}
                  <div className="h-2 w-full bg-gradient-to-r from-sky-500/60 to-indigo-500/60 group-hover:from-sky-500 group-hover:to-indigo-500 transition-colors duration-300" />
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center">
                        <Icon size={13} className="text-sky-400" />
                      </div>
                      <span className="text-xs font-semibold text-sky-400">
                        {post.category}
                      </span>
                      <span className="text-xs text-slate-600 ml-auto">
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="font-sora font-semibold text-slate-100 text-sm leading-snug mb-3 group-hover:text-sky-200 transition-colors flex-1">
                      {post.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-5">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-navy-600/60">
                      <span className="text-xs text-slate-500">
                        {post.date}
                      </span>
                      <Link
                        to="/blog"
                        className="text-xs font-semibold text-sky-400/70 hover:text-sky-400 inline-flex items-center gap-1 transition-colors"
                      >
                        Read more <ArrowRight size={10} />
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "How long does SEO take to show results?",
    a: "Most clients see measurable ranking improvements within 30–60 days of campaign launch. Significant traffic growth typically appears in months 3–6, with compounding results from month 6 onward. We set realistic milestones in your strategy document before we start.",
  },
  {
    q: "Are your backlinks permanent?",
    a: "Yes. All guest post placements are permanent editorial links on real, actively maintained websites. We provide a replacement guarantee: if any link is removed within 12 months, we replace it free of charge.",
  },
  {
    q: "Do you work with any niche?",
    a: "We serve clients across 30+ industries. Some regulated sectors (adult, gambling, firearms) require additional vetting but we do have inventory available. Contact us to confirm availability for your specific niche.",
  },
  {
    q: "Will I get penalised by Google?",
    a: "We build exclusively white-hat links on genuine editorial websites with real traffic. Every placement is manually vetted against our 14-point quality checklist. We have been operating since 2016 with zero client penalties.",
  },
  {
    q: "Do you offer white-label services for agencies?",
    a: "Absolutely. Over 30% of our clients are digital agencies white-labelling our link building and SEO delivery. We provide white-label reports, direct client reporting access, and volume pricing. Contact us for agency onboarding.",
  },
  {
    q: "Is there a minimum contract?",
    a: "No minimum commitment on any plan. You can cancel, pause, or scale your campaign at the end of any billing month. We believe in earning your business every month through results, not lock-in contracts.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-navy-800">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <ScrollReveal>
            <SectionLabel>Common questions</SectionLabel>
            <SectionHeading className="mb-4">
              Frequently asked <span className="text-gradient">questions</span>
            </SectionHeading>
            <SectionSub>
              Can not find your question?{" "}
              <Link to="/contact" className="text-sky-400 hover:underline">
                Ask us directly
              </Link>{" "}
              — we respond within 2 hours.
            </SectionSub>
          </ScrollReveal>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <ScrollReveal key={faq.q} delay={i * 50}>
              <div
                className={cn(
                  "rounded-2xl border transition-all duration-300",
                  open === i
                    ? "border-sky-500/30 bg-navy-700/60"
                    : "border-navy-600/60 bg-navy-700/30 hover:border-navy-500/60",
                )}
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span
                    className={cn(
                      "font-medium text-sm sm:text-base transition-colors",
                      open === i ? "text-sky-300" : "text-slate-200",
                    )}
                  >
                    {faq.q}
                  </span>
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300",
                      open === i
                        ? "border-sky-500/40 bg-sky-500/10 rotate-45"
                        : "border-navy-500",
                    )}
                  >
                    <span
                      className={cn(
                        "text-lg leading-none transition-colors",
                        open === i ? "text-sky-400" : "text-slate-400",
                      )}
                    >
                      +
                    </span>
                  </div>
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    open === i ? "max-h-48" : "max-h-0",
                  )}
                >
                  <p className="px-6 pb-5 text-slate-400 text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Affiliate / Partner Strip ─────────────────────────────────────────────

function AffiliateStrip() {
  return (
    <section className="border-y border-gray-200 bg-white py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left max-w-xl">
              <div className="flex items-center gap-2 justify-center lg:justify-start mb-3">
                <HeartHandshake size={18} className="text-sky-400" />
                <span className="text-sky-400 font-semibold text-sm">
                  Affiliate & Reseller Program
                </span>
              </div>
              <h3 className="font-sora font-bold text-2xl sm:text-3xl text-slate-50 mb-3">
                Earn 30% recurring commission — forever
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Refer a client and earn 30% on every invoice they pay, every
                single month, for the lifetime of their account. Our top
                affiliates earn $3,000–$15,000/month passively. No cap, no
                expiry, paid monthly via bank transfer or PayPal.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 shrink-0">
              {[
                { val: "30%", label: "Commission rate" },
                { val: "Forever", label: "Recurring payouts" },
                { val: "$0", label: "Cost to join" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center p-4 rounded-2xl border border-navy-600/60 bg-navy-700/40 min-w-[90px]"
                >
                  <div className="font-sora font-bold text-2xl text-sky-400 mb-1">
                    {item.val}
                  </div>
                  <div className="text-slate-400 text-xs">{item.label}</div>
                </div>
              ))}
            </div>
            <Link
              to="/contact"
              className="shrink-0 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-white text-base transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              }}
            >
              Join for free <ArrowRight size={15} />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-700 opacity-90" />
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: "28px 28px",
              }}
            />
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-indigo-400/20 blur-2xl" />

            <div className="relative px-8 sm:px-14 py-14 sm:py-20 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-white/80 text-xs font-semibold mb-6">
                <MessageSquare size={12} />
                Free · No obligation · 30-minute call
              </div>
              <h2 className="font-sora font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-5 leading-tight">
                Ready to see real organic growth?
              </h2>
              <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto mb-4">
                Book a free 30-minute strategy call. Our specialists will audit
                your site and deliver a custom growth plan — completely free, no
                obligation.
              </p>
              <p className="text-white/50 text-sm max-w-md mx-auto mb-10">
                We have availability for 12 new clients this month. Spots fill
                fast — get in touch now to secure your free audit before the
                queue closes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-bold text-base hover:bg-white/90 hover:-translate-y-0.5 transition-all duration-200 shadow-xl"
                >
                  Book Free Strategy Call <ArrowRight size={16} />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/30 text-white font-semibold text-base hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <PageSEO
        title="Rank Higher. Build Faster. Grow Smarter."
        description="Premium SEO, link building, web development and digital marketing services trusted by 500+ businesses across 30+ countries. White-hat only. No contracts. Free strategy call."
        canonical="/"
        keywords="SEO services, link building, guest posts, backlinks, web development, digital marketing agency, PouchCare"
      />
      <Hero />
      <StatsBar />
      <ServicesPreview />
      <ProblemSolution />
      <Process />
      <WhyUs />
      <Industries />
      <CaseStudies />
      <Testimonials />
      <PricingSnapshot />
      <BlogPreview />
      <FAQ />
      <AffiliateStrip />
      <CTABanner />
    </>
  );
}

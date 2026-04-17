/**
 * Marketing page: Web URL → Android APK service.
 * Route: /services/web-to-apk
 * @see docs/TASKS_WEB_TO_APK.md
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { PageSEO } from "@/components/seo/PageSEO";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  SectionLabel,
  SectionHeading,
  SectionSub,
} from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  WEB_TO_APK_PLANS,
  WEB_TO_APK_FEATURES,
  WEB_TO_APK_FAQ,
  type ApkPlan,
} from "@/data/mockWebToApk";
import { formatUsd } from "@/lib/format";
import { paths } from "@/routes/paths";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

// ── Plan card ──────────────────────────────────────────────────────────────
function ApkPlanCard({ plan }: { plan: ApkPlan; index?: number }) {
  const popular = !!plan.popular;
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border p-6",
        popular
          ? "border-primary-300 bg-gradient-to-b from-primary-50/80 to-white shadow-md ring-2 ring-primary-200/50"
          : "border-gray-200 bg-white",
      )}
    >
      {popular && (
        <span className="mb-2 inline-flex w-fit rounded-full bg-primary-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Popular
        </span>
      )}
      <div className="flex items-center gap-2">
        <Smartphone className="h-5 w-5 text-primary-600" aria-hidden />
        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{plan.blurb}</p>
      <p className="mt-4 text-3xl font-bold tabular-nums text-gray-900">
        {plan.monthlyUsd === 0 ? "Free" : formatUsd(plan.monthlyUsd)}
        {plan.monthlyUsd > 0 && (
          <span className="text-base font-normal text-gray-500"> /mo</span>
        )}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        {plan.maxConversions === null
          ? "Unlimited APKs"
          : `${plan.maxConversions} APK${plan.maxConversions > 1 ? "s" : ""}/month`}
      </p>
      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      <Link
        to={paths.dashboardWebToApk}
        className={cn(
          "mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors touch-manipulation",
          popular
            ? "bg-primary-600 text-white hover:bg-primary-700"
            : "border border-gray-300 bg-white text-gray-800 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700",
        )}
      >
        {plan.monthlyUsd === 0 ? "Try for free" : `Get ${plan.name}`}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  );
}

// ── FAQ item ───────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-gray-900 hover:text-primary-700"
        aria-expanded={open}
      >
        <span>{q}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        )}
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-gray-600">{a}</p>
      )}
    </div>
  );
}

// ── Demo form ──────────────────────────────────────────────────────────────
function DemoForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Enter a URL first");
      return;
    }
    setLoading(true);
    setDone(false);
    toast.loading("Generating APK…", { id: "apk-demo" });
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      toast.success("Mock APK ready! (demo — sign in to download)", { id: "apk-demo" });
    }, 2200);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label htmlFor="demo-url" className="mb-1.5 block text-sm font-semibold text-white/90">
          Website URL
        </label>
        <Input
          id="demo-url"
          type="url"
          placeholder="https://yourbusiness.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="min-h-[52px] border-white/30 bg-white/10 text-base text-white placeholder:text-white/40 focus:border-white/60 focus:bg-white/15"
          disabled={loading}
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="min-h-[52px] shrink-0 w-full border-2 border-white/30 bg-white text-primary-700 font-bold shadow-lg hover:bg-primary-50 sm:w-auto sm:px-8"
        icon={
          loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : done ? (
            <Download className="h-5 w-5 text-emerald-500" />
          ) : (
            <Smartphone className="h-5 w-5" />
          )
        }
      >
        {loading ? "Generating…" : done ? "Ready — sign in to download" : "Generate APK"}
      </Button>
    </form>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function ServicesWebToApkPage() {
  return (
    <>
      <PageSEO
        title="Web to Android APK — PouchCare"
        description="Turn any website or PWA into a native Android APK in seconds. Custom icon, branding, offline support, and Play Store–ready builds."
        canonical="/services/web-to-apk"
      />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-violet-900 pb-16 pt-[68px] sm:pb-20 md:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-400/20 via-transparent to-transparent" />
        <div className="container-max relative z-10 px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mx-auto max-w-3xl pt-10 text-center sm:pt-16">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 shrink-0" />
                No coding required
              </div>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                Any website.
                <br />
                <span className="bg-gradient-to-r from-primary-300 to-violet-300 bg-clip-text text-transparent">
                  Instant Android app.
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                Paste your URL, pick a plan, and receive a downloadable APK in under 60 seconds.
                Custom branding, offline cache, push notifications — all without writing a line of code.
              </p>
            </div>

            {/* Demo form */}
            <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:p-6 sm:mt-12">
              <p className="mb-4 text-sm font-semibold text-white/80">
                Try it free — no sign-in needed
              </p>
              <DemoForm />
            </div>

            {/* Social proof */}
            <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-6 text-white/60 sm:gap-8">
              {[
                { label: "APKs generated", value: "12,000+" },
                { label: "Avg. build time", value: "< 60 s" },
                { label: "Android coverage", value: "98%" },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-extrabold tabular-nums text-white">{value}</p>
                  <p className="mt-0.5 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="section-pad border-b border-gray-100 bg-white">
        <div className="container-max">
          <ScrollReveal>
            <div className="mb-10 text-center">
              <SectionLabel>What you get</SectionLabel>
              <SectionHeading className="mb-3 text-xl sm:text-2xl">
                Everything your app needs
              </SectionHeading>
              <SectionSub className="mx-auto max-w-xl">
                From a single URL to a fully packaged Android application — no SDK,
                no build tools, no developer account required for basic sideloading.
              </SectionSub>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WEB_TO_APK_FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 50}>
                <div className="flex h-full gap-4 rounded-2xl border border-gray-200 bg-gray-50/50 p-5 sm:p-6">
                  <span className="mt-0.5 text-2xl" aria-hidden>
                    {f.icon}
                  </span>
                  <div>
                    <h3 className="font-sora text-base font-semibold text-gray-900">
                      {f.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                      {f.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="section-pad border-b border-gray-100 bg-gray-50/80">
        <div className="container-max">
          <ScrollReveal>
            <div className="mb-10 text-center">
              <SectionLabel>Process</SectionLabel>
              <SectionHeading className="mb-3 text-xl sm:text-2xl">
                Three steps to your APK
              </SectionHeading>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "Paste your URL",
                body: "Enter the full URL of your website or PWA. We verify it loads correctly.",
              },
              {
                n: "02",
                title: "Customise & pick a plan",
                body: "Set the app name, icon, theme colour, and splash screen. Choose Free, Starter, or Pro.",
              },
              {
                n: "03",
                title: "Download & distribute",
                body: "Receive your signed APK by email or in the portal dashboard. Sideload or submit to Play Store.",
              },
            ].map((s, i) => (
              <ScrollReveal key={s.n} delay={i * 80}>
                <div className="flex flex-col items-start gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <span className="text-4xl font-extrabold tabular-nums text-primary-100 select-none">
                    {s.n}
                  </span>
                  <h3 className="font-sora text-lg font-bold text-gray-900">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{s.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans ───────────────────────────────────────────────────────── */}
      <section className="section-pad border-b border-gray-100 bg-white">
        <div className="container-max">
          <ScrollReveal>
            <div className="mb-10 text-center">
              <SectionLabel>Plans</SectionLabel>
              <SectionHeading className="mb-3 text-xl sm:text-2xl">
                Choose your plan
              </SectionHeading>
              <SectionSub className="mx-auto max-w-lg">
                Start free, upgrade when you need more conversions, advanced branding,
                or Play Store–ready signing.
              </SectionSub>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {WEB_TO_APK_PLANS.map((plan, i) => (
              <ScrollReveal key={plan.id} delay={i * 60}>
                <ApkPlanCard plan={plan} index={i} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="section-pad border-b border-gray-100 bg-gray-50/80">
        <div className="container-max">
          <ScrollReveal>
            <div className="mb-10 text-center">
              <SectionLabel>FAQ</SectionLabel>
              <SectionHeading className="mb-3 text-xl sm:text-2xl">
                Common questions
              </SectionHeading>
            </div>
          </ScrollReveal>
          <div className="mx-auto max-w-2xl divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm sm:p-4">
            {WEB_TO_APK_FAQ.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="section-pad">
        <div className="container-max">
          <ScrollReveal>
            <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-violet-600 p-8 text-center sm:p-12">
              <h2 className="font-sora text-2xl font-bold text-white sm:text-3xl">
                Ready to launch your Android app?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
                Sign in to the client portal to start converting — or try the free tier right now.
              </p>
              <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Link
                  to={paths.dashboardWebToApk}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-white px-8 text-sm font-bold text-primary-700 shadow-lg transition-all hover:bg-primary-50 hover:-translate-y-0.5 touch-manipulation"
                >
                  Open dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-xl border-2 border-white/30 px-8 text-sm font-semibold text-white transition-all hover:border-white/60 hover:bg-white/10 touch-manipulation"
                >
                  Compare all plans
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

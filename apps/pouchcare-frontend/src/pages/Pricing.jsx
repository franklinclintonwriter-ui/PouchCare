import { useState } from "react";
import {
  Check,
  X,
  ChevronDown,
  Sparkles,
  Shield,
  ArrowRight,
  Users,
  Star,
} from "lucide-react";
import { plans, faqs } from "../data/pricing";

/* ── Avatar colours for trust bar ── */
const avatarColors = ["#0A7AFF", "#00C6FF", "#FFB800", "#FF8C00", "#6366F1"];

/* ── Comparison Features ── */
const comparisonFeatures = [
  { name: "Templates", starter: "5", pro: "50+", agency: "Unlimited" },
  { name: "Websites", starter: "1", pro: "10", agency: "Unlimited" },
  { name: "Builder Access", starter: "Basic", pro: "Advanced", agency: "Full Suite" },
  { name: "Design System", starter: false, pro: true, agency: true },
  { name: "Premium Templates", starter: false, pro: true, agency: true },
  { name: "Priority Support", starter: false, pro: true, agency: true },
  { name: "White Label", starter: false, pro: false, agency: true },
  { name: "Custom Branding", starter: false, pro: false, agency: true },
  { name: "Team Members", starter: "1", pro: "5", agency: "Unlimited" },
  { name: "API Access", starter: false, pro: true, agency: true },
  { name: "Analytics", starter: "Basic", pro: "Advanced", agency: "Advanced" },
  { name: "Export Options", starter: "HTML", pro: "HTML, CSS, JSON", agency: "All Formats" },
  { name: "Version History", starter: "7 days", pro: "30 days", agency: "Unlimited" },
  { name: "Dedicated Account Manager", starter: false, pro: false, agency: true },
  { name: "SLA Guarantee", starter: false, pro: false, agency: true },
];

/* ── FAQ Item Sub-component ── */
function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between border-0 bg-transparent py-5 text-left"
      >
        <span className="font-heading text-base font-semibold text-heading">{faq.q}</span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-muted transition-transform duration-300 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-[max-height] duration-300 ${
          isOpen ? "max-h-[200px]" : "max-h-0"
        }`}
      >
        <p className="pb-5 text-[15px] leading-[1.7] text-body">{faq.a}</p>
      </div>
    </div>
  );
}

/* ── Pricing Card Sub-component ── */
function PricingCard({ plan, isAnnual }) {
  const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
  const period = isAnnual ? "/year" : "/mo";

  return (
    <div
      className={[
        "relative flex flex-col rounded-card bg-white p-8 shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-card-hover",
        plan.featured ? "border-2 border-primary" : "border border-gray-200",
      ].join(" ")}
    >
      {plan.badge && (
        <div className="absolute left-1/2 top-[-14px] -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-br from-primary to-accent-cyan px-4 py-1 text-[13px] font-semibold text-white">
          {plan.badge}
        </div>
      )}

      <h3 className="mb-1 font-heading text-[22px] font-bold text-heading">{plan.name}</h3>
      <p className="mb-6 text-sm text-body">{plan.description}</p>

      <div className="mb-6">
        <span className="font-heading text-5xl font-extrabold leading-none text-heading">
          {price === 0 ? "Free" : `$${price}`}
        </span>
        {price !== 0 && <span className="text-base text-muted">{period}</span>}
      </div>

      <ul className="mb-8 list-none p-0">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2.5 py-2">
            {feature.included ? (
              <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" />
            ) : (
              <X className="h-4 w-4 flex-shrink-0 text-muted" />
            )}
            <span className={feature.included ? "text-sm text-heading" : "text-sm text-muted"}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <button
        className={[
          "mt-auto flex w-full items-center justify-center gap-2 rounded-btn px-6 py-3.5 text-[15px] font-semibold transition-colors duration-200",
          plan.featured
            ? "bg-primary text-white hover:bg-primary-dark"
            : "border border-primary bg-white text-primary hover:bg-primary-light",
        ].join(" ")}
      >
        {plan.cta}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ── Main Pricing Page ── */
export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="font-body">
      {/* ─── A. Header ─── */}
      <section className="bg-surface-light px-6 py-16 text-center">
        <h1 className="mb-4 font-heading text-[clamp(32px,5vw,48px)] font-extrabold text-heading">
          Simple, Transparent Pricing
        </h1>
        <p className="mx-auto mb-8 max-w-[600px] text-lg leading-[1.6] text-body">
          Choose the perfect plan for your needs. No hidden fees, no surprises.
          Start free and scale as you grow.
        </p>

        {/* Trust line */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center">
            {avatarColors.map((color, i) => (
              <div
                key={i}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white ${
                  i === 0 ? "ml-0" : "-ml-[10px]"
                }`}
                style={{ backgroundColor: color }}
              >
                <Users className="h-4 w-4 text-white" />
              </div>
            ))}
          </div>
          <span className="text-sm font-medium text-body">Trusted by 10,000+ agencies</span>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-accent-gold text-accent-gold" />
            ))}
            <span className="ml-1 text-sm font-medium text-body">4.9/5 from 2,000+ reviews</span>
          </div>
        </div>
      </section>

      {/* ─── B. Billing Toggle ─── */}
      <section className="px-6 pb-0 pt-12 text-center">
        <div className="inline-flex items-center gap-3 rounded-full bg-surface-light p-1">
          <button
            onClick={() => setIsAnnual(false)}
            className={[
              "rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200",
              !isAnnual ? "bg-primary text-white" : "bg-transparent text-body",
            ].join(" ")}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={[
              "rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200",
              isAnnual ? "bg-primary text-white" : "bg-transparent text-body",
            ].join(" ")}
          >
            Annual
          </button>
          <span className="rounded-[20px] bg-gradient-to-br from-accent-gold to-accent-orange px-2.5 py-1 text-xs font-bold text-white">
            Save 20%
          </span>
        </div>
      </section>

      {/* ─── C. Pricing Cards ─── */}
      <section className="mx-auto max-w-[1100px] px-6 py-12">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-stretch gap-6">
          {plans.map((plan, i) => (
            <PricingCard key={i} plan={plan} isAnnual={isAnnual} />
          ))}
        </div>
      </section>

      {/* ─── D. Feature Comparison Table ─── */}
      <section className="mx-auto max-w-[1100px] px-6 py-12">
        <h2 className="mb-10 text-center font-heading text-[28px] font-bold text-heading">
          Feature Comparison
        </h2>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-card bg-white shadow-card md:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-surface-light">
                <th className="px-5 py-4 text-left font-bold text-heading">Feature</th>
                <th className="px-5 py-4 text-center font-bold text-heading">Starter</th>
                <th className="px-5 py-4 text-center font-bold text-primary">Pro</th>
                <th className="px-5 py-4 text-center font-bold text-heading">Agency</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((feat, i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? "border-b border-gray-200 bg-white" : "border-b border-gray-200 bg-surface-light"}
                >
                  <td className="px-5 py-3.5 font-medium text-heading">{feat.name}</td>
                  {["starter", "pro", "agency"].map((tier) => (
                    <td
                      key={tier}
                      className={[
                        "px-5 py-3.5 text-center",
                        feat[tier] === true
                          ? "text-emerald-500"
                          : feat[tier] === false
                            ? "text-muted"
                            : "text-heading",
                      ].join(" ")}
                    >
                      {feat[tier] === true ? (
                        <Check className="inline-block h-4 w-4 text-emerald-500" />
                      ) : feat[tier] === false ? (
                        <X className="inline-block h-4 w-4 text-muted" />
                      ) : (
                        feat[tier]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col gap-4 md:hidden">
          {comparisonFeatures.map((feat, i) => (
            <div key={i} className="rounded-[12px] bg-white p-4 shadow-card">
              <h4 className="mb-3 text-[15px] font-semibold text-heading">{feat.name}</h4>
              <div className="grid grid-cols-3 gap-2 text-center text-[13px]">
                {["starter", "pro", "agency"].map((tier) => (
                  <div key={tier}>
                    <div className="mb-1 text-[11px] font-semibold uppercase text-muted">{tier}</div>
                    <div className={feat[tier] === false ? "text-muted" : "text-heading"}>
                      {feat[tier] === true ? (
                        <Check className="inline-block h-4 w-4 text-emerald-500" />
                      ) : feat[tier] === false ? (
                        <X className="inline-block h-4 w-4 text-muted" />
                      ) : (
                        feat[tier]
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── E. FAQ Accordion ─── */}
      <section className="mx-auto max-w-[720px] px-6 py-12">
        <h2 className="mb-10 text-center font-heading text-[28px] font-bold text-heading">
          Frequently Asked Questions
        </h2>
        <div>
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              faq={faq}
              isOpen={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </div>
      </section>

      {/* ─── F. Money-Back Guarantee ─── */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-[720px] rounded-card bg-surface-light px-8 py-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Shield className="h-7 w-7 text-emerald-500" />
          </div>
          <h3 className="mb-3 font-heading text-2xl font-bold text-heading">
            30-Day Money-Back Guarantee
          </h3>
          <p className="mx-auto max-w-[520px] text-[15px] leading-[1.7] text-body">
            Try any paid plan risk-free for 30 days. If you are not completely
            satisfied, contact us for a full refund. No questions asked, no
            hassle.
          </p>
        </div>
      </section>

      {/* ─── G. Enterprise Section ─── */}
      <section className="mx-auto max-w-[1100px] px-6 py-16">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-center gap-12">
          {/* Left */}
          <div>
            <h2 className="mb-4 font-heading text-[32px] font-extrabold text-heading">
              Need a Custom Solution?
            </h2>
            <p className="mb-6 text-base leading-[1.7] text-body">
              We work with enterprise teams to create tailored solutions that
              fit your exact workflow, security, and scaling needs.
            </p>
            <ul className="mb-8 flex list-none flex-col gap-3 p-0">
              {[
                "Custom integrations & API access",
                "Dedicated account manager",
                "Custom SLA & uptime guarantee",
                "On-premise deployment options",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[15px] text-heading">
                  <Check className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 rounded-btn bg-primary px-7 py-3.5 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-primary-dark">
                Contact Sales
                <ArrowRight className="h-4 w-4" />
              </button>
              <button className="rounded-btn border border-primary bg-white px-7 py-3.5 text-[15px] font-semibold text-primary transition-colors duration-200 hover:bg-primary-light">
                Schedule a Demo
              </button>
            </div>
          </div>

          {/* Right — placeholder illustration */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <Users className="h-8 w-8" />, colorClass: "text-primary" },
              { icon: <Shield className="h-8 w-8" />, colorClass: "text-accent-cyan" },
              { icon: <Star className="h-8 w-8" />, colorClass: "text-accent-gold" },
              { icon: <Sparkles className="h-8 w-8" />, colorClass: "text-accent-orange" },
              { icon: <Check className="h-8 w-8" />, colorClass: "text-emerald-500" },
              { icon: <ArrowRight className="h-8 w-8" />, colorClass: "text-indigo-500" },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded-card bg-surface-light p-8 ${item.colorClass}`}
              >
                {item.icon}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── H. CTA Banner ─── */}
      <section className="bg-primary px-6 py-16 text-center">
        <Sparkles className="mx-auto mb-4 h-10 w-10 text-accent-gold" />
        <h2 className="mb-4 font-heading text-[clamp(28px,4vw,40px)] font-extrabold text-white">
          Start Building Today
        </h2>
        <p className="mx-auto mb-8 max-w-[500px] text-base leading-[1.6] text-white/85">
          Join thousands of agencies building beautiful WordPress sites with
          PouchCare. Get started in minutes.
        </p>
        <button className="inline-flex items-center gap-2 rounded-btn bg-white px-8 py-3.5 text-base font-bold text-primary transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
          Get Started Free
          <ArrowRight className="h-5 w-5" />
        </button>
      </section>
    </div>
  );
}

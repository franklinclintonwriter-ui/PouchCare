import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Handshake,
  Layers3,
  Megaphone,
} from "lucide-react";

const benefits = [
  {
    title: "Recurring revenue opportunities",
    description:
      "Create new service and referral revenue around templates, setup, and long-term site care.",
    icon: Megaphone,
  },
  {
    title: "Shared go-to-market support",
    description:
      "Access launch materials, onboarding guidance, and partner-ready messaging for client conversations.",
    icon: Handshake,
  },
  {
    title: "Priority enablement",
    description:
      "Get faster product feedback loops, technical guidance, and clearer upgrade paths for your team.",
    icon: BadgeCheck,
  },
  {
    title: "Scalable delivery workflows",
    description:
      "Standardize how your organization deploys templates, licenses, and reusable WordPress assets.",
    icon: Layers3,
  },
];

const tiers = [
  {
    name: "Referral",
    description:
      "Best for consultants and creators who want to introduce clients to PouchCare.",
    highlights: ["Referral rewards", "Sales enablement kit", "Partner directory listing"],
  },
  {
    name: "Agency",
    description:
      "For implementation teams building and managing multiple client websites each month.",
    highlights: ["Agency onboarding", "Priority support", "Template workflow consultation"],
  },
  {
    name: "Enterprise",
    description:
      "Designed for larger organizations standardizing WordPress operations across multiple teams.",
    highlights: ["Custom rollout planning", "Shared success reviews", "Advanced commercial terms"],
  },
];

export default function PartnersPage() {
  return (
    <div className="bg-white">
      <section className="bg-surface-light">
        <div className="max-w-container mx-auto px-6 py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl animate-fadeUp">
            <span className="inline-flex rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              PouchCare Partners
            </span>
            <h1 className="mt-6 font-heading text-4xl font-bold text-heading sm:text-5xl">
              Grow with a WordPress platform built for modern delivery teams.
            </h1>
            <p className="mt-6 text-lg leading-8 text-body">
              Our partner program helps agencies, consultants, and enterprise
              teams turn better WordPress operations into measurable business
              growth.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-container mx-auto px-6 py-16 sm:py-20">
        <h2 className="font-heading text-3xl font-bold text-heading">
          Why partner with us
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-card border border-slate-200 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-heading text-xl font-semibold text-heading">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-body">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-surface-light">
        <div className="max-w-container mx-auto px-6 py-16 sm:py-20">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <h2 className="font-heading text-3xl font-bold text-heading">
              Partnership tiers
            </h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {tiers.map((tier) => (
              <article
                key={tier.name}
                className="rounded-card bg-white p-6 shadow-card transition-all duration-300 hover:shadow-card-hover"
              >
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {tier.name}
                </span>
                <p className="mt-4 font-heading text-2xl font-semibold text-heading">
                  {tier.name} tier
                </p>
                <p className="mt-3 text-sm leading-7 text-body">
                  {tier.description}
                </p>
                <ul className="mt-6 space-y-3 text-sm text-body">
                  {tier.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-3">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-container mx-auto px-6 py-16 sm:py-20">
        <div className="rounded-card bg-primary px-8 py-10 text-white shadow-card lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl font-bold">
              Ready to apply?
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">
              Tell us about your team, your clients, and the WordPress
              workflows you want to improve. We will help match you to the
              right partnership path.
            </p>
          </div>
          <div className="mt-6 lg:mt-0">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-btn bg-white px-5 py-3 text-sm font-semibold text-primary transition-transform duration-200 hover:-translate-y-0.5"
            >
              Start your application
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

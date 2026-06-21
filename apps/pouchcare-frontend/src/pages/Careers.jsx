import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Heart,
  Laptop2,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";

const benefits = [
  {
    title: "Meaningful product work",
    description:
      "Help shape a toolkit used by agencies and WordPress teams shipping real client work.",
    icon: Sparkles,
  },
  {
    title: "Flexible collaboration",
    description:
      "We support remote-first workflows with async communication and focused maker time.",
    icon: Laptop2,
  },
  {
    title: "Small team impact",
    description:
      "Your ideas move quickly from concept to shipped experience without heavy process overhead.",
    icon: Users,
  },
  {
    title: "Healthy pace",
    description:
      "We care about sustainable shipping, thoughtful product decisions, and long-term growth.",
    icon: Heart,
  },
];

const positions = [
  {
    title: "Senior Frontend Developer",
    location: "Remote",
    type: "Full-time",
    summary:
      "Lead polished React experiences across the PouchCare marketing site, customer portal, and builder workflows.",
  },
  {
    title: "WordPress Plugin Developer",
    location: "Hybrid",
    type: "Full-time",
    summary:
      "Build and maintain plugin integrations that connect templates, licenses, and deployment flows inside WordPress.",
  },
  {
    title: "Customer Success Manager",
    location: "Remote",
    type: "Full-time",
    summary:
      "Guide agencies through onboarding, adoption, and expansion with proactive product education and support.",
  },
];

export default function Careers() {
  return (
    <div className="bg-white">
      <section className="bg-surface-light">
        <div className="max-w-container mx-auto px-6 py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl animate-fadeUp">
            <span className="inline-flex rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              Careers at PouchCare
            </span>
            <h1 className="mt-6 font-heading text-4xl font-bold text-heading sm:text-5xl">
              Join the team building better WordPress workflows.
            </h1>
            <p className="mt-6 text-lg leading-8 text-body">
              We are creating tools that help teams launch, manage, and scale
              WordPress websites with less friction. If you care about clean
              product experiences and real customer impact, we would love to
              meet you.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-container mx-auto px-6 py-16 sm:py-20">
        <h2 className="font-heading text-3xl font-bold text-heading">
          Why join us
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-3xl font-bold text-heading">
                Open positions
              </h2>
              <p className="mt-3 max-w-2xl text-body">
                A few roles we are actively hiring for as we expand the
                PouchCare platform.
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-5">
            {positions.map((position) => (
              <article
                key={position.title}
                className="rounded-card bg-white p-6 shadow-card transition-all duration-300 hover:shadow-card-hover"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <h3 className="font-heading text-2xl font-semibold text-heading">
                        {position.title}
                      </h3>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-body">
                      {position.summary}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-heading">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {position.location}
                      </span>
                      <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 rounded-btn bg-primary px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    Apply now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-container mx-auto px-6 py-16 sm:py-20">
        <div className="rounded-card border border-dashed border-primary/30 bg-primary/5 px-8 py-10 text-center">
          <h2 className="font-heading text-3xl font-bold text-heading">
            No open role that matches?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-body">
            We are always interested in meeting thoughtful builders who care
            about WordPress, product quality, and customer outcomes.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-btn bg-primary px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
          >
            Introduce yourself
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

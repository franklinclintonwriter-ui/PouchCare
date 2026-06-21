import { Link } from "react-router-dom";
import {
  ArrowRight,
  HeartHandshake,
  Lightbulb,
  ShieldCheck,
  Users,
} from "lucide-react";

const values = [
  {
    title: "Innovation",
    description:
      "We build practical WordPress tooling that helps teams ship faster without sacrificing quality.",
    icon: Lightbulb,
  },
  {
    title: "Trust",
    description:
      "From licensing to site delivery, every workflow is designed to be dependable and transparent.",
    icon: ShieldCheck,
  },
  {
    title: "Simplicity",
    description:
      "We remove setup friction so agencies and product teams can focus on launching better websites.",
    icon: HeartHandshake,
  },
  {
    title: "Community",
    description:
      "PouchCare grows alongside the builders, plugin developers, and agencies using WordPress every day.",
    icon: Users,
  },
];

export default function About() {
  return (
    <div className="bg-white">
      <section className="bg-surface-light">
        <div className="max-w-container mx-auto px-6 py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl animate-fadeUp">
            <span className="inline-flex rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              About PouchCare
            </span>
            <h1 className="mt-6 font-heading text-4xl font-bold text-heading sm:text-5xl">
              Building the modern toolkit for WordPress teams.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-body">
              PouchCare helps agencies, freelancers, and product teams manage
              templates, streamline launches, and deliver polished WordPress
              experiences with less operational overhead.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-container mx-auto px-6 py-16 sm:py-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-bold text-heading">
              What guides our work
            </h2>
            <p className="mt-3 max-w-2xl text-body">
              We design products that make WordPress delivery faster, clearer,
              and more scalable for growing teams.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {values.map(({ title, description, icon: Icon }) => (
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
        <div className="max-w-container mx-auto grid gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="animate-fadeIn">
            <h2 className="font-heading text-3xl font-bold text-heading">
              Our story
            </h2>
            <div className="mt-6 space-y-5 text-body">
              <p className="leading-8">
                PouchCare started with a familiar problem: WordPress projects
                were shipping with too many disconnected tools, handoffs, and
                manual setup steps. Teams needed a better way to package
                templates, manage licenses, and keep client sites moving.
              </p>
              <p className="leading-8">
                We built PouchCare to bring those workflows together in one
                reliable system. Today, our platform helps teams organize
                reusable assets, maintain consistent site quality, and support
                customers after launch.
              </p>
              <p className="leading-8">
                Our mission is simple: give WordPress professionals a toolkit
                that feels powerful behind the scenes and effortless in daily
                use.
              </p>
            </div>
          </div>

          <div className="rounded-card bg-white p-8 shadow-card">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Built for growth
            </span>
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted">Focus</dt>
                <dd className="mt-2 font-heading text-3xl font-bold text-heading">
                  WordPress ops
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Customers</dt>
                <dd className="mt-2 font-heading text-3xl font-bold text-heading">
                  Agencies & SaaS
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Core promise</dt>
                <dd className="mt-2 text-body">
                  Faster launches with cleaner handoffs.
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Approach</dt>
                <dd className="mt-2 text-body">
                  Product-led workflows backed by real support.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="max-w-container mx-auto px-6 py-16 sm:py-20">
        <div className="rounded-card bg-primary px-8 py-10 text-white shadow-card sm:px-10 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl font-bold">
              Want to help shape the future of WordPress tooling?
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">
              Join the team building the platform behind smarter templates,
              better delivery workflows, and happier site owners.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 lg:mt-0">
            <Link
              to="/careers"
              className="inline-flex items-center gap-2 rounded-btn bg-white px-5 py-3 text-sm font-semibold text-primary transition-transform duration-200 hover:-translate-y-0.5"
            >
              View open roles
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center rounded-btn border border-white/30 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
            >
              Meet the team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

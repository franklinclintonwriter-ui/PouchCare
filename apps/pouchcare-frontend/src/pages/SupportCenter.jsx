import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  LifeBuoy,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

const categories = [
  {
    title: "Getting Started",
    description: "Setup basics, onboarding checklists, and first-site guidance.",
    icon: Sparkles,
  },
  {
    title: "Templates",
    description: "Managing template packs, importing assets, and updating libraries.",
    icon: BookOpen,
  },
  {
    title: "Builder",
    description: "Using the builder, content structures, and reusable layouts.",
    icon: Settings2,
  },
  {
    title: "Account",
    description: "Profile settings, team invitations, and access management.",
    icon: ShieldCheck,
  },
  {
    title: "Billing",
    description: "Invoices, subscriptions, renewals, and plan changes.",
    icon: CreditCard,
  },
  {
    title: "Technical",
    description: "Troubleshooting sync issues, API access, and plugin diagnostics.",
    icon: Wrench,
  },
];

const popularArticles = [
  "How to launch your first PouchCare template site",
  "Connecting a WordPress installation to your PouchCare account",
  "Managing licenses across multiple client websites",
  "Updating builder content without breaking saved sections",
  "Troubleshooting plugin sync and deployment issues",
];

export default function SupportCenter() {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) {
      return categories;
    }

    return categories.filter(
      (category) =>
        category.title.toLowerCase().includes(normalizedQuery) ||
        category.description.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const filteredArticles = useMemo(() => {
    if (!normalizedQuery) {
      return popularArticles;
    }

    return popularArticles.filter((article) =>
      article.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  return (
    <div className="bg-surface-light">
      <section className="max-w-container mx-auto px-6 py-16 sm:py-20 lg:py-24">
        <div className="max-w-3xl animate-fadeUp">
          <span className="inline-flex rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            Support Center
          </span>
          <h1 className="mt-6 font-heading text-4xl font-bold text-heading sm:text-5xl">
            Find answers for every stage of your PouchCare workflow.
          </h1>
          <p className="mt-6 text-lg leading-8 text-body">
            Search setup help, billing guidance, and technical troubleshooting
            resources for the PouchCare platform.
          </p>
        </div>

        <div className="mt-10 rounded-card bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 shrink-0 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search help articles, categories, or keywords"
              className="w-full bg-transparent text-sm text-heading outline-none placeholder:text-muted"
            />
          </div>
        </div>
      </section>

      <section className="max-w-container mx-auto px-6 pb-16 sm:pb-20">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-3xl font-bold text-heading">
            FAQ categories
          </h2>
          {normalizedQuery && (
            <span className="text-sm text-muted">
              {filteredCategories.length} categories found
            </span>
          )}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCategories.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-card bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
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

        {filteredCategories.length === 0 && (
          <div className="mt-10 rounded-card bg-white px-6 py-8 text-center shadow-card">
            <p className="text-body">
              No categories matched your search. Try a different term or browse
              our popular resources below.
            </p>
          </div>
        )}
      </section>

      <section className="bg-white">
        <div className="max-w-container mx-auto grid gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="font-heading text-3xl font-bold text-heading">
              Popular articles
            </h2>
            <div className="mt-8 space-y-4">
              {filteredArticles.map((article) => (
                <div
                  key={article}
                  className="rounded-card border border-slate-200 px-5 py-4 transition-colors duration-200 hover:border-primary/30"
                >
                  <p className="font-medium text-heading">{article}</p>
                  <p className="mt-2 text-sm text-body">
                    Step-by-step guidance for common workflows across templates,
                    licensing, and account setup.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-card bg-primary p-8 text-white shadow-card">
            <LifeBuoy className="h-10 w-10 text-white/80" />
            <h2 className="mt-6 font-heading text-3xl font-bold">
              Still need help?
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">
              Reach out to our team for account-specific help, technical issues,
              or onboarding guidance tailored to your WordPress workflow.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-btn bg-white px-5 py-3 text-sm font-semibold text-primary transition-transform duration-200 hover:-translate-y-0.5"
              >
                Contact support
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/docs"
                className="inline-flex items-center rounded-btn border border-white/30 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
              >
                Read documentation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

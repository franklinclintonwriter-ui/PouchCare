import { CheckCircle2, Sparkles, Wrench } from "lucide-react";

const releases = [
  {
    version: "v0.1.0",
    date: "June 18, 2026",
    items: [
      {
        type: "New",
        summary: "Introduced the first PouchCare API endpoints for authentication and license management.",
      },
      {
        type: "Improved",
        summary: "Refined template browsing with faster filters and clearer metadata for agencies.",
      },
      {
        type: "Fixed",
        summary: "Resolved sync edge cases affecting newly connected WordPress sites.",
      },
    ],
  },
  {
    version: "v0.0.9",
    date: "June 3, 2026",
    items: [
      {
        type: "New",
        summary: "Added customer portal views for subscriptions, plugins, and support activity.",
      },
      {
        type: "Improved",
        summary: "Updated dashboard cards with stronger site health and license visibility.",
      },
    ],
  },
  {
    version: "v0.0.8",
    date: "May 17, 2026",
    items: [
      {
        type: "Improved",
        summary: "Polished the template builder workflow for faster content edits and saved patterns.",
      },
      {
        type: "Fixed",
        summary: "Corrected onboarding states for accounts verifying their first site connection.",
      },
    ],
  },
  {
    version: "v0.0.7",
    date: "April 29, 2026",
    items: [
      {
        type: "New",
        summary: "Launched the initial admin dashboard experience for companies, projects, and templates.",
      },
    ],
  },
];

const badgeClasses = {
  New: "bg-primary/10 text-primary",
  Improved: "bg-amber-100 text-amber-700",
  Fixed: "bg-emerald-100 text-emerald-700",
};

const itemIcons = {
  New: Sparkles,
  Improved: CheckCircle2,
  Fixed: Wrench,
};

export default function Changelog() {
  return (
    <div className="bg-surface-light">
      <section className="max-w-container mx-auto px-6 py-16 sm:py-20 lg:py-24">
        <div className="max-w-3xl animate-fadeUp">
          <span className="inline-flex rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            Product Changelog
          </span>
          <h1 className="mt-6 font-heading text-4xl font-bold text-heading sm:text-5xl">
            Track what is shipping in PouchCare.
          </h1>
          <p className="mt-6 text-lg leading-8 text-body">
            A running timeline of new capabilities, quality improvements, and
            fixes across the PouchCare platform.
          </p>
        </div>
      </section>

      <section className="max-w-container mx-auto px-6 pb-16 sm:pb-20">
        <div className="relative ml-4 border-l border-primary/20 pl-8 sm:ml-6 sm:pl-10">
          {releases.map((release) => (
            <article key={release.version} className="relative pb-12 last:pb-0">
              <div className="absolute -left-[2.55rem] top-1 h-4 w-4 rounded-full border-4 border-white bg-primary shadow-card sm:-left-[3.05rem]" />
              <div className="rounded-card bg-white p-6 shadow-card sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-heading">
                      {release.version}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{release.date}</p>
                  </div>
                  <span className="inline-flex w-fit rounded-full bg-surface-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Release
                  </span>
                </div>

                <ul className="mt-6 space-y-4">
                  {release.items.map((item) => {
                    const Icon = itemIcons[item.type];

                    return (
                      <li
                        key={`${release.version}-${item.summary}`}
                        className="flex gap-4 rounded-card border border-slate-200 p-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-light text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses[item.type]}`}
                          >
                            {item.type}
                          </span>
                          <p className="mt-3 text-sm leading-7 text-body">
                            {item.summary}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

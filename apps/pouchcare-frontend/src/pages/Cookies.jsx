import { Cookie } from "lucide-react";

const sections = [
  {
    id: "what-are-cookies",
    title: "1. What Are Cookies",
    content:
      "Cookies are small data files stored on your device when you visit a website or use an online application. They help services remember sessions, settings, and other information that improves usability and performance.",
  },
  {
    id: "types-we-use",
    title: "2. Types We Use",
    content:
      "PouchCare uses essential cookies to support login and security, analytics cookies to understand product usage trends, and preference cookies to remember user settings. These categories help us keep the platform functional and improve the experience over time.",
  },
  {
    id: "managing-cookies",
    title: "3. Managing Cookies",
    content:
      "Most browsers let you control, block, or delete cookies. Disabling certain cookies may affect sign-in, dashboard functionality, or saved preferences. You can review browser settings and any consent controls we make available on the site.",
  },
  {
    id: "contact",
    title: "4. Contact",
    content:
      "If you have questions about how PouchCare uses cookies or similar technologies, contact hello@pouchcare.com and our team will help clarify the options available to you.",
  },
];

export default function Cookies() {
  return (
    <div className="bg-surface-light">
      <section className="max-w-container mx-auto px-6 py-16 sm:py-20">
        <div className="max-w-3xl animate-fadeUp">
          <div className="flex items-center gap-3 text-primary">
            <Cookie className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em]">
              Cookie Policy
            </span>
          </div>
          <h1 className="mt-6 font-heading text-4xl font-bold text-heading sm:text-5xl">
            Cookie Policy
          </h1>
          <p className="mt-4 text-sm text-muted">Last updated: June 2026</p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-card bg-white p-6 shadow-card lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-heading text-lg font-semibold text-heading">
              Table of contents
            </h2>
            <nav className="mt-4 space-y-3">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block text-sm text-body transition-colors hover:text-primary"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="rounded-card bg-white p-6 shadow-card sm:p-8">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className={index === 0 ? "" : "mt-10 border-t border-slate-200 pt-10"}
              >
                <h2 className="font-heading text-2xl font-semibold text-heading">
                  {section.title}
                </h2>
                <p className="mt-4 text-sm leading-8 text-body sm:text-base">
                  {section.content}
                </p>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

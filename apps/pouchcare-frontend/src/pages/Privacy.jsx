import { ShieldCheck } from "lucide-react";

const sections = [
  {
    id: "information-collection",
    title: "1. Information Collection",
    content:
      "We collect information you provide directly, such as account details, billing contacts, support messages, and workspace configuration data. We may also collect technical usage data needed to secure and improve the service.",
  },
  {
    id: "how-we-use-data",
    title: "2. How We Use Data",
    content:
      "PouchCare uses data to provide the platform, authenticate users, manage licenses, process billing, support customers, and improve feature quality. We also use operational data to maintain platform reliability and prevent abuse.",
  },
  {
    id: "data-sharing",
    title: "3. Data Sharing",
    content:
      "We do not sell personal data. We may share information with trusted subprocessors that support hosting, payments, analytics, or customer communications, but only to the extent necessary for them to perform services on our behalf.",
  },
  {
    id: "cookies",
    title: "4. Cookies",
    content:
      "We use cookies and similar technologies to keep you signed in, remember preferences, understand product usage, and improve site performance. More details are available in our Cookie Policy.",
  },
  {
    id: "data-retention",
    title: "5. Data Retention",
    content:
      "We retain data for as long as necessary to provide the service, comply with legal obligations, resolve disputes, and enforce agreements. Retention periods may vary based on account status, billing history, and support requirements.",
  },
  {
    id: "your-rights",
    title: "6. Your Rights",
    content:
      "Depending on your location, you may have rights to access, correct, delete, or export personal data, or to object to certain processing activities. Requests can be submitted through our support channels and will be handled in line with applicable law.",
  },
  {
    id: "contact",
    title: "7. Contact",
    content:
      "If you have privacy questions or would like to submit a data request, contact us at hello@pouchcare.com. We will review and respond as required under applicable privacy regulations.",
  },
];

export default function Privacy() {
  return (
    <div className="bg-surface-light">
      <section className="max-w-container mx-auto px-6 py-16 sm:py-20">
        <div className="max-w-3xl animate-fadeUp">
          <div className="flex items-center gap-3 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em]">
              Privacy Policy
            </span>
          </div>
          <h1 className="mt-6 font-heading text-4xl font-bold text-heading sm:text-5xl">
            Privacy Policy
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

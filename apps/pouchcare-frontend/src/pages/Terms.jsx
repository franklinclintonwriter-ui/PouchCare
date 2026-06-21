import { FileText } from "lucide-react";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance",
    content:
      "By accessing or using PouchCare, you agree to these Terms of Service and any policies referenced within them. If you are using the service on behalf of a business, you confirm that you have authority to bind that organization to these terms.",
  },
  {
    id: "use-license",
    title: "2. Use License",
    content:
      "PouchCare grants you a limited, non-exclusive, non-transferable license to use the platform for lawful business and website management purposes. You may not reverse engineer, resell, or misuse the service in ways that interfere with platform stability or other customers.",
  },
  {
    id: "limitations",
    title: "3. Limitations",
    content:
      "You agree not to use PouchCare to distribute malicious code, violate applicable laws, or infringe on the rights of others. We may suspend access where misuse creates risk for our systems, customers, or partners.",
  },
  {
    id: "account-terms",
    title: "4. Account Terms",
    content:
      "You are responsible for maintaining the security of your credentials, the accuracy of account information, and the actions taken by users under your account. Team access should be managed carefully, and credentials must not be shared in insecure ways.",
  },
  {
    id: "payment-terms",
    title: "5. Payment Terms",
    content:
      "Paid subscriptions renew according to the selected billing cycle unless canceled before renewal. Fees are non-refundable except where required by law or explicitly stated in a separate written agreement. Taxes may apply based on your billing jurisdiction.",
  },
  {
    id: "termination",
    title: "6. Termination",
    content:
      "You may stop using the service at any time. We may suspend or terminate access if these terms are violated, if payment obligations are not met, or if continued access could harm the platform or other users. Certain obligations, including payment and legal protections, survive termination.",
  },
];

export default function Terms() {
  return (
    <div className="bg-surface-light">
      <section className="max-w-container mx-auto px-6 py-16 sm:py-20">
        <div className="max-w-3xl animate-fadeUp">
          <div className="flex items-center gap-3 text-primary">
            <FileText className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em]">
              Terms of Service
            </span>
          </div>
          <h1 className="mt-6 font-heading text-4xl font-bold text-heading sm:text-5xl">
            Terms of Service
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

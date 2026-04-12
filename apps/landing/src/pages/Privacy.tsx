import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionLabel, SectionHeading } from "@/components/ui/SectionLabel";
import { PageSEO } from "@/components/seo/PageSEO";
import { cn } from "@/lib/cn";

const LAST_UPDATED = "January 15, 2025";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content: `We collect information you provide directly, including: name, email address, phone number, company name, and payment information when you register or make a purchase. We automatically collect certain technical information when you visit our website, including IP address, browser type, operating system, referring URLs, and pages visited. We may also collect information through cookies, web beacons, and similar tracking technologies.`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use the information we collect to: provide, maintain, and improve our services; process transactions and send related information; send promotional communications (with your consent); respond to your comments and questions; analyze usage patterns to improve user experience; detect, prevent, and address technical issues; and comply with legal obligations. We do not sell, trade, or rent your personal information to third parties.`,
  },
  {
    title: "3. Cookies & Tracking Technologies",
    content: `We use cookies and similar tracking technologies to track activity on our website and hold certain information. Cookies are small data files stored on your device. We use session cookies (which expire when you close your browser) and persistent cookies (which stay until you delete them). You can instruct your browser to refuse all cookies or indicate when a cookie is being sent. However, some website features may not function properly without cookies.`,
  },
  {
    title: "4. Data Sharing & Disclosure",
    content: `We may share your information with: service providers who assist us in operating our website and conducting our business (subject to confidentiality agreements); business partners with your consent; law enforcement or government agencies when required by law; or in connection with a merger, sale, or other business transfer. We require all third parties to respect the security of your personal data and to treat it in accordance with applicable law.`,
  },
  {
    title: "5. Data Retention",
    content: `We retain personal data for as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements. When you close your account, we will delete or anonymize your personal information within 90 days, except where we need to retain it for legal or legitimate business purposes. Analytics data may be retained in anonymized form for longer periods.`,
  },
  {
    title: "6. Your Rights (GDPR & CCPA)",
    content: `Depending on your location, you may have the following rights: the right to access the personal data we hold about you; the right to rectify inaccurate data; the right to erasure ("right to be forgotten"); the right to restrict processing; the right to data portability; the right to object to processing; and the right not to be subject to automated decision-making. To exercise these rights, contact us at privacy@pouchcare.com. We will respond within 30 days.`,
  },
  {
    title: "7. Security",
    content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include encryption of data in transit and at rest, regular security assessments, access controls, and employee training. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: "8. International Data Transfers",
    content: `Your information may be transferred to, and maintained on, computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ. If you are located in the European Economic Area, we ensure adequate safeguards are in place for such transfers, including Standard Contractual Clauses approved by the European Commission.`,
  },
  {
    title: "9. Children's Privacy",
    content: `Our services are not directed to individuals under the age of 16. We do not knowingly collect personal information from children under 16. If we become aware that we have collected personal information from a child under 16 without parental consent, we will take steps to delete that information. If you believe we might have any information from or about a child under 16, please contact us.`,
  },
  {
    title: "10. Third-Party Links",
    content: `Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites. We encourage you to review the privacy policies of any third-party sites you visit. This Privacy Policy applies only to information we collect through our own website and services.`,
  },
  {
    title: "11. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically. Your continued use of our services after any changes constitutes your acceptance of the new Privacy Policy.`,
  },
  {
    title: "12. Contact Us",
    content: `If you have questions or concerns about this Privacy Policy or our privacy practices, please contact our Data Protection Officer at: privacy@pouchcare.com, or by mail to: PouchCare, Attention: Privacy Team, Business Bay, Dubai, UAE. For EU residents, you may also lodge a complaint with your local data protection authority.`,
  },
];

function Accordion({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
      >
        <span>{title}</span>
        <ChevronDown
          size={16}
          className={cn(
            "text-primary-600 transition-transform duration-200 shrink-0",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 pt-4 border-t border-gray-200 text-sm leading-relaxed text-gray-600">
          {content}
        </div>
      )}
    </div>
  );
}

export default function Privacy() {
  return (
    <>
      <PageSEO
        title="Privacy Policy"
        description="PouchCare's Privacy Policy explains how we collect, use and protect your personal data. GDPR compliant. We never sell your data. Last updated January 2025."
        canonical="/privacy"
      />

      <div className="border-b border-gray-200 bg-white pt-[68px] pb-10">
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <SectionLabel>Legal</SectionLabel>
            <SectionHeading className="mb-2">Privacy Policy</SectionHeading>
            <p className="text-sm text-gray-500">
              Last updated: {LAST_UPDATED}
            </p>
          </ScrollReveal>
        </div>
      </div>

      <section className="section-pad">
        <div className="container-max">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <div className="glass-card p-6 sm:p-7 mb-8">
                <p className="mb-4 text-sm leading-relaxed text-gray-600">
                  Your privacy matters to us. This Privacy Policy explains what
                  personal information PouchCare collects, why we collect it,
                  how we use it, and your rights regarding that data. We are
                  committed to handling your information responsibly and in
                  compliance with applicable data protection laws, including
                  GDPR (EU/UK) and applicable UAE regulations.
                </p>
                <p className="mb-4 text-sm leading-relaxed text-gray-600">
                  This policy applies to all personal data collected through
                  PouchCare.com, our client portal, email communications, and
                  any other interaction you have with PouchCare Digital
                  Services. &quot;Personal data&quot; means any information that
                  identifies you or could be used to identify you as an
                  individual.
                </p>
                <p className="text-sm leading-relaxed text-gray-600">
                  We do not sell, rent, or trade your personal data to third
                  parties for their marketing purposes — ever. If you have any
                  questions or wish to exercise your data rights, please contact
                  our Data Protection contact at{" "}
                  <a
                    href="mailto:privacy@pouchcare.com"
                    className="text-primary-600 hover:underline"
                  >
                    privacy@pouchcare.com
                  </a>
                  . We will respond to all requests within 72 hours. Last
                  updated: {LAST_UPDATED}.
                </p>
              </div>
            </ScrollReveal>

            <div className="space-y-3">
              {SECTIONS.map((s, i) => (
                <ScrollReveal key={i} delay={i * 30}>
                  <Accordion title={s.title} content={s.content} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

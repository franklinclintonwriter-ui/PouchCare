import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { SectionLabel, SectionHeading } from '@/components/ui/SectionLabel';
import { PageSEO } from '@/components/seo/PageSEO';
import { cn } from '@/lib/cn';

const LAST_UPDATED = 'January 15, 2025';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using PouchCare's website and services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law.`,
  },
  {
    title: '2. Service Description',
    content: `PouchCare provides digital marketing services including but not limited to: search engine optimization (SEO), link building, web development, content creation, and paid advertising management. Services are delivered as described in individual service agreements or order confirmations. We reserve the right to modify, suspend or discontinue any service at any time without notice.`,
  },
  {
    title: '3. Account Registration & Security',
    content: `To access certain features of our platform, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You are responsible for safeguarding your account credentials. You agree to notify us immediately of any unauthorized use of your account. PouchCare will not be liable for any loss or damage arising from your failure to comply with this security obligation.`,
  },
  {
    title: '4. Payment & Billing',
    content: `Payment for services is due as specified in your service agreement or upon order placement. All fees are stated in USD unless otherwise specified. For subscription services, billing occurs automatically at the start of each billing cycle. Failure to pay may result in suspension or termination of services. All sales are final unless our refund policy specifically provides otherwise. We reserve the right to change pricing with 30 days' notice to active subscribers.`,
  },
  {
    title: '5. Refund Policy',
    content: `We offer a 30-day money-back guarantee on monthly retainer plans for new clients. This guarantee does not apply to one-time orders (guest posts, links, development projects) once work has commenced. Refund requests must be submitted in writing within the applicable period. We will review each refund request on a case-by-case basis. Approved refunds will be processed within 7-10 business days to the original payment method.`,
  },
  {
    title: '6. Acceptable Use',
    content: `You may not use our services for any illegal or unauthorized purpose. You agree not to attempt to gain unauthorized access to any portion of our platform, to interfere with or disrupt the integrity or performance of our services, or to transmit any harmful or malicious code. We reserve the right to refuse service, terminate accounts, or remove content at our sole discretion.`,
  },
  {
    title: '7. Intellectual Property',
    content: `All content, features, and functionality of our website and platform — including but not limited to text, graphics, logos, and software — are the exclusive property of PouchCare and are protected by international copyright, trademark, and other intellectual property laws. Content created specifically for you as part of service delivery becomes your property upon full payment.`,
  },
  {
    title: '8. Disclaimers & Limitations of Liability',
    content: `SEO and digital marketing results cannot be guaranteed. While we employ industry best practices and white-hat techniques, search engine algorithms change frequently and results may vary. PouchCare shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services. Our total liability to you shall not exceed the amount paid by you for services in the 3 months preceding the claim.`,
  },
  {
    title: '9. Third-Party Links & Services',
    content: `Our website may contain links to third-party websites or services that are not owned or controlled by PouchCare. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. We strongly advise you to read the terms and privacy policy of any third-party website you visit.`,
  },
  {
    title: '10. Governing Law & Dispute Resolution',
    content: `These Terms shall be governed and construed in accordance with the laws of the United Arab Emirates, without regard to its conflict of law provisions. Any disputes arising from these Terms shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be submitted to binding arbitration in Dubai, UAE. You waive any right to participate in a class-action lawsuit or class-wide arbitration.`,
  },
  {
    title: '11. Changes to Terms',
    content: `We reserve the right to modify these Terms at any time. We will provide notice of significant changes via email to registered users or via a prominent notice on our website. Your continued use of our services after such notification constitutes your acceptance of the modified Terms. It is your responsibility to review these Terms periodically.`,
  },
  {
    title: '12. Contact Information',
    content: `For questions about these Terms of Service, please contact us at: legal@pouchcare.com or by mail to PouchCare, Business Bay, Dubai, UAE.`,
  },
];

function Accordion({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-navy-600 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left text-slate-100 font-medium text-sm hover:bg-navy-700/60 transition-colors"
      >
        <span>{title}</span>
        <ChevronDown size={16} className={cn('text-sky-400 transition-transform duration-200 shrink-0', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-6 pb-5 pt-4 border-t border-navy-600 text-slate-400 text-sm leading-relaxed">
          {content}
        </div>
      )}
    </div>
  );
}

export default function Terms() {
  return (
    <>
      <PageSEO
        title="Terms of Service"
        description="Read PouchCare's Terms of Service. By using PouchCare.com or engaging our services you agree to these terms. Last updated January 2025."
        canonical="/terms"
      />

      <div className="pt-[68px] pb-10 bg-navy-800 border-b border-navy-600">
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <SectionLabel>Legal</SectionLabel>
            <SectionHeading className="mb-2">Terms of Service</SectionHeading>
            <p className="text-slate-500 text-sm">Last updated: {LAST_UPDATED}</p>
          </ScrollReveal>
        </div>
      </div>

      <section className="section-pad">
        <div className="container-max">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <div className="glass-card p-6 sm:p-7 mb-8">
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Please read these Terms of Service carefully before using PouchCare&apos;s website or services.
                  By accessing or using any part of PouchCare.com or engaging us to provide services,
                  you agree to be bound by these terms. If you do not agree, you must not use our website
                  or services.
                </p>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  PouchCare Digital Services (trading as "PouchCare") is a digital marketing agency registered
                  and operating across multiple jurisdictions including the United Arab Emirates, the United Kingdom,
                  and Bangladesh. Our registered correspondence address for legal matters is: Business Bay, Dubai, UAE.
                </p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  These terms were last revised on {LAST_UPDATED}. We may update these Terms from time to time.
                  Your continued use of our services after any changes constitutes your acceptance of the new terms.
                  We recommend bookmarking this page and reviewing it periodically. If you have questions about
                  any term, please contact us at <a href="mailto:legal@pouchcare.com" className="text-sky-400 hover:underline">legal@pouchcare.com</a> before proceeding.
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

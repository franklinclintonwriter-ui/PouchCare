import { useState } from "react";
import {
  Send,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  SectionLabel,
  SectionHeading,
  SectionSub,
} from "@/components/ui/SectionLabel";
import { PageSEO } from "@/components/seo/PageSEO";
import { submitContact, type ContactPayload } from "@/lib/api";
import { cn } from "@/lib/cn";

const CONTACT_INFO = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@pouchcare.com",
    href: "mailto:hello@pouchcare.com",
  },
  {
    icon: Phone,
    label: "WhatsApp",
    value: "+1 (555) 123-4567",
    href: "https://wa.me/15551234567",
  },
  {
    icon: MessageCircle,
    label: "Telegram",
    value: "@pouchcare",
    href: "https://t.me/pouchcare",
  },
  {
    icon: MapPin,
    label: "Offices",
    value: "Dubai · London · Dhaka · Karachi · Lahore",
    href: "/about",
  },
  {
    icon: Clock,
    label: "Response Time",
    value: "Within 4 business hours",
    href: null,
  },
];

const SERVICES = [
  "SEO Retainer",
  "Link Building",
  "Web Development",
  "Content Writing",
  "Google Ads",
  "Social Media",
  "Other",
];

const empty: ContactPayload & { service: string } = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  service: "",
};

export default function Contact() {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Partial<typeof empty>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set =
    (field: keyof typeof empty) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs: Partial<typeof empty> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Enter a valid email";
    if (!form.message.trim()) errs.message = "Message is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const ok = await submitContact({
      name: form.name,
      email: form.email,
      phone: form.phone,
      subject:
        form.subject ||
        `Enquiry from ${form.name}${form.service ? ` — ${form.service}` : ""}`,
      message: form.message,
    });
    setSubmitting(false);
    if (ok) {
      setSuccess(true);
      setForm(empty);
    }
  };

  const inputCls = (field: keyof typeof empty) =>
    cn(
      "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors",
      errors[field]
        ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/30"
        : "focus:border-primary-500/60 focus:ring-primary-500/30",
    );

  return (
    <>
      <PageSEO
        title="Contact Us — Get a Free SEO Audit"
        description="Get in touch with PouchCare for a free SEO audit and custom growth proposal. We reply within 4 business hours. Offices in Dubai, London, Dhaka, Karachi & Lahore."
        canonical="/contact"
      />

      {/* Sub-header */}
      <div className="border-b border-gray-200 bg-white pt-[68px] pb-12">
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <SectionLabel>Get in touch</SectionLabel>
            <SectionHeading className="mb-4">
              Let&apos;s talk <span className="text-gradient">growth</span>
            </SectionHeading>
            <SectionSub className="max-w-xl mx-auto mb-6">
              Whether you need a quote, a strategy call, or just have a question
              — we reply within 4 business hours.
            </SectionSub>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-600">
              Tell us about your business, your goals, and your current
              situation. The more detail you share, the more useful our response
              will be. Every enquiry receives a free site audit and a tailored
              proposal — not a generic template reply. We serve clients across
              30+ countries and speak English, Urdu, Arabic, and Bengali
              fluently.
            </p>
          </ScrollReveal>
        </div>
      </div>

      <section className="section-pad">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
            {/* Form — 3 cols */}
            <div className="lg:col-span-3">
              <ScrollReveal direction="left">
                {success ? (
                  <div className="glass-card p-10 text-center">
                    <CheckCircle
                      size={48}
                      className="text-green-400 mx-auto mb-4"
                    />
                    <h3 className="mb-2 font-sora text-xl font-bold text-gray-900">
                      Message sent!
                    </h3>
                    <p className="mb-6 text-gray-600">
                      Thanks for reaching out. We&apos;ll reply to your email
                      within 4 business hours.
                    </p>
                    <Button variant="outline" onClick={() => setSuccess(false)}>
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name + email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Full name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="John Smith"
                          value={form.name}
                          onChange={set("name")}
                          className={inputCls("name")}
                        />
                        {errors.name && (
                          <p className="mt-1 text-xs text-red-400">
                            {errors.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Email address <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="you@company.com"
                          value={form.email}
                          onChange={set("email")}
                          className={inputCls("email")}
                        />
                        {errors.email && (
                          <p className="mt-1 text-xs text-red-400">
                            {errors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Phone + service */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Phone / WhatsApp
                        </label>
                        <input
                          type="tel"
                          placeholder="+1 555 000 0000"
                          value={form.phone}
                          onChange={set("phone")}
                          className={inputCls("phone")}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Interested in
                        </label>
                        <select
                          value={form.service}
                          onChange={set("service")}
                          className={cn(inputCls("service"), "cursor-pointer")}
                        >
                          <option value="">Select a service...</option>
                          {SERVICES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Subject
                      </label>
                      <input
                        type="text"
                        placeholder="I want to rank for..."
                        value={form.subject}
                        onChange={set("subject")}
                        className={inputCls("subject")}
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Message <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Tell us about your goals, current traffic, target keywords, and budget..."
                        value={form.message}
                        onChange={set("message")}
                        className={cn(inputCls("message"), "resize-none")}
                      />
                      {errors.message && (
                        <p className="mt-1 text-xs text-red-400">
                          {errors.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      fullWidth
                      icon={<Send size={16} />}
                      disabled={submitting}
                    >
                      {submitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </ScrollReveal>
            </div>

            {/* Info — 2 cols */}
            <div className="lg:col-span-2">
              <ScrollReveal direction="right" delay={100}>
                <h3 className="mb-6 font-sora text-lg font-semibold text-gray-900">
                  Contact information
                </h3>
                <div className="space-y-4 mb-8">
                  {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
                    <div key={label} className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
                        <Icon size={15} />
                      </div>
                      <div>
                        <div className="mb-0.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                          {label}
                        </div>
                        {href ? (
                          <a
                            href={href}
                            className="text-sm text-gray-700 transition-colors hover:text-primary-600"
                            target={
                              href.startsWith("http") ? "_blank" : undefined
                            }
                            rel={
                              href.startsWith("http")
                                ? "noopener noreferrer"
                                : undefined
                            }
                          >
                            {value}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-700">{value}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick facts */}
                <div className="glass-card p-5">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900">
                    Why reach out?
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "Free SEO audit with every enquiry",
                      "Custom quote within 24 hours",
                      "No obligation, no hard sell",
                      "English, Urdu, Bengali support",
                    ].map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
      {/* What happens next */}
      <section className="pb-16 sm:pb-20 pt-0 px-4 sm:px-6 lg:px-8">
        <div className="container-max">
          <ScrollReveal>
            <div className="rounded-2xl border border-navy-600/60 bg-navy-800/50 p-7 sm:p-10">
              <div className="text-center mb-8">
                <SectionLabel>After you submit</SectionLabel>
                <h2 className="mb-3 font-sora text-xl font-bold text-gray-900 sm:text-2xl">
                  What happens next
                </h2>
                <p className="mx-auto max-w-lg text-sm leading-relaxed text-gray-600">
                  We have a streamlined onboarding process designed to get your
                  campaign live as quickly as possible — without cutting corners
                  on strategy.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {
                    step: "1",
                    title: "We review your enquiry",
                    desc: "A senior specialist reads your message, visits your website, and checks your niche competitiveness before replying. No template responses.",
                  },
                  {
                    step: "2",
                    title: "Free audit & proposal",
                    desc: "Within 4 business hours you receive a personalised audit of your site and a detailed proposal with pricing, timelines, and expected ranking milestones.",
                  },
                  {
                    step: "3",
                    title: "Discovery call (optional)",
                    desc: "If you would like to speak before committing, we schedule a 30-minute strategy call via Zoom, Google Meet, or phone — your choice, your timezone.",
                  },
                  {
                    step: "4",
                    title: "Campaign launches in 48h",
                    desc: "Once you approve the proposal, your dedicated account manager kicks off onboarding and your first deliverables begin within 48 hours.",
                  },
                ].map((s) => (
                  <div
                    key={s.step}
                    className="flex flex-col items-center text-center group p-4 rounded-xl border border-navy-600/40 bg-navy-700/20 hover:border-sky-500/20 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-3 font-mono font-bold text-sky-400 text-sm group-hover:border-sky-500/40 transition-colors">
                      {s.step}
                    </div>
                    <div className="mb-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary-700">
                      {s.title}
                    </div>
                    <div className="text-xs leading-relaxed text-gray-600">
                      {s.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

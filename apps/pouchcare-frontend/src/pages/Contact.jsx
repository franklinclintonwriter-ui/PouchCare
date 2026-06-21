import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock3,
  Headphones,
  Mail,
  MessageSquare,
  Send,
  Twitter,
  Linkedin,
  Github,
} from "lucide-react";

const initialForm = {
  name: "",
  email: "",
  subject: "General inquiry",
  message: "",
};

const socialLinks = [
  { label: "Twitter", href: "https://twitter.com", icon: Twitter },
  { label: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
  { label: "GitHub", href: "https://github.com", icon: Github },
];

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (submitted) {
      setSubmitted(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setForm(initialForm);
  }

  return (
    <div className="bg-surface-light">
      <section className="max-w-container mx-auto px-6 py-16 sm:py-20 lg:py-24">
        <div className="max-w-3xl animate-fadeUp">
          <span className="inline-flex rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            Contact
          </span>
          <h1 className="mt-6 font-heading text-4xl font-bold text-heading sm:text-5xl">
            Get in touch with the PouchCare team.
          </h1>
          <p className="mt-6 text-lg leading-8 text-body">
            Whether you need help with onboarding, partnerships, or product
            questions, we are here to help WordPress teams move faster.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-card bg-white p-6 shadow-card sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-semibold text-heading">
                  Send us a message
                </h2>
                <p className="text-sm text-body">
                  We usually reply within one business day.
                </p>
              </div>
            </div>

            {submitted && (
              <div className="mb-6 rounded-card border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Thanks for reaching out. Your message has been received and our
                team will follow up shortly.
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-heading">
                    Name
                  </span>
                  <input
                    required
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full rounded-btn border border-slate-200 px-4 py-3 text-sm text-heading outline-none transition-colors focus:border-primary"
                    placeholder="Your name"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-heading">
                    Email
                  </span>
                  <input
                    required
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-btn border border-slate-200 px-4 py-3 text-sm text-heading outline-none transition-colors focus:border-primary"
                    placeholder="you@example.com"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-heading">
                  Subject
                </span>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full rounded-btn border border-slate-200 px-4 py-3 text-sm text-heading outline-none transition-colors focus:border-primary"
                >
                  <option>General inquiry</option>
                  <option>Sales question</option>
                  <option>Technical support</option>
                  <option>Partnerships</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-heading">
                  Message
                </span>
                <textarea
                  required
                  name="message"
                  rows="6"
                  value={form.message}
                  onChange={handleChange}
                  className="w-full rounded-card border border-slate-200 px-4 py-3 text-sm leading-6 text-heading outline-none transition-colors focus:border-primary"
                  placeholder="Tell us how we can help."
                />
              </label>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-btn bg-primary px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Send message
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          <aside className="space-y-6">
            <div className="rounded-card bg-white p-6 shadow-card">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-xl font-semibold text-heading">
                Contact information
              </h3>
              <a
                href="mailto:hello@pouchcare.com"
                className="mt-3 inline-block text-body transition-colors hover:text-primary"
              >
                hello@pouchcare.com
              </a>
            </div>

            <div className="rounded-card bg-white p-6 shadow-card">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock3 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-xl font-semibold text-heading">
                Support hours
              </h3>
              <p className="mt-3 text-sm leading-7 text-body">
                Monday to Friday
                <br />
                9:00 AM – 6:00 PM UTC
              </p>
            </div>

            <div className="rounded-card bg-white p-6 shadow-card">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Headphones className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-xl font-semibold text-heading">
                Need product help?
              </h3>
              <p className="mt-3 text-sm leading-7 text-body">
                Visit our support center for setup guides, billing answers, and
                troubleshooting articles.
              </p>
              <Link
                to="/support"
                className="mt-4 inline-flex items-center text-sm font-semibold text-primary transition-colors hover:text-heading"
              >
                Browse support resources
              </Link>
            </div>

            <div className="rounded-card bg-white p-6 shadow-card">
              <h3 className="font-heading text-xl font-semibold text-heading">
                Follow along
              </h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {socialLinks.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-btn border border-slate-200 px-4 py-2 text-sm text-body transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

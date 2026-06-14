import { Link } from "react-router-dom";
import { ArrowLeft, Home, LifeBuoy, Search } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionLabel, SectionHeading } from "@/components/ui/SectionLabel";
import { PageSEO } from "@/components/seo/PageSEO";

const QUICK_LINKS = [
  { to: "/services", label: "Services", description: "Browse what we offer" },
  { to: "/pricing", label: "Pricing", description: "Compare our plans" },
  { to: "/blog", label: "Blog", description: "Guides & insights" },
  { to: "/contact", label: "Contact", description: "Talk to our team" },
] as const;

export default function NotFound() {
  return (
    <>
      <PageSEO
        title="Page Not Found"
        description="The page you are looking for could not be found. Explore PouchCare's services, pricing, and resources or head back to the homepage."
      />

      <section className="section-pad">
        <div className="container-max">
          <div className="mx-auto max-w-2xl text-center">
            <ScrollReveal>
              <SectionLabel>Error 404</SectionLabel>
              <p className="font-sora text-7xl font-bold leading-none text-gradient sm:text-8xl">
                404
              </p>
              <SectionHeading as="h1" className="mt-4">
                This page took a wrong turn
              </SectionHeading>
              <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-gray-600">
                The page you&apos;re looking for doesn&apos;t exist, may have
                moved, or the link is broken. Let&apos;s get you back on track.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/"
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 touch-manipulation sm:w-auto"
                >
                  <Home size={16} />
                  Back to home
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 touch-manipulation sm:w-auto"
                >
                  <LifeBuoy size={16} />
                  Contact support
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={140}>
              <div className="mt-12">
                <p className="mb-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  <Search size={14} />
                  Popular pages
                </p>
                <div className="grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
                  {QUICK_LINKS.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="group rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
                    >
                      <span className="block text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                        {link.label}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {link.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <Link
                to="/"
                className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <ArrowLeft size={15} />
                Return to homepage
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}

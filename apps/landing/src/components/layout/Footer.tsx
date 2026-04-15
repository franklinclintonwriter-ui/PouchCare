import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { BrandLogo } from "@/components/layout/BrandLogo";
import {
  BRAND_OPERATES_UNDER_ENTITY,
  LEGAL_ENTITY_NAME,
  TRADING_NAME,
} from "@/lib/legalEntity";
import {
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Mail,
  MapPin,
  Phone,
  Facebook,
  Star,
} from "lucide-react";
import { portalLoginUrl, portalRegisterUrl } from "@/lib/portal";

const LINKS = {
  Services: [
    { label: "SEO Services", href: "/services" },
    { label: "Domains & hosting", href: "/services/hosting" },
    { label: "Domain Search", href: "/services/hosting/search" },
    { label: "Web → Android APK", href: "/services/web-to-apk" },
    { label: "Link Building", href: "/backlinks" },
    { label: "Web Development", href: "/services" },
    { label: "Content Writing", href: "/services" },
    { label: "Google Ads", href: "/services" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact Us", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

const SOCIAL = [
  {
    icon: Facebook,
    href: "https://www.facebook.com/pouchcare",
    label: "Facebook",
  },
  {
    icon: Instagram,
    href: "https://www.instagram.com/pouchcareofficial/",
    label: "Instagram",
  },
  {
    icon: Linkedin,
    href: "https://bd.linkedin.com/company/pouchcare",
    label: "LinkedIn",
  },
  {
    icon: Twitter,
    href: "https://twitter.com/pouchcare",
    label: "Twitter / X",
  },
  { icon: Youtube, href: "https://youtube.com/@pouchcare", label: "YouTube" },
];

/**
 * Organization JSON-LD — reflects verified public data about PouchCare.
 * Founder: Abdullah Al Mamun (Abdullah Babu), born 2001, Bangladeshi
 * entrepreneur based in Dubai. Founder of PouchCare & AAWS.
 */
const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://pouchcare.com/#organization",
  name: "PouchCare",
  legalName: LEGAL_ENTITY_NAME,
  alternateName: "PouchCare Digital Agency",
  url: "https://pouchcare.com",
  logo: {
    "@type": "ImageObject",
    url: "https://pouchcare.com/pouchcare-logo-main.png",
    width: 1211,
    height: 214,
  },
  description:
    "PouchCare is a premium SEO, link building, web development and digital marketing agency founded by Abdullah Al Mamun (Abdullah Babu). Trusted by 500+ businesses across 30+ countries. Specialising in white-hat organic growth, high-authority backlinks, technical SEO, and full-stack web development. " +
    BRAND_OPERATES_UNDER_ENTITY +
    ".",
  foundingDate: "2016",
  founder: {
    "@type": "Person",
    "@id": "https://pouchcare.com/#founder",
    name: "Abdullah Al Mamun",
    alternateName: ["Abdullah Babu", "Abdullah Al Mamun Babu"],
    givenName: "Abdullah",
    familyName: "Al Mamun",
    jobTitle: "Founder & CEO",
    description:
      "Abdullah Al Mamun, also known as Abdullah Babu, is a Bangladeshi Entrepreneur and Digital Strategist based in Dubai. He is the founder of AAWS and PouchCare. Babu is best known for his work in search engine reputation management in Asia.",
    url: "http://abdullahbabu.com/",
    nationality: { "@type": "Country", name: "Bangladesh" },
    homeLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Dubai",
        addressCountry: "AE",
      },
    },
    sameAs: [
      "http://abdullahbabu.com/",
      "https://www.linkedin.com/in/abdullahbabu",
      "https://www.instagram.com/abdullahbabuofficial",
      "https://www.devex.com/people/abdullah-babu-2637152",
      "https://www.republicworld.com/initiatives/abdullah-babu-an-seo-strategist-with-a-practical-approach-to-digital-marketing",
      "https://www.india.com/money/abdullah-babu-the-seo-genius-transforming-digital-marketing-in-asia-7866495/",
      "https://news.abplive.com/brand-wire/abdullah-al-mamun-babu-the-seo-expert-and-digital-entrepreneur-changing-asia-s-online-world-1796913",
      "https://www.msn.com/en-us/money/smallbusiness/abdullah-al-mamun-babu-the-seo-genius-and-digital-entrepreneur-redefining-asia-s-online-growth/ar-AA1L5gHo",
    ],
  },
  numberOfEmployees: { "@type": "QuantitativeValue", value: 60 },
  email: "hello@pouchcare.com",
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "hello@pouchcare.com",
      availableLanguage: ["English", "Urdu", "Bengali", "Arabic"],
    },
  ],
  areaServed: "Worldwide",
  knowsAbout: [
    "Search Engine Optimisation",
    "Link Building",
    "Web Development",
    "Digital Marketing",
    "Technical SEO",
    "Content Marketing",
    "Google Ads",
    "App Development",
  ],
  sameAs: [
    "https://www.facebook.com/pouchcare",
    "https://www.instagram.com/pouchcareofficial/",
    "https://bd.linkedin.com/company/pouchcare",
    "https://twitter.com/pouchcare",
    "https://youtube.com/@pouchcare",
    "https://pouchcare.com.bd/",
    "https://trustpilot.com/review/pouchcare.com",
  ],
  address: [
    {
      "@type": "PostalAddress",
      streetAddress: "Business Bay",
      addressLocality: "Dubai",
      addressCountry: "AE",
    },
    {
      "@type": "PostalAddress",
      streetAddress: "Canary Wharf",
      addressLocality: "London",
      addressCountry: "GB",
    },
    {
      "@type": "PostalAddress",
      streetAddress: "Gulshan",
      addressLocality: "Dhaka",
      addressCountry: "BD",
    },
    {
      "@type": "PostalAddress",
      streetAddress: "DHA Phase 6",
      addressLocality: "Karachi",
      addressCountry: "PK",
    },
    {
      "@type": "PostalAddress",
      streetAddress: "Johar Town",
      addressLocality: "Lahore",
      addressCountry: "PK",
    },
  ],
};

/** WebSite JSON-LD — enables Sitelinks Searchbox eligibility */
const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://pouchcare.com/#website",
  name: "PouchCare",
  url: "https://pouchcare.com",
  publisher: { "@id": "https://pouchcare.com/#organization" },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://pouchcare.com/blog?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
      {/* Organization structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_SCHEMA) }}
      />
      {/* WebSite structured data — Sitelinks Searchbox */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
      />
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-6 sm:pb-8">
          {/* Top grid */}
          <div className="mb-8 sm:mb-12 grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-6 lg:gap-8">
            {/* Brand col — spans 2 on lg */}
            <div className="col-span-2 lg:col-span-2">
              <BrandLogo
                variant="footer"
                className="mb-4 group [&_img]:transition-opacity [&_img]:group-hover:opacity-90"
              />
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-5 max-w-xs">
                Premium SEO, Link Building and Digital Marketing services
                helping 500+ businesses rank higher and grow faster since 2016.
              </p>
              <p className="text-gray-500 text-[10px] sm:text-xs leading-relaxed mb-4 sm:mb-5 max-w-xs">
                {BRAND_OPERATES_UNDER_ENTITY}.
              </p>
              {/* Social */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-5">
                {SOCIAL.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
              {/* Review platform badges */}
              <div className="hidden sm:flex flex-wrap items-center gap-2 mb-4">
                <a
                  href="https://trustpilot.com/review/pouchcare.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-[#00b67a]/50 hover:bg-[#f7fef9] transition-colors"
                  aria-label="Rate us on Trustpilot"
                >
                  <span className="w-4 h-4 rounded bg-[#00b67a] flex items-center justify-center shrink-0">
                    <Star size={9} className="text-white fill-white" />
                  </span>
                  <span className="text-[10px] font-semibold text-gray-600">
                    Trustpilot
                  </span>
                  <span className="flex gap-px">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={7}
                        className="text-[#00b67a] fill-[#00b67a]"
                      />
                    ))}
                  </span>
                </a>
                <a
                  href="https://share.google/6nNEF76YLXDvM3PYE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-[#4285f4]/50 hover:bg-blue-50/50 transition-colors"
                  aria-label="View Google Reviews"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-3.5 h-3.5 shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                      fill="#fff"
                    />
                    <path
                      d="M20.64 12.2c0-.63-.06-1.25-.16-1.84H12v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.63z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 21c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H3.96v2.33C5.44 19.1 8.51 21 12 21z"
                      fill="#34A853"
                    />
                    <path
                      d="M6.97 13.71A5.95 5.95 0 0 1 6.66 12c0-.59.1-1.17.31-1.71V7.96H3.96A9.98 9.98 0 0 0 2 12c0 1.61.39 3.14 1.07 4.49a.5.5 0 0 0 .89 0l2.01-2.78z"
                      fill="#FBBC04"
                    />
                    <path
                      d="M12 6.58c1.32 0 2.51.45 3.44 1.34l2.58-2.58C16.46 3.89 14.43 3 12 3 8.51 3 5.44 4.9 3.96 7.75l3.01 2.33C7.68 8.16 9.66 6.58 12 6.58z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="text-[10px] font-semibold text-gray-600">
                    Google
                  </span>
                  <span className="flex gap-px">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={7}
                        className="text-[#FBBC04] fill-[#FBBC04]"
                      />
                    ))}
                  </span>
                </a>
              </div>

              {/* Client portal — Login / Register */}
              <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
                <a
                  href={portalLoginUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-primary-300 hover:text-primary-700"
                >
                  Login
                </a>
                <a
                  href={portalRegisterUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
                >
                  Register
                </a>
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(LINKS).map(([title, links], idx, arr) => (
              <div
                key={title}
                className={cn(
                  idx === arr.length - 1 && "sm:col-span-2 lg:col-span-1",
                )}
              >
                <h3 className="text-gray-900 font-semibold text-xs sm:text-sm mb-2.5 sm:mb-4">
                  {title}
                </h3>
                <ul className="space-y-1.5 sm:space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-gray-600 text-xs sm:text-sm hover:text-primary-700 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact strip */}
          <div className="mb-6 sm:mb-10 grid grid-cols-1 gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:p-4 sm:grid-cols-3">
            {[
              {
                icon: Mail,
                text: "hello@pouchcare.com",
                href: "mailto:hello@pouchcare.com",
              },
              {
                icon: Phone,
                text: "+1 (555) 123-4567",
                href: "tel:+15551234567",
              },
              {
                icon: MapPin,
                text: "Dubai, UAE · London, UK · Dhaka, BD",
                href: "/contact",
              },
            ].map(({ icon: Icon, text, href }) => (
              <a
                key={text}
                href={href}
                className="group flex min-h-[40px] sm:min-h-[48px] items-center gap-2.5 sm:gap-3 rounded-xl py-1 text-gray-600 transition-colors hover:text-primary-700"
              >
                <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors group-hover:bg-primary-50">
                  <Icon size={13} />
                </span>
                <span className="min-w-0 flex-1 text-xs sm:text-sm leading-snug">
                  {text}
                </span>
              </a>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200">
            <div className="text-center sm:text-left">
              <p className="text-gray-500 text-xs sm:text-sm">
                &copy; {year} {TRADING_NAME}. All rights reserved.
              </p>
              <p className="mt-0.5 sm:mt-1 text-gray-400 text-[10px] sm:text-xs max-w-md">
                {LEGAL_ENTITY_NAME} — incorporated in Bangladesh under the
                Companies Act (Act XVIII) of 1994.
              </p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                to="/privacy"
                className="text-gray-500 text-xs sm:text-sm hover:text-primary-700 transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="text-gray-500 text-xs sm:text-sm hover:text-primary-700 transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

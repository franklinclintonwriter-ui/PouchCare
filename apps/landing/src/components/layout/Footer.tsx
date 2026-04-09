import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Instagram, Youtube, Mail, MapPin, Phone, ExternalLink, Facebook } from 'lucide-react';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL ?? 'https://portal.pouchcare.com';

const LINKS = {
  Services: [
    { label: 'SEO Services', href: '/services' },
    { label: 'Link Building', href: '/backlinks' },
    { label: 'Web Development', href: '/services' },
    { label: 'Content Writing', href: '/services' },
    { label: 'Google Ads', href: '/services' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact Us', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

const SOCIAL = [
  { icon: Facebook, href: 'https://www.facebook.com/pouchcare', label: 'Facebook' },
  { icon: Instagram, href: 'https://www.instagram.com/pouchcareofficial/', label: 'Instagram' },
  { icon: Linkedin, href: 'https://bd.linkedin.com/company/pouchcare', label: 'LinkedIn' },
  { icon: Twitter, href: 'https://twitter.com/pouchcare', label: 'Twitter / X' },
  { icon: Youtube, href: 'https://youtube.com/@pouchcare', label: 'YouTube' },
];

/**
 * Organization JSON-LD — reflects verified public data about PouchCare.
 * Founder: Abdullah Al Mamun (Abdullah Babu), born 2001, Bangladeshi
 * entrepreneur based in Dubai. Founder of PouchCare & AAWS.
 */
const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://pouchcare.com/#organization',
  name: 'PouchCare',
  alternateName: 'PouchCare Digital Agency',
  url: 'https://pouchcare.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://pouchcare.com/pouchcare-logo-main.png',
    width: 1211,
    height: 214,
  },
  description:
    'PouchCare is a premium SEO, link building, web development and digital marketing agency founded by Abdullah Al Mamun (Abdullah Babu). Trusted by 500+ businesses across 30+ countries. Specialising in white-hat organic growth, high-authority backlinks, technical SEO, and full-stack web development.',
  foundingDate: '2016',
  founder: {
    '@type': 'Person',
    '@id': 'https://pouchcare.com/#founder',
    name: 'Abdullah Al Mamun',
    alternateName: ['Abdullah Babu', 'Abdullah Al Mamun Babu'],
    givenName: 'Abdullah',
    familyName: 'Al Mamun',
    jobTitle: 'Founder & CEO',
    description:
      'Abdullah Al Mamun, also known as Abdullah Babu, is a Bangladeshi Entrepreneur and Digital Strategist based in Dubai. He is the founder of AAWS and PouchCare. Babu is best known for his work in search engine reputation management in Asia.',
    url: 'http://abdullahbabu.com/',
    nationality: { '@type': 'Country', name: 'Bangladesh' },
    homeLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: 'Dubai', addressCountry: 'AE' },
    },
    sameAs: [
      'http://abdullahbabu.com/',
      'https://www.linkedin.com/in/abdullahbabu',
      'https://www.instagram.com/abdullahbabuofficial',
      'https://www.devex.com/people/abdullah-babu-2637152',
      'https://www.republicworld.com/initiatives/abdullah-babu-an-seo-strategist-with-a-practical-approach-to-digital-marketing',
      'https://www.india.com/money/abdullah-babu-the-seo-genius-transforming-digital-marketing-in-asia-7866495/',
      'https://news.abplive.com/brand-wire/abdullah-al-mamun-babu-the-seo-expert-and-digital-entrepreneur-changing-asia-s-online-world-1796913',
      'https://www.msn.com/en-us/money/smallbusiness/abdullah-al-mamun-babu-the-seo-genius-and-digital-entrepreneur-redefining-asia-s-online-growth/ar-AA1L5gHo',
    ],
  },
  numberOfEmployees: { '@type': 'QuantitativeValue', value: 60 },
  email: 'hello@pouchcare.com',
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'hello@pouchcare.com',
      availableLanguage: ['English', 'Urdu', 'Bengali', 'Arabic'],
    },
  ],
  areaServed: 'Worldwide',
  knowsAbout: [
    'Search Engine Optimisation',
    'Link Building',
    'Web Development',
    'Digital Marketing',
    'Technical SEO',
    'Content Marketing',
    'Google Ads',
    'App Development',
  ],
  sameAs: [
    'https://www.facebook.com/pouchcare',
    'https://www.instagram.com/pouchcareofficial/',
    'https://bd.linkedin.com/company/pouchcare',
    'https://twitter.com/pouchcare',
    'https://youtube.com/@pouchcare',
    'https://pouchcare.com.bd/',
  ],
  address: [
    {
      '@type': 'PostalAddress',
      streetAddress: 'Business Bay',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
    {
      '@type': 'PostalAddress',
      streetAddress: 'Canary Wharf',
      addressLocality: 'London',
      addressCountry: 'GB',
    },
    {
      '@type': 'PostalAddress',
      streetAddress: 'Gulshan',
      addressLocality: 'Dhaka',
      addressCountry: 'BD',
    },
    {
      '@type': 'PostalAddress',
      streetAddress: 'DHA Phase 6',
      addressLocality: 'Karachi',
      addressCountry: 'PK',
    },
    {
      '@type': 'PostalAddress',
      streetAddress: 'Johar Town',
      addressLocality: 'Lahore',
      addressCountry: 'PK',
    },
  ],
};

/** WebSite JSON-LD — enables Sitelinks Searchbox eligibility */
const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://pouchcare.com/#website',
  name: 'PouchCare',
  url: 'https://pouchcare.com',
  publisher: { '@id': 'https://pouchcare.com/#organization' },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://pouchcare.com/blog?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
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
      <footer className="bg-navy-800 border-t border-navy-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand col — spans 2 on lg */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Link to="/" className="inline-flex items-center mb-4 group">
              <img
                src="/pouchcare-logo-main.png"
                alt="PouchCare"
                className="h-11 w-auto object-contain group-hover:opacity-85 transition-opacity drop-shadow-[0_0_6px_rgba(56,189,248,0.2)]"
                style={{ maxWidth: '200px' }}
              />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-xs">
              Premium SEO, Link Building and Digital Marketing services helping 500+ businesses
              rank higher and grow faster since 2016.
            </p>
            {/* Social */}
            <div className="flex items-center gap-2 mb-5">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-navy-600 flex items-center justify-center text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
            {/* Partner portal CTA — clearly labelled as for clients */}
            <a
              href={PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-navy-500 text-xs font-semibold text-slate-500 hover:text-sky-400 hover:border-sky-500/30 transition-colors"
            >
              <ExternalLink size={11} />
              Partner &amp; Client Portal
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-slate-200 font-semibold text-sm mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-slate-400 text-sm hover:text-sky-400 transition-colors"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 p-4 rounded-2xl bg-navy-700/40 border border-navy-600/60">
          {[
            { icon: Mail, text: 'hello@pouchcare.com', href: 'mailto:hello@pouchcare.com' },
            { icon: Phone, text: '+1 (555) 123-4567', href: 'tel:+15551234567' },
            { icon: MapPin, text: 'Dubai, UAE · London, UK · Dhaka, BD', href: '/contact' },
          ].map(({ icon: Icon, text, href }) => (
            <a
              key={text}
              href={href}
              className="flex items-center gap-3 text-slate-400 hover:text-sky-400 transition-colors group"
            >
              <span className="w-8 h-8 rounded-lg bg-navy-600 flex items-center justify-center shrink-0 group-hover:bg-sky-500/10 transition-colors">
                <Icon size={14} />
              </span>
              <span className="text-sm">{text}</span>
            </a>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-navy-600">
          <p className="text-slate-500 text-sm">
            &copy; {year} PouchCare. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-slate-500 text-sm hover:text-slate-300 transition-colors">Privacy</Link>
            <Link to="/terms" className="text-slate-500 text-sm hover:text-slate-300 transition-colors">Terms</Link>
            <span className="text-slate-600 text-xs">Made with ♥ for growth</span>
          </div>
        </div>
      </div>
      </footer>
    </>
  );
}

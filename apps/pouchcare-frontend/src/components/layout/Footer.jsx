import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, Dribbble } from "lucide-react";
import Logo from "../ui/Logo";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Templates", href: "/templates" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Blog", href: "/blog" },
      { label: "Support", href: "/support" },
      { label: "API", href: "/api" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Partners", href: "/partners" },
    ],
  },
];

const socialLinks = [
  { icon: Github, href: "https://github.com/pouchcare", label: "GitHub" },
  { icon: Twitter, href: "https://x.com/pouchcare", label: "Twitter" },
  {
    icon: Linkedin,
    href: "https://linkedin.com/company/pouchcare",
    label: "LinkedIn",
  },
  { icon: Dribbble, href: "https://dribbble.com/pouchcare", label: "Dribbble" },
];

export default function Footer() {
  return (
    <footer className="bg-footer-bg text-footer-text">
      <div className="max-w-container mx-auto px-6 pt-16 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-4 space-y-5">
            <Logo light size="md" />
            <p className="text-sm leading-relaxed text-footer-text/70 max-w-xs">
              Build beautiful websites faster with the all-in-one WordPress
              toolkit.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-footer-text/30 flex items-center justify-center text-footer-text/70 transition-all duration-200 hover:border-accent-cyan hover:text-accent-cyan"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title} className="lg:col-span-2">
              <h4 className="text-white font-semibold text-sm mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-footer-text/70 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-footer-text/50">
          <p>&copy; 2026 PouchCare. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <span>&middot;</span>
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <span>&middot;</span>
            <Link to="/cookies" className="hover:text-white transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

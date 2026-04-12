import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";

const PORTAL_URL =
  import.meta.env.VITE_PORTAL_URL ?? "https://portal.pouchcare.com";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Backlinks", href: "/backlinks" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

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
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  /* Scroll detection */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close on navigation */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* Lock body scroll when drawer open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(href);

  return (
    <>
      {/* ── Desktop / Tablet Bar ─────────────────────────────────────────── */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-gray-200/80 shadow-soft"
            : "bg-white/70 backdrop-blur-md border-b border-transparent",
        )}
        style={{
          height: "68px",
          /* GPU-promote the header so background blur doesn't trigger layout */
          transform: "translateZ(0)",
          /* Only transition bg-opacity + box-shadow — not position/size */
          transition:
            "background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
          willChange: "background-color",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            aria-label="PouchCare — Home"
            className="flex items-center shrink-0 group"
          >
            <img
              src="/pouchcare-logo-transparent.png"
              alt="PouchCare"
              width={160}
              height={44}
              className="h-10 sm:h-11 w-auto object-contain group-hover:opacity-85 transition-opacity"
              style={{ maxWidth: 190 }}
            />
          </Link>

          {/* Center nav pill — desktop only */}
          <nav
            aria-label="Main navigation"
            className="hidden lg:flex items-center gap-0.5 bg-gray-100/90 border border-gray-200 rounded-2xl px-2 py-1.5"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap",
                  "transition-[color,background-color] duration-150",
                  isActive(link.href)
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-500 hover:text-gray-900 hover:bg-white",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: Partner Portal (desktop) */}
          <div className="hidden lg:flex items-center shrink-0">
            <a
              href={PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600 hover:text-primary-700 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-[color,background-color,border-color] duration-150 tracking-wide uppercase"
            >
              Partner Portal
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Hamburger — mobile/tablet */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="lg:hidden relative z-[60] p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ────────────────────────────────────────────────── */}
      {/* Full-screen overlay */}
      <div
        aria-hidden={!mobileOpen}
        className={cn(
          "fixed inset-0 z-[55] lg:hidden transition-all duration-300",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-gray-900/40 backdrop-blur-sm",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          style={{
            transition: "opacity 0.28s ease",
            willChange: "opacity",
          }}
        />

        {/* Slide-in panel */}
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-[300px] max-w-[85vw] flex flex-col",
            "bg-white border-l border-gray-200",
            mobileOpen ? "translate-x-0" : "translate-x-full",
          )}
          style={{
            boxShadow: "-16px 0 64px rgba(0,0,0,0.6)",
            /* Spring easing: fast start, gentle settle */
            transition: "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
            willChange: "transform",
          }}
        >
          {/* Drawer header — same height as main navbar */}
          <div
            className="flex items-center justify-between px-5 shrink-0 border-b border-gray-200"
            style={{ height: "68px" }}
          >
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              aria-label="PouchCare — Home"
              className="flex items-center"
            >
              <img
                src="/pouchcare-logo-transparent.png"
                alt="PouchCare"
                className="h-9 w-auto object-contain"
                style={{ maxWidth: 165 }}
              />
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav links */}
          <nav
            aria-label="Mobile navigation"
            className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium",
                  "transition-[color,background-color,border-color] duration-150",
                  isActive(link.href)
                    ? "bg-primary-100 text-primary-700 border border-primary-200"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-transparent",
                )}
              >
                <span>{link.label}</span>
                <ChevronRight
                  size={14}
                  className={cn(
                    "transition-opacity",
                    isActive(link.href)
                      ? "opacity-60 text-primary-600"
                      : "opacity-30",
                  )}
                />
              </Link>
            ))}
          </nav>

          {/* Drawer footer */}
          <div className="shrink-0 px-4 py-5 border-t border-gray-200 space-y-4">
            {/* Social row */}
            <div className="flex items-center justify-center gap-3">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all duration-150"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>

            {/* Partner Portal CTA */}
            <a
              href={PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 transition-[color,background-color,border-color] duration-150"
            >
              Partner Portal
              <ExternalLink size={13} />
            </a>
            <p className="text-center text-gray-500 text-xs leading-tight">
              For PouchCare clients &amp; affiliates only
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

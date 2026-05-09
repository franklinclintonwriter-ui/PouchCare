import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "../../utils/cn";
import { useScrollPosition } from "../../hooks/useScrollPosition";
import { navLinks } from "../../data/navigation";
import Logo from "../ui/Logo";
import Button from "../ui/Button";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollY = useScrollPosition();
  const scrolled = scrollY > 50;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white/95 backdrop-blur-sm transition-shadow duration-300",
        scrolled && "shadow-nav"
      )}
    >
      <nav className="max-w-container mx-auto px-6 flex items-center justify-between h-16 lg:h-[72px]">
        {/* Logo */}
        <Link to="/" className="shrink-0" onClick={() => setMobileOpen(false)}>
          <Logo size="md" />
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className="text-sm font-medium text-body hover:text-primary transition-colors duration-200"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-3">
          <Button variant="ghost" size="sm" as={Link} to="/login">
            Login
          </Button>
          <Button variant="primary" size="sm" as={Link} to="/signup">
            Get Started
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 text-heading hover:text-primary transition-colors"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 ease-out bg-white border-t border-gray-100",
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-6 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-sm font-medium text-body hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 flex flex-col gap-2 border-t border-gray-100">
            <Button
              variant="secondary"
              size="sm"
              as={Link}
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full"
            >
              Login
            </Button>
            <Button
              variant="primary"
              size="sm"
              as={Link}
              to="/signup"
              onClick={() => setMobileOpen(false)}
              className="w-full"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

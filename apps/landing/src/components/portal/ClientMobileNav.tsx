import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { CLIENT_MOBILE_NAV } from "@/config/clientDashboardNav";
import { paths } from "@/routes/paths";
import { useClientShellStore } from "@/stores/clientShellStore";

export function ClientMobileNav() {
  const location = useLocation();
  const openMobile = useClientShellStore((s) => s.openMobile);

  function isActive(href: string, end?: boolean): boolean {
    if (end || href === paths.dashboard) {
      return location.pathname === href;
    }
    return (
      location.pathname === href || location.pathname.startsWith(`${href}/`)
    );
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      aria-label="Primary"
    >
      <div className="border-t border-gray-200/80 bg-white/95 shadow-[0_-8px_32px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-shadow duration-300 dark:border-gray-800 dark:bg-gray-900/95">
        <div
          className={cn(
            "mx-auto grid w-full max-w-lg touch-manipulation",
            "grid-cols-5",
            "px-1 pt-1.5",
            "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
          )}
        >
          {CLIENT_MOBILE_NAV.map((item) => {
            const Icon = item.icon;

            const itemClass = cn(
              "group relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-colors duration-300 ease-out",
              "outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900",
            );

            if (item.more) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={openMobile}
                  className={itemClass}
                >
                  <div className="relative flex h-9 w-full max-w-[2.75rem] items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 transition-transform duration-300 ease-out active:scale-95">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <span className="max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight text-gray-500 dark:text-gray-400">
                    {item.label}
                  </span>
                </button>
              );
            }

            const href = item.to!;
            const active = isActive(href, item.end);

            return (
              <Link
                key={href}
                to={href}
                className={itemClass}
                aria-current={active ? "page" : undefined}
              >
                <div className="relative flex h-9 w-full max-w-[2.75rem] items-center justify-center rounded-xl transition-all duration-300 ease-out active:scale-95">
                  {active && (
                    <motion.div
                      layoutId="client-mobile-nav-pill"
                      className="absolute inset-0 rounded-xl bg-primary-100/90 dark:bg-primary-900/40"
                      transition={{ type: "spring", stiffness: 440, damping: 38 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      "relative z-10 h-5 w-5 transition-colors duration-300",
                      active ? "text-primary-700" : "text-gray-500 dark:text-gray-400",
                    )}
                    strokeWidth={active ? 2.25 : 1.75}
                    aria-hidden
                  />
                </div>
                <span
                  className={cn(
                    "max-w-full truncate px-0.5 text-center text-[10px] font-semibold leading-tight transition-colors duration-200",
                    active ? "text-primary-800" : "text-gray-500 dark:text-gray-400",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

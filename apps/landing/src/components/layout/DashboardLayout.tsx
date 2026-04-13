import { useEffect, useLayoutEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { ClientSidebar } from "@/components/portal/ClientSidebar";
import { ClientDashboardHeader } from "@/components/portal/ClientDashboardHeader";
import { ClientMobileNav } from "@/components/portal/ClientMobileNav";
import { useClientShellStore } from "@/stores/clientShellStore";
import { useIsMobile } from "@/hooks/useMediaQuery";

const pageEase = [0.22, 1, 0.36, 1] as const;

export function DashboardLayout() {
  const isCollapsed = useClientShellStore((s) => s.isCollapsed);
  const closeMobile = useClientShellStore((s) => s.closeMobile);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { pathname } = location;
  const hasEnteredShell = useRef(false);

  useEffect(() => {
    hasEnteredShell.current = true;
  }, []);

  /** Close mobile drawer on any in-app navigation (key changes every time). Sidebar NavLink onClick is not reliable alone. */
  useLayoutEffect(() => {
    if (!isMobile) return;
    closeMobile();
  }, [location.key, isMobile, closeMobile]);

  return (
    <div className="min-h-screen bg-gray-50/80">
      <ClientSidebar />

      <div
        className={cn(
          "min-h-screen transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          !isMobile && (isCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"),
        )}
      >
        <ClientDashboardHeader />
        <main
          className={cn(
            "px-3 pt-3 sm:px-4 sm:pt-4",
            "pb-[calc(env(safe-area-inset-bottom)+4.25rem)] lg:pb-6",
            "lg:px-6 lg:pt-5",
          )}
        >
          <motion.div
            key={pathname}
            initial={
              hasEnteredShell.current
                ? { opacity: 0, y: 10 }
                : { opacity: 1, y: 0 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: pageEase }}
            className="mx-auto max-w-6xl space-y-4 sm:space-y-5 lg:space-y-6"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {isMobile && <ClientMobileNav />}
    </div>
  );
}

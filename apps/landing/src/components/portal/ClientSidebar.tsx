import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { CLIENT_NAV_GROUPS } from "@/config/clientDashboardNav";
import { useClientShellStore } from "@/stores/clientShellStore";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { usePortalAuthStore } from "@/stores/portalAuthStore";
import { Avatar } from "@/components/ui/Avatar";
import { paths } from "@/routes/paths";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export function ClientSidebar() {
  const isMobile = useIsMobile();
  const isCollapsed = useClientShellStore((s) => s.isCollapsed);
  const isMobileOpen = useClientShellStore((s) => s.isMobileOpen);
  const toggle = useClientShellStore((s) => s.toggle);
  const closeMobile = useClientShellStore((s) => s.closeMobile);
  const user = usePortalAuthStore((s) => s.user);

  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalEl(document.body);
  }, []);

  useBodyScrollLock(isMobile && isMobileOpen);

  /** Viewport crossed to desktop: mobile drawer unmounts; clear store so it cannot reopen stuck. */
  useEffect(() => {
    if (!isMobile) closeMobile();
  }, [isMobile, closeMobile]);

  /** Desktop collapsed rail only — never on mobile drawer (would hide labels). */
  const desktopCollapsed = !isMobile && isCollapsed;

  const sidebarInner = (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-gray-900">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200/80 dark:border-gray-800 px-4 lg:h-16">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white transition-transform duration-300 ease-out hover:scale-[1.03]">
          P
        </div>
        {!desktopCollapsed && (
          <span className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
            Portal
          </span>
        )}
        {isMobile && (
          <button
            type="button"
            onClick={() => closeMobile()}
            className="relative z-10 ml-auto rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-400"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav
        className="min-h-0 flex-1 overflow-y-auto overflow-x-visible px-3 py-3 [scrollbar-width:thin]"
        aria-label="Client portal"
      >
        {CLIENT_NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            {!desktopCollapsed && (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={desktopCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm transition-all duration-300 ease-out",
                        isActive
                          ? "bg-primary-50/90 font-medium text-primary-800 dark:bg-primary-950/40 dark:text-primary-300"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
                        !isActive &&
                          !desktopCollapsed &&
                          "hover:translate-x-0.5",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive ? "text-primary-700" : "",
                          )}
                          strokeWidth={isActive ? 2.25 : 1.75}
                        />
                        {!desktopCollapsed && <span>{item.label}</span>}
                        {desktopCollapsed && (
                          <span className="pointer-events-none invisible absolute left-full z-50 ml-2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                            {item.label}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-gray-100 dark:border-gray-800">
        {user && (
          <Link
            to={paths.dashboardProfile}
            className={cn(
              "flex items-center gap-2.5 p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
              desktopCollapsed && "justify-center",
            )}
          >
            <Avatar name={user.fullName} src={user.avatarUrl} size="sm" />
            {!desktopCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.fullName}
                </p>
                <p className="truncate text-xs text-gray-400">{user.email}</p>
              </div>
            )}
          </Link>
        )}
        {!isMobile && (
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "flex w-full items-center gap-2 border-t border-gray-100 py-2.5 text-xs text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-300",
              isCollapsed ? "justify-center px-0" : "px-4",
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    if (!portalEl) return null;

    return createPortal(
      <AnimatePresence>
        {isMobileOpen && (
          <div
            key="client-sidebar-portal-root"
            className="fixed inset-0 z-[260] isolate"
            role="presentation"
          >
            <motion.div
              key="client-sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-0 cursor-pointer touch-manipulation bg-black/35 backdrop-blur-[2px]"
              aria-hidden
              onPointerDown={() => closeMobile()}
            />
            <motion.aside
              key="client-sidebar-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 36, stiffness: 380 }}
              className="absolute inset-y-0 left-0 z-10 flex h-full w-[260px] min-h-0 flex-col bg-white shadow-2xl dark:bg-gray-900"
            >
              {sidebarInner}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>,
      portalEl,
    );
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden min-h-0 border-r border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block",
        isCollapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {sidebarInner}
    </aside>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  Globe,
  LifeBuoy,
  Menu,
  Receipt,
  Settings,
  ShoppingBag,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { paths } from "@/routes/paths";
import { useClientShellStore } from "@/stores/clientShellStore";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { usePortalLogout } from "@/api/portal-auth";
import { usePortalAuthStore } from "@/stores/portalAuthStore";
import { useCartStore } from "@/stores/cartStore";
import {
  usePortalNotifications,
  useMarkNotificationsRead,
} from "@/api/portal-notifications";
import { Avatar } from "@/components/ui/Avatar";
import { CartFlyout } from "@/components/portal/CartFlyout";
import { toast } from "sonner";
import { formatDateShort } from "@/lib/format";

const easeOut = [0.22, 1, 0.36, 1] as const;
const dropdownTransition = { duration: 0.22, ease: easeOut };

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, enabled, onOutside]);
}

export function ClientDashboardHeader() {
  const isMobile = useIsMobile();
  const openMobile = useClientShellStore((s) => s.openMobile);
  const user = usePortalAuthStore((s) => s.user);
  const logout = usePortalLogout();
  const cartLines = useCartStore((s) => s.lines);
  const cartCount = cartLines.reduce((n, l) => n + l.quantity, 0);

  const { data: notifData } = usePortalNotifications(1, 12);
  const markRead = useMarkNotificationsRead();

  const [cartOpen, setCartOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const closeCart = useCallback(() => setCartOpen(false), []);
  const closeNotif = useCallback(() => setNotifOpen(false), []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useClickOutside(cartRef, closeCart, cartOpen);
  useClickOutside(notifRef, closeNotif, notifOpen);
  useClickOutside(profileRef, closeProfile, profileOpen);

  const unread = notifData?.unreadCount ?? 0;
  const items = notifData?.items ?? [];

  const handleLogout = async () => {
    setProfileOpen(false);
    try {
      await logout.mutateAsync();
      toast.success("Signed out");
    } catch {
      toast.success("Signed out");
    }
  };

  const markAllRead = async () => {
    try {
      await markRead.mutateAsync({ all: true });
    } catch {
      /* ignore */
    }
  };

  const resolveNotifTo = (link: string | null | undefined) => {
    if (!link) return null;
    if (link === "/portal") return paths.dashboard;
    return link;
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-[35] border-b border-gray-200/80 bg-white/90 backdrop-blur-md transition-[box-shadow,background-color] duration-300 ease-out",
        scrolled && "shadow-sm shadow-gray-900/5",
      )}
    >
      <div className="flex h-14 items-center gap-1 px-2 sm:gap-2 sm:px-3 lg:h-16 lg:px-5">
        {isMobile && (
          <button
            type="button"
            onClick={openMobile}
            className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-xl p-2 text-gray-500 transition-all duration-300 ease-out hover:bg-gray-100/90 hover:text-gray-800 active:scale-[0.96] touch-manipulation"
            aria-label="Menu"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
        )}

        <div className="flex-1" aria-hidden />

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <div className="relative" ref={cartRef}>
            <button
              type="button"
              onClick={() => {
                setCartOpen((v) => !v);
                setNotifOpen(false);
                setProfileOpen(false);
              }}
              className={cn(
                "relative inline-flex h-11 min-w-[44px] items-center justify-center rounded-xl p-2 transition-all duration-300 ease-out hover:bg-gray-100/90 hover:text-gray-800 active:scale-[0.96] touch-manipulation",
                cartOpen ? "bg-gray-100/90 text-gray-800" : "text-gray-500",
              )}
              aria-label="Cart"
              aria-expanded={cartOpen}
            >
              <ShoppingBag className="h-[18px] w-[18px] sm:h-5 sm:w-5 transition-transform duration-300" />
              {cartCount > 0 && (
                <motion.span
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white shadow-sm"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </motion.span>
              )}
            </button>
            <CartFlyout open={cartOpen} onClose={closeCart} />
          </div>

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((v) => !v);
                setProfileOpen(false);
              }}
              className={cn(
                "relative inline-flex h-11 min-w-[44px] items-center justify-center rounded-xl p-2 transition-all duration-300 ease-out hover:bg-gray-100/90 hover:text-gray-800 active:scale-[0.96] touch-manipulation",
                notifOpen
                  ? "bg-gray-100/90 text-gray-800"
                  : "text-gray-500",
              )}
              aria-label="Notifications"
              aria-expanded={notifOpen}
            >
              <Bell className="h-[18px] w-[18px] transition-transform duration-300 sm:h-5 sm:w-5" />
              {unread > 0 && (
                <motion.span
                  layout
                  className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                >
                  {unread > 99 ? "99+" : unread}
                </motion.span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={dropdownTransition}
                  style={{ transformOrigin: "top right" }}
                  className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-gray-200/90 bg-white/95 py-2 shadow-lg shadow-gray-900/10 ring-1 ring-black/5 backdrop-blur-md"
                >
                <div className="flex items-center justify-between border-b border-gray-100/80 px-3 pb-2">
                  <span className="text-xs font-semibold text-gray-900">
                    Alerts
                  </span>
                  {unread > 0 && (
                    <button
                      type="button"
                      onClick={() => void markAllRead()}
                      className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-primary-600 transition-colors duration-200 hover:bg-primary-50 hover:text-primary-800"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
                  {!items.length ? (
                    <p className="px-3 py-6 text-center text-xs text-gray-500">
                      None yet
                    </p>
                  ) : (
                    items.map((n) => {
                      const to = resolveNotifTo(n.link ?? undefined);
                      const ext = to?.startsWith("http");
                      const body = (
                        <>
                          <p className="text-xs font-medium text-gray-900">
                            {n.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-600">
                            {n.message}
                          </p>
                          <p className="mt-1 text-[10px] text-gray-400">
                            {formatDateShort(n.createdAt)}
                          </p>
                        </>
                      );
                      return (
                        <div
                          key={n.id}
                          className={cn(
                            "border-b border-gray-50/90 px-3 py-2.5 transition-colors duration-200 last:border-0",
                            !n.read && "bg-primary-50/50",
                          )}
                        >
                          {to && !ext ? (
                            <Link
                              to={to}
                              onClick={() => setNotifOpen(false)}
                              className="block text-left transition-opacity duration-200 hover:opacity-80"
                            >
                              {body}
                            </Link>
                          ) : to && ext ? (
                            <a
                              href={to}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setNotifOpen(false)}
                              className="block text-left transition-opacity duration-200 hover:opacity-80"
                            >
                              {body}
                            </a>
                          ) : (
                            <div className="text-left">{body}</div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/"
            className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-xl p-2 text-gray-500 transition-all duration-300 ease-out hover:bg-gray-100/90 hover:text-gray-800 active:scale-[0.96] touch-manipulation"
            aria-label="Site"
          >
            <Globe className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
          </Link>

          <div className="relative pl-0.5" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((v) => !v);
                setNotifOpen(false);
              }}
              className={cn(
                "flex items-center gap-1 rounded-full p-1 pr-1.5 transition-all duration-300 ease-out hover:bg-gray-100/90 active:scale-[0.98]",
                profileOpen && "bg-gray-100/90 ring-2 ring-primary-500/15",
              )}
              aria-label="Account"
              aria-expanded={profileOpen}
            >
              <Avatar name={user?.fullName} src={user?.avatarUrl} size="sm" />
              <ChevronDown
                className={cn(
                  "hidden h-4 w-4 text-gray-400 transition-transform duration-300 ease-out sm:block",
                  profileOpen && "rotate-180",
                )}
              />
            </button>
            <AnimatePresence>
              {profileOpen && user && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={dropdownTransition}
                  style={{ transformOrigin: "top right" }}
                  className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-gray-200/90 bg-white/95 py-1.5 shadow-lg shadow-gray-900/10 ring-1 ring-black/5 backdrop-blur-md"
                >
                <div className="border-b border-gray-100/80 px-3 py-2">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user.fullName}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
                <Link
                  to={paths.dashboardProfile}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50/90"
                >
                  <User className="h-4 w-4 shrink-0 text-gray-400" />
                  Profile
                </Link>
                <Link
                  to={paths.dashboardSettings}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50/90"
                >
                  <Settings className="h-4 w-4 shrink-0 text-gray-400" />
                  Settings
                </Link>
                <Link
                  to={paths.dashboardBilling}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50/90"
                >
                  <Receipt className="h-4 w-4 shrink-0 text-gray-400" />
                  Billing
                </Link>
                <Link
                  to={paths.dashboardSupport}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50/90"
                >
                  <LifeBuoy className="h-4 w-4 shrink-0 text-gray-400" />
                  Support
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={logout.isPending}
                  className="flex w-full items-center gap-2 border-t border-gray-100/80 px-3 py-2 text-left text-sm text-red-600 transition-colors duration-200 hover:bg-red-50/90 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Sign out
                </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

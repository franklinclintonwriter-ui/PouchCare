import { useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { useSidebarStore } from "@/store/sidebarStore";
import { useAuthStore } from "@/store/authStore";
import { usePermission } from "@/hooks/usePermission";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { Avatar } from "@/components/ui/Avatar";
import api from "@/api/client";
import type { StaffUser } from "@/types/auth";
import {
  LayoutDashboard,
  CheckSquare,
  ListChecks,
  FolderKanban,
  Users,
  Clock,
  CalendarOff,
  FileText,
  DollarSign,
  BarChart3,
  Target,
  Globe,
  Server,
  MonitorSmartphone,
  Megaphone,
  HeadphonesIcon,
  BellRing,
  UserPlus,
  Receipt,
  CreditCard,
  Building2,
  ChevronDown,
  X,
  LogOut,
  Wallet,
  Users2,
  Star,
  ShoppingCart,
  Package,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  Puzzle,
  Cctv,
  Wrench,
  Trophy,
  Cpu,
  Brain,
  MessageSquare,
  Crown,
  FolderCode,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: { label: string; href: string; permission?: () => boolean }[];
  permission?: () => boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function Sidebar() {
  const { isCollapsed, isMobileOpen, closeMobile, toggle } = useSidebarStore();
  const { user, userType, logout } = useAuthStore();
  const location = useLocation();
  const perm = usePermission();
  const isMobile = useIsMobile();

  const staffUser = userType === "staff" ? (user as StaffUser) : null;

  const handleLogout = useCallback(async () => {
    try {
      const endpoint =
        userType === "portal" ? "/portal/logout" : "/auth/logout";
      await api.post(endpoint);
    } catch {
      // ignore server errors — still log out locally
    } finally {
      logout();
    }
  }, [userType, logout]);

  const staffNav: NavGroup[] = [
    {
      label: "Overview",
      items: [{ label: "Dashboard", icon: LayoutDashboard, href: "/" }],
    },
    {
      label: "Work",
      items: [
        { label: "Tasks", icon: CheckSquare, href: "/tasks" },
        { label: "My Tasks", icon: ListChecks, href: "/tasks/mine" },
        { label: "Projects", icon: FolderKanban, href: "/projects" },
        { label: "Daily Reports", icon: FileText, href: "/reports" },
      ],
    },
    {
      label: "HR",
      items: [
        { label: "Shoulder Directory", icon: Users, href: "/staff" },
        { label: "Leaderboard", icon: Trophy, href: "/staff/leaderboard" },
        {
          label: "Branches",
          icon: Building2,
          href: "/staff/branches",
          permission: () => perm.can("staff.branches"),
        },
        { label: "Attendance", icon: Clock, href: "/attendance" },
        { label: "Leave", icon: CalendarOff, href: "/leave" },
        {
          label: "Salary Management",
          icon: DollarSign,
          href: "/payroll",
          permission: () => perm.can("payroll.access"),
        },
        {
          label: "Performance",
          icon: Star,
          href: "/performance",
          permission: () => perm.can("hr.performance"),
        },
        {
          label: "Recruitment",
          icon: UserPlus,
          children: [
            { label: "Positions", href: "/hr/positions" },
            { label: "Applications", href: "/hr/applications" },
            { label: "Analytics", href: "/hr/analytics" },
          ],
          permission: () => perm.can("hr.recruitment"),
        },
      ],
    },
    {
      label: "Business",
      items: [
        {
          label: "Finance",
          icon: Receipt,
          children: [
            { label: "Invoices", href: "/finance/invoices" },
            { label: "Expenses", href: "/finance/expenses" },
            { label: "Revenue", href: "/finance/revenue" },
            { label: "Forecast", href: "/finance/forecast" },
            {
              label: "Exchange Rates",
              href: "/finance/exchange-rates",
              permission: () => perm.can("finance.exchange_rates"),
            },
          ],
          permission: () => perm.can("finance.access"),
        },
        {
          label: "CRM",
          icon: Target,
          permission: () => perm.isManager,
          children: [
            { label: "Leads", href: "/crm/leads" },
            { label: "Pipeline", href: "/crm/pipeline" },
            { label: "Sales Orders", href: "/crm/orders" },
            {
              label: "Client Accounts",
              href: "/crm/clients",
              permission: () => perm.can("crm.client_accounts"),
            },
          ],
        },
      ],
    },
    // Internal inventory + ops (/v1/assets/*, staff auth). Not the client portal “my domains / hosting” on the landing app (/v1/portal/*).
    {
      label: "Assets & Services",
      items: [
        { label: "Domains", icon: Globe, href: "/assets/domains" },
        { label: "Servers", icon: Server, href: "/assets/servers" },
        {
          label: "Websites",
          icon: MonitorSmartphone,
          href: "/assets/websites",
        },
        {
          label: "Monitor",
          icon: Cctv,
          href: "/monitor",
          permission: () => perm.can("monitor.view"),
        },
        {
          label: "Devices",
          icon: Cpu,
          href: "/assets/devices",
          permission: () => perm.can("assets.devices"),
        },
        { label: "Services", icon: Package, href: "/services" },
        { label: "Plugins", icon: Puzzle, href: "/plugins" },
      ],
    },
    {
      label: "Communication",
      items: [
        { label: "Inbox", icon: Mail, href: "/inbox" },
        { label: "Support", icon: HeadphonesIcon, href: "/support" },
        {
          label: "Broadcast",
          icon: Megaphone,
          href: "/broadcast",
          permission: () => perm.can("broadcast.access"),
        },
        { label: "Notifications", icon: BellRing, href: "/notifications" },
        { label: "File Manager", icon: FolderCode, href: "/files" },
      ],
    },
    {
      label: "Analytics",
      items: [
        {
          label: "Analytics",
          icon: BarChart3,
          href: "/analytics",
          permission: () => perm.can("analytics.access"),
        },
      ],
    },
    {
      label: "Marketing",
      items: [{ label: "Tools", icon: Wrench, href: "/tools" }],
    },
    {
      label: "AI Assistant",
      items: [
        { label: "AI Hub", icon: Brain, href: "/ai" },
        {
          label: "AI Tools",
          icon: Brain,
          children: [
            { label: "Blog Writer", href: "/ai/blog" },
            { label: "SEO Brief", href: "/ai/seo-brief" },
            { label: "Task Planner", href: "/ai/task-planner" },
            { label: "Report Drafter", href: "/ai/report" },
          ],
        },
        { label: "Chat", icon: MessageSquare, href: "/ai/chat" },
        {
          label: "Executive AI",
          icon: Crown,
          href: "/ai/executive",
          permission: () => perm.isCEO,
        },
        {
          label: "Workspaces",
          icon: FolderCode,
          href: "/ai/workspace",
          permission: () => perm.isCEO,
        },
      ],
    },
    {
      label: "Admin",
      items: [
        {
          label: "Admin Panel",
          icon: LayoutDashboard,
          children: [
            {
              label: "Overview",
              href: "/admin",
              permission: () => perm.can("admin.overview.read"),
            },
            {
              label: "Clients",
              href: "/admin/clients",
              permission: () => perm.can("admin.clients.read"),
            },
            {
              label: "Orders",
              href: "/admin/orders",
              permission: () => perm.can("admin.orders.read"),
            },
            {
              label: "Services",
              href: "/admin/services",
              permission: () => perm.can("admin.services.read"),
            },
            {
              label: "Invoices",
              href: "/admin/billing/invoices",
              permission: () => perm.can("admin.billing.read"),
            },
            {
              label: "Deposits",
              href: "/admin/billing/deposits",
              permission: () => perm.can("admin.billing.read"),
            },
            {
              label: "Payouts",
              href: "/admin/billing/payouts",
              permission: () => perm.can("admin.billing.read"),
            },
            {
              label: "Commissions",
              href: "/admin/billing/commissions",
              permission: () => perm.can("admin.billing.read"),
            },
            {
              label: "Support",
              href: "/admin/support",
              permission: () => perm.can("admin.support.read"),
            },
            {
              label: "Broadcast",
              href: "/admin/broadcast",
              permission: () => perm.can("admin.broadcast.write"),
            },
            {
              label: "Audit Log",
              href: "/admin/settings/audit",
              permission: () => perm.can("admin.audit.read"),
            },
          ],
          permission: () =>
            perm.can("admin.overview.read") ||
            perm.can("admin.clients.read") ||
            perm.can("admin.orders.read") ||
            perm.can("admin.services.read") ||
            perm.can("admin.billing.read") ||
            perm.can("admin.support.read") ||
            perm.can("admin.broadcast.write") ||
            perm.can("admin.audit.read"),
        },
        {
          label: "Portal",
          icon: Building2,
          children: [
            { label: "Members", href: "/admin/portal/members" },
            { label: "Orders", href: "/admin/portal/orders" },
            { label: "Commissions", href: "/admin/portal/commissions" },
            { label: "Payouts", href: "/admin/portal/payouts" },
            { label: "Deposits", href: "/admin/portal/deposits" },
            { label: "Referral Fraud", href: "/admin/portal/referrals/fraud" },
          ],
          permission: () => perm.can("admin_portal.access"),
        },
      ],
    },
    {
      label: "Settings",
      items: [
        {
          label: "Settings",
          icon: Settings,
          children: [
            { label: "Profile", href: "/settings/profile" },
            { label: "Security", href: "/settings/security" },
            { label: "Preferences", href: "/settings/preferences" },
            {
              label: "Role Permissions",
              href: "/settings/role-permissions",
              permission: () => perm.can("settings.role_permissions"),
            },
            {
              label: "System Config",
              href: "/settings/system",
              permission: () => perm.can("settings.role_permissions"),
            },
            {
              label: "API Keys",
              href: "/settings/api-keys",
              permission: () => perm.can("settings.role_permissions"),
            },
          ],
        },
      ],
    },
  ];

  const portalNav: NavGroup[] = [
    {
      label: "Main",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, href: "/portal" },
        { label: "Services", icon: ShoppingCart, href: "/portal/order" },
        { label: "My Orders", icon: Package, href: "/portal/orders" },
        { label: "Wallet", icon: Wallet, href: "/portal/wallet" },
        { label: "Referrals", icon: Users2, href: "/portal/referrals" },
        { label: "Commissions", icon: CreditCard, href: "/portal/commissions" },
        { label: "Support", icon: HeadphonesIcon, href: "/portal/support" },
      ],
    },
  ];

  const navGroups = userType === "portal" ? portalNav : staffNav;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-gray-200/80 px-3 dark:border-gray-700/60">
        {isCollapsed && !isMobile ? (
          /* Collapsed: show icon mark only */
          <div className="flex w-full items-center justify-center">
            <img
              src="/pouchcare-logo.png"
              alt="PouchCare"
              className="h-7 w-7 rounded-md object-contain"
              style={{ objectPosition: 'left center' }}
            />
          </div>
        ) : (
          /* Expanded: full logo */
          <Link
            to="/"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 transition-opacity hover:opacity-85"
          >
            <img
              src="/pouchcare-logo.png"
              alt="PouchCare"
              className="h-8 w-auto object-contain"
              style={{ maxWidth: '140px' }}
            />
          </Link>
        )}
        {isMobile && (
          <button
            onClick={closeMobile}
            aria-label="Close menu"
            className="ml-auto shrink-0 rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.permission || item.permission(),
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-4">
              {!isCollapsed && (
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavItemComponent
                    key={item.label}
                    item={item}
                    isCollapsed={isCollapsed}
                    currentPath={location.pathname}
                    onNavigate={isMobile ? closeMobile : undefined}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User profile + collapse toggle */}
      <div className="border-t border-gray-100 dark:border-gray-700/60">
        {user && (
          <div
            className={cn(
              "flex items-center gap-2.5 p-3",
              isCollapsed && "justify-center",
            )}
          >
            <Avatar
              name={
                staffUser?.name ||
                (user as { fullName?: string }).fullName ||
                ""
              }
              src={(user as { avatarUrl?: string }).avatarUrl}
              size="sm"
            />
            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {staffUser?.name ||
                      (user as { fullName?: string }).fullName}
                  </p>
                  <p className="truncate text-xs text-gray-400">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  aria-label="Sign out"
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        )}
        {!isMobile && (
          <button
            onClick={toggle}
            className={cn(
              "flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2.5 text-xs text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 dark:border-gray-700/40 dark:hover:bg-gray-800/60 dark:hover:text-gray-300",
              isCollapsed && "justify-center px-0",
            )}
          >
            {isCollapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
            {!isCollapsed && <span>Collapse</span>}
          </button>
        )}
      </div>
    </div>
  );

  // Mobile: overlay
  if (isMobile) {
    return (
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="no-print fixed inset-0 z-[45] bg-black/30 backdrop-blur-[2px]"
              onClick={closeMobile}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="no-print fixed inset-y-0 left-0 z-50 w-[260px] bg-white shadow-2xl dark:bg-gray-900"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: fixed
  return (
    <aside
      className={cn(
        "no-print fixed inset-y-0 left-0 z-30 hidden border-r border-gray-200/80 bg-white transition-all duration-200 lg:block",
        "dark:border-gray-700/60 dark:bg-gray-900",
        isCollapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {sidebarContent}
    </aside>
  );
}

function NavItemComponent({
  item,
  isCollapsed,
  currentPath,
  onNavigate,
}: {
  item: NavItem;
  isCollapsed: boolean;
  currentPath: string;
  onNavigate?: () => void;
}) {
  const visibleChildren =
    item.children?.filter((child) => !child.permission || child.permission()) ??
    [];
  const [isExpanded, setIsExpanded] = useState(
    visibleChildren.some((c) => currentPath.startsWith(c.href)),
  );

  const isActive = item.href
    ? item.href === "/" || item.href === "/portal"
      ? currentPath === item.href
      : currentPath === item.href || currentPath.startsWith(item.href + "/")
    : false;
  const isChildActive = visibleChildren.some((c) =>
    currentPath.startsWith(c.href),
  );
  const Icon = item.icon;

  if (visibleChildren.length > 0) {
    // Collapsed: show popover on hover with child links
    if (isCollapsed) {
      return (
        <div className="group relative">
          <button
            className={cn(
              "flex w-full items-center justify-center rounded-lg px-2.5 py-2.5 text-sm transition-colors",
              isChildActive
                ? "bg-primary-50/80 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-200",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
          </button>
          <div className="invisible absolute left-full top-0 z-50 ml-2 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1.5 opacity-0 shadow-elevated transition-all group-hover:visible group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {item.label}
            </p>
            {visibleChildren.map((child) => (
              <Link
                key={child.href}
                to={child.href}
                onClick={onNavigate}
                className={cn(
                  "block px-3 py-2 text-xs font-medium transition-colors",
                  currentPath.startsWith(child.href)
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/40",
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    // Expanded sidebar: normal accordion
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm transition-colors",
            isChildActive
              ? "bg-primary-50/80 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-200",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
          />
        </button>
        {isExpanded && (
          <div className="ml-5 mt-0.5 space-y-0.5 border-l border-gray-100 pl-3 dark:border-gray-700/40">
            {visibleChildren.map((child) => (
              <Link
                key={child.href}
                to={child.href}
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                  currentPath.startsWith(child.href)
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/40",
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.href!}
      onClick={onNavigate}
      title={isCollapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm transition-colors",
        isActive
          ? "bg-primary-50/80 font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!isCollapsed && <span className="truncate">{item.label}</span>}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary-600 dark:bg-primary-400" />
      )}
    </Link>
  );
}

export { Sidebar };

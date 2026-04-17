import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Menu,
  Package,
  Wallet,
  Users,
  Briefcase,
  User,
  LifeBuoy,
  ShoppingCart,
  Receipt,
  Settings,
  Globe2,
  Globe,
  Smartphone,
  FileText,
} from "lucide-react";
import { paths } from "@/routes/paths";

export interface ClientNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface ClientNavGroup {
  label: string;
  items: ClientNavItem[];
}

export const CLIENT_NAV_GROUPS: ClientNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        to: paths.dashboard,
        label: "Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      { to: paths.dashboardOrders, label: "Orders", icon: Package },
      { to: paths.dashboardCart, label: "Cart", icon: ShoppingCart },
      { to: paths.dashboardServices, label: "Services", icon: Briefcase },
      { to: paths.dashboardWallet, label: "Wallet", icon: Wallet },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { to: paths.dashboardHosting, label: "Domain hosting", icon: Globe2 },
      { to: paths.dashboardWebsites, label: "My Websites", icon: Globe },
      { to: paths.dashboardWebToApk, label: "Web → APK", icon: Smartphone },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: paths.dashboardBilling, label: "Billing", icon: Receipt },
      { to: paths.dashboardInvoices, label: "Invoices", icon: FileText },
    ],
  },
  {
    label: "Growth",
    items: [{ to: paths.dashboardReferrals, label: "Referrals", icon: Users }],
  },
  {
    label: "Account",
    items: [
      { to: paths.dashboardProfile, label: "Profile", icon: User },
      { to: paths.dashboardSettings, label: "Settings", icon: Settings },
      { to: paths.dashboardSupport, label: "Support", icon: LifeBuoy },
    ],
  },
];

const TITLE_BY_PATH: Record<string, string> = {
  [paths.dashboard]: "Dashboard",
  [paths.dashboardOrders]: "Orders",
  [paths.dashboardWallet]: "Wallet",
  [paths.dashboardReferrals]: "Referrals",
  [paths.dashboardServices]: "Services",
  [paths.dashboardCart]: "Cart",
  [paths.dashboardBilling]: "Billing",
  [paths.dashboardProfile]: "Profile",
  [paths.dashboardSettings]: "Settings",
  [paths.dashboardSupport]: "Support",
  [paths.dashboardHosting]: "My domains",
  [paths.dashboardHostingRegister]: "Register & search",
  [paths.dashboardWebToApk]: "Web → APK",
  [paths.dashboardInvoices]: "Invoices",
  [paths.dashboardWebsites]: "My Websites",
};

export function getClientDashboardTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard/orders/") && pathname !== "/dashboard/orders") {
    return "Order details";
  }
  if (
    pathname.startsWith("/dashboard/hosting/") &&
    pathname !== paths.dashboardHosting &&
    pathname !== paths.dashboardHostingRegister
  ) {
    return "Domain details";
  }
  if (pathname.startsWith("/dashboard/invoices/") && pathname !== paths.dashboardInvoices) {
    return "Invoice";
  }
  if (pathname.startsWith("/dashboard/websites/") && pathname !== paths.dashboardWebsites) {
    return "Website details";
  }
  return TITLE_BY_PATH[pathname] ?? "Client portal";
}

export interface ClientMobileNavItem {
  label: string;
  icon: LucideIcon;
  end?: boolean;
  to?: string;
  more?: boolean;
}

export const CLIENT_MOBILE_NAV: ClientMobileNavItem[] = [
  {
    to: paths.dashboard,
    label: "Home",
    icon: LayoutDashboard,
    end: true,
  },
  { to: paths.dashboardCart, label: "Cart", icon: ShoppingCart },
  { to: paths.dashboardOrders, label: "Orders", icon: Package },
  { to: paths.dashboardWallet, label: "Wallet", icon: Wallet },
  { label: "More", icon: Menu, more: true },
];

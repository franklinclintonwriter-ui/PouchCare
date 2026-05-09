import {
  LayoutDashboard,
  Globe,
  Receipt,
  UserCircle2,
  Sparkles,
  Plug,
  Settings,
  LifeBuoy,
  Server,
  KeyRound,
} from "lucide-react";

export const customerNav = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Connected Sites", to: "/sites", icon: Server },
  { label: "Licenses", to: "/licenses", icon: KeyRound },
  { label: "Websites", to: "/websites", icon: Globe },
  { label: "Billing", to: "/billing", icon: Receipt },
  { label: "Profile", to: "/profile", icon: UserCircle2 },
  { label: "Subscriptions", to: "/subscriptions", icon: Sparkles },
  { label: "Plugins", to: "/plugins", icon: Plug },
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "Support", to: "/support", icon: LifeBuoy },
];

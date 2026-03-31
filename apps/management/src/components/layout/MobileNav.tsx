import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Bell,
  Menu,
  ShoppingCart,
  Package,
  Wallet,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useSidebarStore } from '@/store/sidebarStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  icon: LucideIcon;
  label: string;
  href?: string;
  badge?: number;
  action?: () => void;
}

function MobileNav() {
  const location = useLocation();
  const { openMobile } = useSidebarStore();
  const { unreadCount } = useNotificationStore();
  const { userType } = useAuthStore();

  const staffItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Home', href: '/' },
    { icon: CheckSquare, label: 'Tasks', href: '/tasks' },
    { icon: FolderKanban, label: 'Projects', href: '/projects' },
    { icon: Bell, label: 'Alerts', href: '/notifications', badge: unreadCount },
    { icon: Menu, label: 'More', action: openMobile },
  ];

  const portalItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Home', href: '/portal' },
    { icon: ShoppingCart, label: 'Order', href: '/portal/order' },
    { icon: Package, label: 'Orders', href: '/portal/orders' },
    { icon: Wallet, label: 'Wallet', href: '/portal/wallet' },
    { icon: Menu, label: 'More', action: openMobile },
  ];

  const items = userType === 'portal' ? portalItems : staffItems;

  function isActive(href?: string) {
    if (!href) return false;
    if (href === '/' || href === '/portal') return location.pathname === href;
    return location.pathname.startsWith(href);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="border-t border-gray-200/60 bg-white/90 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {items.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            if (item.action) {
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="group relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
                >
                  <div className="flex h-8 w-10 items-center justify-center rounded-2xl text-gray-400 transition-colors group-active:scale-90 dark:text-gray-500">
                    <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.href!}
                className="group relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
              >
                <div className="relative flex h-8 w-10 items-center justify-center rounded-2xl transition-all duration-200 group-active:scale-90">
                  {active && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute inset-0 rounded-2xl bg-primary-50 dark:bg-primary-900/30"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'relative z-10 h-[22px] w-[22px] transition-colors duration-200',
                      active
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-400 dark:text-gray-500',
                    )}
                    strokeWidth={active ? 2.2 : 1.8}
                  />

                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 z-20 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white shadow-sm shadow-red-500/30">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={cn(
                    'text-[10px] font-semibold transition-colors duration-200',
                    active
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 dark:text-gray-500',
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

export { MobileNav };

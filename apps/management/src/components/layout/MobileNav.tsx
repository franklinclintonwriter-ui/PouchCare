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
    <nav
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      aria-label="Primary"
    >
      <div className="border-t border-gray-200/70 bg-white/95 shadow-[0_-8px_32px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/95 dark:shadow-[0_-8px_32px_-12px_rgba(0,0,0,0.45)]">
        {/* Equal columns — avoids uneven gaps from justify-around with 5 items */}
        <div
          className={cn(
            'mx-auto grid w-full max-w-lg touch-manipulation',
            'grid-cols-5',
            'px-1 pt-1.5',
            'pb-[max(0.5rem,env(safe-area-inset-bottom))]',
          )}
        >
          {items.map((item) => {
            const active = item.href ? isActive(item.href) : false;
            const Icon = item.icon;

            const itemClass = cn(
              'group relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-colors',
              'outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950',
            );

            if (item.action) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className={itemClass}
                >
                  <div className="relative flex h-9 w-full max-w-[2.75rem] items-center justify-center rounded-xl text-gray-500 transition-transform active:scale-95 dark:text-gray-400">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <span className="max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight text-gray-500 dark:text-gray-400">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.href!}
                className={itemClass}
                aria-current={active ? 'page' : undefined}
              >
                <div className="relative flex h-9 w-full max-w-[2.75rem] items-center justify-center rounded-xl transition-all duration-200 active:scale-95">
                  {active && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute inset-0 rounded-xl bg-primary-100/90 dark:bg-primary-900/35"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'relative z-10 h-5 w-5 transition-colors duration-200',
                      active
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400',
                    )}
                    strokeWidth={active ? 2.25 : 1.75}
                    aria-hidden
                  />

                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white shadow-sm ring-2 ring-white dark:ring-gray-950">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={cn(
                    'max-w-full truncate px-0.5 text-center text-[10px] font-semibold leading-tight transition-colors duration-200',
                    active
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-gray-500 dark:text-gray-400',
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

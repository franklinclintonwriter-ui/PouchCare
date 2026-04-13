import { Outlet } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useSidebarStore } from '@/store/sidebarStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useCurrency } from '@/hooks/useCurrency';
import { Header } from './Header';
import { NotificationBridge } from './NotificationBridge';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

function AppLayout() {
  useCurrency();
  const { isCollapsed } = useSidebarStore();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50/70 print:bg-white dark:bg-gray-950">
      <Sidebar />

      <div
        className={cn(
          'transition-all duration-200 print:!pl-0',
          !isMobile && (isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'),
        )}
      >
        <Header />
        <div className="no-print">
          <NotificationBridge />
        </div>

        <main className="px-4 pb-[calc(env(safe-area-inset-bottom)+4.25rem)] pt-4 print:px-4 print:pb-6 print:pt-2 lg:px-6 lg:pb-6 lg:pt-5">
          <div className="content-shell space-y-4 lg:space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {isMobile && (
        <div className="no-print">
          <MobileNav />
        </div>
      )}
    </div>
  );
}

export { AppLayout };

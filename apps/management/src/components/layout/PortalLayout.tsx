import { Outlet } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useSidebarStore } from '@/store/sidebarStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

function PortalLayout() {
  const { isCollapsed } = useSidebarStore();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50/70 dark:bg-gray-950">
      <Sidebar />

      <div
        className={cn(
          'transition-all duration-200',
          !isMobile && (isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'),
        )}
      >
        <Header />

        <main className="px-4 pb-20 pt-5 lg:px-6 lg:pb-6 lg:pt-6">
          <div className="content-shell max-w-5xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {isMobile && <MobileNav />}
    </div>
  );
}

export { PortalLayout };

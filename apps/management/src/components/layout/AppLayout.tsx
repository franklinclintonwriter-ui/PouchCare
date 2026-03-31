import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MainHeader } from './MainHeader'
import { SlideOver } from '@/components/ui/SlideOver'
import { ToastStack } from '@/components/ui/Toast'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const { sidebarCollapsed } = useUiStore()
  return (
    <div className="min-h-screen bg-midnight">
      <Sidebar />
      <MainHeader />
      <main className={cn('pt-16 min-h-screen transition-all duration-200', sidebarCollapsed ? 'pl-16' : 'pl-60')}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
      <SlideOver />
      <ToastStack />
    </div>
  )
}

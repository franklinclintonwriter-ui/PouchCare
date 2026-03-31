import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MainHeader } from './MainHeader'
import { SlideOver } from '@/components/ui/SlideOver'
import { ToastStack } from '@/components/ui/Toast'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-midnight">
      <Sidebar />
      <MainHeader />
      <main className="pl-56 pt-16 min-h-screen">
        <div className="p-6 max-w-5xl">
          <Outlet />
        </div>
      </main>
      <SlideOver />
      <ToastStack />
    </div>
  )
}

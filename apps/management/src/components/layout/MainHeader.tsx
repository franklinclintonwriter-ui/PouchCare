import { useUiStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

export function MainHeader() {
  const { sidebarCollapsed, toggleSidebar, setCommandPalette, pageTitle, pageSubtitle, pageActions } = useUiStore()
  const { user } = useAuthStore()

  return (
    <header className={cn(
      'fixed top-0 right-0 h-16 bg-midnight-card/95 backdrop-blur border-b border-midnight-border z-20 flex items-center gap-4 px-5 transition-all duration-200',
      sidebarCollapsed ? 'left-16' : 'left-60'
    )}>
      <button onClick={toggleSidebar} className="text-text-muted hover:text-text-primary transition-colors p-1 rounded flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
      </button>

      <div className="flex flex-col justify-center flex-shrink-0 min-w-0">
        <h1 className="font-sora font-semibold text-text-primary leading-tight truncate">
          {pageTitle || 'PouchCare'}
        </h1>
        {pageSubtitle && (
          <p className="text-[11px] text-text-muted leading-tight truncate">{pageSubtitle}</p>
        )}
      </div>

      <div className="flex-1" />

      {/* Search / Command Palette trigger */}
      <button onClick={() => setCommandPalette(true)}
        className="hidden md:flex items-center gap-2 bg-midnight rounded-lg border border-midnight-border px-3 py-2 text-sm text-text-muted hover:border-sky-500/40 hover:text-text-secondary transition-all w-48">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-[10px] bg-midnight-border rounded px-1 py-0.5">⌘K</kbd>
      </button>

      {pageActions && <div className="flex items-center gap-2 flex-shrink-0">{pageActions}</div>}

      {/* Notifications */}
      <button className="relative text-text-muted hover:text-text-primary transition-colors p-2 rounded-lg hover:bg-white/5">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-500 text-xs font-bold cursor-pointer hover:bg-sky-500/30 transition-colors">
        {user?.name ? user.name[0].toUpperCase() : 'U'}
      </div>
    </header>
  )
}

import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/types'
import type { SystemRole } from '@/types'

interface NavItem { icon: string; label: string; to: string; roles?: SystemRole[] }

const NAV: NavItem[] = [
  { icon: '⚡', label: 'Command Center', to: '/command-center', roles: ['CEO', 'CO_MD'] },
  { icon: '📊', label: 'Dashboard',      to: '/' },
  { icon: '✅', label: 'Tasks',          to: '/tasks' },
  { icon: '📁', label: 'Projects',       to: '/projects' },
  { icon: '👥', label: 'Staff',          to: '/staff' },
  { icon: '🕐', label: 'Attendance',     to: '/attendance' },
  { icon: '🌴', label: 'Leave',          to: '/leave' },
  { icon: '📝', label: 'Reports',        to: '/reports' },
  { icon: '💰', label: 'Finance',        to: '/finance', roles: ['CEO', 'CO_MD', 'OP_MANAGER'] },
  { icon: '🎯', label: 'CRM / Sales',   to: '/crm' },
  { icon: '🌐', label: 'Portal Admin',   to: '/portal' },
  { icon: '📈', label: 'Analytics',      to: '/analytics' },
  { icon: '🏢', label: 'Assets',         to: '/assets' },
  { icon: '👔', label: 'HR & Jobs',      to: '/hr',     roles: ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER'] },
  { icon: '📣', label: 'Broadcast',      to: '/broadcast', roles: ['CEO', 'CO_MD', 'OP_MANAGER'] },
  { icon: '🎫', label: 'Support',        to: '/support' },
  { icon: '⚙️', label: 'Settings',       to: '/settings' },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const { sidebarCollapsed } = useUiStore()
  const navigate = useNavigate()

  // CEO has unrestricted access — never filter items for CEO/CO_MD
  const isCeoOrComd = user?.role === 'CEO' || user?.role === 'CO_MD'
  const filtered = NAV.filter(item =>
    !item.roles || isCeoOrComd || (user && item.roles.includes(user.role as SystemRole))
  )

  const roleLabel = user?.role ? (ROLE_LABELS[user.role as SystemRole] || user.role) : ''

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-30 flex flex-col bg-midnight-card border-r border-midnight-border transition-all duration-200',
      sidebarCollapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center border-b border-midnight-border px-4 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center font-sora font-bold text-sm text-white flex-shrink-0 shadow-lg">P</div>
        {!sidebarCollapsed && <span className="ml-2.5 font-sora font-bold text-base">Pouch<span className="text-sky-500">Care</span></span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {filtered.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-all duration-150 group',
            isActive
              ? 'bg-sky-500/15 text-sky-500 font-semibold'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
          )}>
            <span className="text-base flex-shrink-0 w-5 text-center">{item.icon}</span>
            {!sidebarCollapsed && <span className="truncate font-inter">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-midnight-border p-3 flex-shrink-0">
        <div className={cn('flex items-center gap-2.5', sidebarCollapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-500 text-xs font-bold flex-shrink-0">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">{user?.name}</p>
              <p className="text-[10px] text-text-muted truncate">{roleLabel}</p>
            </div>
          )}
        </div>
        {!sidebarCollapsed && (
          <button onClick={() => { logout(); navigate('/login') }}
            className="mt-2 w-full text-xs text-text-muted hover:text-red-400 transition-colors py-1 text-left">
            Sign out
          </button>
        )}
      </div>
    </aside>
  )
}

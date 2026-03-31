import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const NAV_STAFF = [
  { icon: '📊', label: 'Dashboard', to: '/' },
  { icon: '✅', label: 'My Tasks', to: '/tasks' },
  { icon: '🕐', label: 'Attendance', to: '/attendance' },
  { icon: '🌴', label: 'Leave', to: '/leave' },
  { icon: '📝', label: 'Daily Report', to: '/reports' },
  { icon: '📈', label: 'My Performance', to: '/performance' },
  { icon: '📣', label: 'Announcements', to: '/announcements' },
  { icon: '🏆', label: 'Leaderboard', to: '/leaderboard' },
  { icon: '👤', label: 'My Profile', to: '/profile' },
]

const NAV_MANAGER = [
  { icon: '📊', label: 'My Dashboard', to: '/' },
  { icon: '🏢', label: 'Branch Overview', to: '/branch-dashboard' },
  { icon: '✅', label: 'My Tasks', to: '/tasks' },
  { icon: '🕐', label: 'Attendance', to: '/attendance' },
  { icon: '🌴', label: 'Leave', to: '/leave' },
  { icon: '📝', label: 'Daily Report', to: '/reports' },
  { icon: '📈', label: 'Performance', to: '/performance' },
  { icon: '📣', label: 'Announcements', to: '/announcements' },
  { icon: '🏆', label: 'Leaderboard', to: '/leaderboard' },
  { icon: '👤', label: 'Profile', to: '/profile' },
]

const MANAGER_ROLES = ['CEO', 'CO_MD', 'OPERATION_MANAGER', 'HR_MANAGER', 'BRANCH_MANAGER']

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isManager = user?.role && MANAGER_ROLES.includes(user.role)
  const nav = isManager ? NAV_MANAGER : NAV_STAFF

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-56 flex flex-col bg-midnight-card border-r border-midnight-border">
      <div className="h-16 flex items-center border-b border-midnight-border px-4 gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">P</div>
        <span className="font-sora font-bold text-base">Pouch<span className="text-sky-500">Care</span></span>
        <span className="ml-auto text-[10px] text-text-muted bg-midnight rounded px-1.5 py-0.5 flex-shrink-0">
          {isManager ? 'Mgr' : 'Staff'}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {nav.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-all ${isActive ? 'bg-sky-500/15 text-sky-500 font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`
          }>
            <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
            <span className="font-inter truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-midnight-border p-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-500 text-xs font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-[10px] text-text-muted truncate">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login') }}
          className="text-xs text-text-muted hover:text-red-400 transition-colors w-full text-left">
          Sign out
        </button>
      </div>
    </aside>
  )
}

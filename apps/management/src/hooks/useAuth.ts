import { useAuthStore } from '@/stores/authStore'
import type { SystemRole } from '@/types'

export function useAuth() {
  const { user, isAuthenticated, logout } = useAuthStore()

  // CEO has full unrestricted access — no role checks needed for CEO
  const isCEO = () => !!user && (user.role === 'CEO' || user.role === 'CO_MD')
  
  const isOps = () => !!user && ['CEO', 'CO_MD', 'OP_MANAGER'].includes(user.role)
  
  const isManager = () => !!user && ['CEO', 'CO_MD', 'OP_MANAGER', 'BRANCH_MANAGER'].includes(user.role)
  
  const isHR = () => !!user && ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER'].includes(user.role)
  
  const hasRole = (...roles: SystemRole[]) => !!user && roles.includes(user.role)

  return { user, isAuthenticated, logout, hasRole, isCEO, isOps, isManager, isHR }
}

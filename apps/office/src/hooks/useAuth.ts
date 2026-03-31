import { useAuthStore } from '@/stores/authStore'
export function useAuth() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const isBranchManager = () => user?.role === 'Branch Manager'
  const isStaff = () => !['CEO','Brother / Co-MD','Operation Manager','HR Manager'].includes(user?.role || '')
  return { user, isAuthenticated, logout, isBranchManager, isStaff }
}

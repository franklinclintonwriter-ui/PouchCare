import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useStaffLogout, usePortalLogout } from '@/api/auth';

export function useAuth() {
  const { user, isAuthenticated, isLoading, userType, logout: clearStore } = useAuthStore();
  const navigate = useNavigate();

  const staffLogout = useStaffLogout();
  const portalLogout = usePortalLogout();

  const logout = async () => {
    try {
      if (userType === 'portal') {
        await portalLogout.mutateAsync();
      } else {
        await staffLogout.mutateAsync();
      }
    } catch {
      clearStore();
    }
    navigate(userType === 'portal' ? '/portal/login' : '/login');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    userType,
    logout,
    isStaff: userType === 'staff',
    isPortal: userType === 'portal',
  };
}

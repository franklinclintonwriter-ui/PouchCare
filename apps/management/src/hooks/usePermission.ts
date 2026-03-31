import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import type { SystemRole } from '@/types/enums';
import type { StaffUser } from '@/types/auth';
import { isCEO, isOps, isManager, isHR, normalizeRole } from '@/utils/permissions';

export function usePermission() {
  const user = useAuthStore((s) => s.user);
  const userType = useAuthStore((s) => s.userType);

  return useMemo(() => {
    if (userType !== 'staff' || !user) {
      return {
        role: null as SystemRole | null,
        isCEO: false,
        isOps: false,
        isManager: false,
        isHR: false,
        isStaff: false,
        isPortal: userType === 'portal',
        hasRole: (_roles: SystemRole[]) => false,
      };
    }

    const role = normalizeRole((user as StaffUser).systemRole ?? (user as { role?: string }).role);

    return {
      role,
      isCEO: isCEO(role),
      isOps: isOps(role),
      isManager: isManager(role),
      isHR: isHR(role),
      isStaff: true,
      isPortal: false,
      hasRole: (roles: SystemRole[]) => !!role && roles.includes(role),
    };
  }, [user, userType]);
}

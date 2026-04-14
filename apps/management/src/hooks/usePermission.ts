import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import type { SystemRole } from '@/types/enums';
import type { StaffUser } from '@/types/auth';
import type { PermissionKey } from '@/constants/permissionKeys';
import { isCEO, isOps, isManager, isHR, isBranchManager, normalizeRole } from '@/utils/permissions';

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
        isBranchManager: false,
        isStaff: false,
        isPortal: userType === 'portal',
        hasRole: (_roles: SystemRole[]) => false,
        can: (_key: PermissionKey) => false,
      };
    }

    const staff = user as StaffUser;
    const role = normalizeRole(staff.systemRole ?? (user as { role?: string }).role);
    const permissions = staff.permissions;

    const can = (key: PermissionKey) => {
      if (!permissions) return false;
      return permissions[key] === true;
    };

    return {
      role,
      isCEO: isCEO(role),
      isOps: isOps(role),
      isManager: isManager(role),
      isHR: isHR(role),
      isBranchManager: isBranchManager(role),
      isStaff: true,
      isPortal: false,
      hasRole: (roles: SystemRole[]) => !!role && roles.includes(role),
      can,
    };
  }, [user, userType]);
}

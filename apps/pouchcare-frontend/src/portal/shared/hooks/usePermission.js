import { useMemo } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { hasPermission, getPermissions } from "../auth/permissions.js";

/**
 * Check whether the current user has a specific permission.
 *
 * @param {string} permission - A Permissions value to check
 * @returns {boolean} True if the current user's role grants the permission
 */
export function usePermission(permission) {
  const { admin, customer } = useAuth();
  const user = admin.user ?? customer.user;
  const role = user?.role;

  return useMemo(() => {
    if (!role) return false;
    return hasPermission(role, permission);
  }, [role, permission]);
}

/**
 * Return all permissions for the current user's role.
 *
 * @returns {string[]} Array of permission strings the current user holds
 */
export function usePermissions() {
  const { admin, customer } = useAuth();
  const user = admin.user ?? customer.user;
  const role = user?.role;

  return useMemo(() => {
    if (!role) return [];
    return getPermissions(role);
  }, [role]);
}

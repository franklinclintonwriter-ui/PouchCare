import { usePermission } from "../hooks/usePermission.js";

/**
 * Conditionally render children based on a permission check.
 *
 * @param {object} props
 * @param {string} props.permission - The permission required to render children
 * @param {import('react').ReactNode} [props.fallback=null] - Content shown when permission is denied
 * @param {import('react').ReactNode} props.children - Content shown when permission is granted
 * @returns {import('react').ReactNode}
 */
export default function PermissionGate({ permission, fallback = null, children }) {
  const allowed = usePermission(permission);
  return allowed ? children : fallback;
}

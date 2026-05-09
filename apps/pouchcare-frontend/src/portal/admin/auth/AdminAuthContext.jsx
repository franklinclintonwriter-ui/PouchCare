/* eslint-disable react-refresh/only-export-components */
// Legacy re-export — delegates to shared auth
export { useAdminAuth } from "../../shared/auth/AuthContext";

// AdminAuthProvider is no longer needed — use AuthProvider from shared
export function AdminAuthProvider({ children }) {
  return children;
}

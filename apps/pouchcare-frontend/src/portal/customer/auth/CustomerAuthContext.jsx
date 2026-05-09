/* eslint-disable react-refresh/only-export-components */
// Legacy re-export — delegates to shared auth
export { useCustomerAuth } from "../../shared/auth/AuthContext";

// CustomerAuthProvider is no longer needed — use AuthProvider from shared
export function CustomerAuthProvider({ children }) {
  return children;
}

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { paths } from "@/routes/paths";
import { usePortalAuthStore } from "@/stores/portalAuthStore";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = usePortalAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate to={paths.login} replace state={{ from: location.pathname }} />
    );
  }

  return <>{children}</>;
}

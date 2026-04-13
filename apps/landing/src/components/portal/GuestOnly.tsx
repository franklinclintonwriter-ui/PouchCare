import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { paths } from "@/routes/paths";
import { usePortalAuthStore } from "@/stores/portalAuthStore";

export function GuestOnly({ children }: { children: ReactNode }) {
  const isAuthenticated = usePortalAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to={paths.dashboard} replace />;
  }
  return <>{children}</>;
}

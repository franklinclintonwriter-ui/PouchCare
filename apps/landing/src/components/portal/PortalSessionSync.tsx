import { useEffect } from "react";
import { usePortalMe } from "@/api/portal-auth";
import { usePortalAuthStore } from "@/stores/portalAuthStore";

/** Fetches `/portal/me` when tokens exist and syncs user into the store. */
export function PortalSessionSync() {
  const isAuthenticated = usePortalAuthStore((s) => s.isAuthenticated);
  const setUser = usePortalAuthStore((s) => s.setUser);
  const { data, isSuccess } = usePortalMe();

  useEffect(() => {
    if (!isAuthenticated || !isSuccess || !data) return;
    setUser(data);
  }, [isAuthenticated, isSuccess, data, setUser]);

  return null;
}

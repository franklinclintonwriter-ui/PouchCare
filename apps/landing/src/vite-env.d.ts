/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Empty → same-origin `/v1` (Vite dev proxy to API). */
  readonly VITE_API_URL?: string;
  readonly VITE_PORTAL_URL?: string;
  readonly VITE_PORTAL_LOGIN_PATH?: string;
  readonly VITE_PORTAL_REGISTER_PATH?: string;
  readonly VITE_PORTAL_DASHBOARD_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

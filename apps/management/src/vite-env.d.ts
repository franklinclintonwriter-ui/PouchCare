/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin, e.g. `http://127.0.0.1:7000`. Omit to use same-origin `/v1`. */
  readonly VITE_API_URL?: string;
  /** Full WebSocket URL to `/v1/realtime` (token is appended). Omit to use same-origin WS. */
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

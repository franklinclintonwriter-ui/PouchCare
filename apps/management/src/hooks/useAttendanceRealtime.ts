import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { invalidateAllAttendanceQueries } from "@/constants/queryKeys";
import { buildRealtimeWebSocketUrl } from "@/config/apiOrigin";

const PING_MS = 55_000;
const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 60_000;
/** Stop reconnect storms when the API is down; `online` event resets the counter. */
const MAX_RECONNECT_ATTEMPTS = 18;
/** Server closes with 1008 when token is missing or invalid — do not retry until token changes. */
const WS_CLOSE_POLICY_VIOLATION = 1008;

/**
 * Subscribes to `/v1/realtime` WebSocket (same host as the SPA when proxied, or `VITE_WS_URL`).
 * When the API broadcasts `{ type: "attendance:update" }`, all attendance queries refetch.
 */
export function useAttendanceRealtime() {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userType = useAuthStore((s) => s.userType);
  const accessToken = useAuthStore((s) => s.accessToken);
  const reconnectAttempt = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnedMaxAttempts = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || userType !== "staff" || !accessToken) {
      return;
    }

    reconnectAttempt.current = 0;
    warnedMaxAttempts.current = false;

    let cancelled = false;

    const clearTimers = () => {
      if (pingRef.current) {
        clearInterval(pingRef.current);
        pingRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    const connect = () => {
      if (cancelled) return;

      const url = buildRealtimeWebSocketUrl(accessToken);

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectAttempt.current = 0;
          warnedMaxAttempts.current = false;
          pingRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "ping" }));
            }
          }, PING_MS);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data as string) as { type?: string };
            if (msg.type === "attendance:update") {
              void invalidateAllAttendanceQueries(qc);
            }
          } catch {
            /* ignore non-JSON */
          }
        };

        ws.onerror = () => {
          /* onclose will handle reconnect */
        };

        ws.onclose = (event) => {
          clearTimers();
          wsRef.current = null;
          if (cancelled) return;

          if (event.code === WS_CLOSE_POLICY_VIOLATION) {
            if (import.meta.env.DEV) {
              console.warn(
                "[realtime] WebSocket closed (auth). Refresh or sign in again if attendance updates stall.",
              );
            }
            return;
          }

          const n = reconnectAttempt.current + 1;
          if (n > MAX_RECONNECT_ATTEMPTS) {
            if (!warnedMaxAttempts.current && import.meta.env.DEV) {
              warnedMaxAttempts.current = true;
              console.warn(
                "[realtime] Stopped reconnecting after max attempts. Check VITE_WS_URL / API, then reload or wait for network.",
              );
            }
            return;
          }
          reconnectAttempt.current = n;
          const delay = Math.min(
            RECONNECT_MAX_MS,
            RECONNECT_BASE_MS * Math.pow(2, Math.min(n, 5)),
          );
          reconnectTimer.current = setTimeout(connect, delay);
        };
      } catch {
        reconnectTimer.current = setTimeout(connect, RECONNECT_BASE_MS);
      }
    };

    const onOnline = () => {
      reconnectAttempt.current = 0;
      warnedMaxAttempts.current = false;
      if (!cancelled) connect();
    };

    window.addEventListener("online", onOnline);
    connect();

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      clearTimers();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, userType, accessToken, qc]);
}

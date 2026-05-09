/**
 * ServerSync — Server-Sent Events (SSE) client for backend push updates.
 *
 * Connects to an SSE endpoint with automatic exponential-backoff reconnection
 * and dispatches incoming events to type-specific callbacks.
 *
 * @module ServerSync
 */

/** @typedef {(data: *) => void} EventCallback */

/**
 * @typedef {Object} ServerSyncInstance
 * @property {() => void}  connect      - Open the SSE connection.
 * @property {() => void}  disconnect   - Close the connection (no auto-reconnect).
 * @property {(type: string, callback: EventCallback) => () => void} onEvent
 *   Register a handler for a specific event type.  Returns an unsubscribe fn.
 * @property {() => boolean} isConnected - Whether the connection is currently open.
 */

/** Base delay for exponential backoff (ms). */
const BASE_DELAY_MS = 1000;
/** Maximum reconnect delay (ms). */
const MAX_DELAY_MS = 30000;

/**
 * Create an SSE-based server sync client.
 *
 * @param {string} url   - SSE endpoint URL (e.g. "/api/events").
 * @param {string} token - Auth token sent as a query parameter (`token`).
 * @returns {ServerSyncInstance}
 *
 * @example
 * const sync = createServerSync("/api/events", "my-jwt");
 * sync.onEvent("project:updated", (data) => {
 *   console.log("Project updated:", data);
 * });
 * sync.connect();
 * // later …
 * sync.disconnect();
 */
export function createServerSync(url, token) {
  /** @type {EventSource | null} */
  let source = null;

  /** @type {boolean} */
  let connected = false;

  /** @type {boolean} Whether disconnect() was called intentionally. */
  let intentionalClose = false;

  /** Current retry attempt (reset on successful open). */
  let retryCount = 0;

  /** @type {number | null} */
  let reconnectTimer = null;

  /**
   * Map of event-type -> Set<EventCallback>.
   * @type {Map<string, Set<EventCallback>>}
   */
  const callbackMap = new Map();

  /**
   * Build the full URL with the auth token as a query param.
   * @returns {string}
   */
  function buildUrl() {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}token=${encodeURIComponent(token)}`;
  }

  /**
   * Calculate delay with exponential backoff + jitter.
   * @returns {number} Delay in ms.
   */
  function getReconnectDelay() {
    const exponential = BASE_DELAY_MS * Math.pow(2, retryCount);
    const jitter = Math.random() * BASE_DELAY_MS * 0.5;
    return Math.min(exponential + jitter, MAX_DELAY_MS);
  }

  /**
   * Schedule a reconnection attempt.
   */
  function scheduleReconnect() {
    if (intentionalClose) return;

    const delay = getReconnectDelay();
    retryCount += 1;

    // eslint-disable-next-line no-console
    console.info(
      `[ServerSync] reconnecting in ${Math.round(delay)}ms (attempt ${retryCount})`
    );

    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }

  /**
   * Dispatch a parsed event to registered callbacks.
   *
   * @param {string} type
   * @param {*} data
   */
  function dispatch(type, data) {
    const cbs = callbackMap.get(type);
    if (!cbs) return;
    for (const cb of cbs) {
      try {
        cb(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[ServerSync] callback error for "${type}"`, err);
      }
    }
  }

  /**
   * Open the SSE connection.
   */
  function connect() {
    // Clean up any existing connection first.
    if (source) {
      source.close();
      source = null;
    }

    intentionalClose = false;
    source = new EventSource(buildUrl());

    source.onopen = () => {
      connected = true;
      retryCount = 0;
    };

    source.onerror = () => {
      connected = false;
      if (source) {
        source.close();
        source = null;
      }
      scheduleReconnect();
    };

    /**
     * Default "message" events (no explicit event type on the SSE stream).
     */
    source.onmessage = (event) => {
      let parsed;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        parsed = event.data;
      }

      // If the payload has a "type" field, use it for dispatch.
      if (parsed && typeof parsed === "object" && parsed.type) {
        dispatch(parsed.type, parsed.data !== undefined ? parsed.data : parsed);
      } else {
        dispatch("message", parsed);
      }
    };

    // Also listen for any named event types that already have callbacks
    // registered.  EventSource only fires addEventListener-based handlers
    // for named SSE events, not onmessage.
    for (const type of callbackMap.keys()) {
      if (type === "message") continue;
      source.addEventListener(type, (/** @type {MessageEvent} */ event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          data = event.data;
        }
        dispatch(type, data);
      });
    }
  }

  /**
   * Intentionally close the connection — no auto-reconnect.
   */
  function disconnect() {
    intentionalClose = true;

    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (source) {
      source.close();
      source = null;
    }

    connected = false;
  }

  return {
    connect,
    disconnect,

    /**
     * Register a handler for a named event type.
     *
     * @param {string} type
     * @param {EventCallback} callback
     * @returns {() => void} Unsubscribe function.
     */
    onEvent(type, callback) {
      if (!callbackMap.has(type)) {
        callbackMap.set(type, new Set());

        // If we're already connected, add a listener to the live source for
        // this new event type.
        if (source && type !== "message") {
          source.addEventListener(type, (/** @type {MessageEvent} */ event) => {
            let data;
            try {
              data = JSON.parse(event.data);
            } catch {
              data = event.data;
            }
            dispatch(type, data);
          });
        }
      }

      /** @type {Set<EventCallback>} */ (callbackMap.get(type)).add(callback);

      return () => {
        const set = callbackMap.get(type);
        if (set) {
          set.delete(callback);
          if (set.size === 0) {
            callbackMap.delete(type);
          }
        }
      };
    },

    /**
     * @returns {boolean}
     */
    isConnected() {
      return connected;
    },
  };
}

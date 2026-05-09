/**
 * BroadcastSync — Multi-tab synchronisation via BroadcastChannel API.
 *
 * Allows every open tab of the PouchCare portal to stay in sync by
 * broadcasting data changes through a shared channel.
 *
 * @module BroadcastSync
 */

/**
 * @typedef {Object} SyncMessage
 * @property {string} key   - The data key that changed (e.g. "projects", "leads").
 * @property {*}      data  - The payload associated with the change.
 * @property {number} timestamp - Unix-ms when the change was posted.
 * @property {string} tabId - Unique identifier of the originating tab.
 */

/**
 * @callback RemoteChangeCallback
 * @param {SyncMessage} message
 * @returns {void}
 */

/**
 * @typedef {Object} BroadcastSyncInstance
 * @property {(key: string, data: *) => void} postChange
 *   Broadcast a data change to all other tabs.
 * @property {(callback: RemoteChangeCallback) => () => void} onRemoteChange
 *   Register a listener for changes originating in other tabs.
 *   Returns an unsubscribe function.
 * @property {() => void} destroy
 *   Close the channel and clean up all listeners.
 */

/**
 * Generate a unique tab identifier.
 * Prefers `crypto.randomUUID` when available, falls back to a timestamp +
 * random-number concatenation.
 *
 * @returns {string}
 */
function generateTabId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Create a BroadcastChannel-backed sync instance.
 *
 * @param {string} [channelName="pouchcare-sync"] - Name of the BroadcastChannel.
 * @returns {BroadcastSyncInstance}
 *
 * @example
 * const sync = createBroadcastSync();
 * const unsub = sync.onRemoteChange((msg) => {
 *   console.log("Remote change:", msg.key, msg.data);
 * });
 * sync.postChange("projects", [{ id: 1, name: "Starter" }]);
 * // later …
 * unsub();
 * sync.destroy();
 */
export function createBroadcastSync(channelName = "pouchcare-sync") {
  const tabId = generateTabId();

  /** @type {BroadcastChannel | null} */
  let channel = new BroadcastChannel(channelName);

  /** @type {Set<RemoteChangeCallback>} */
  const listeners = new Set();

  /**
   * Internal message handler — only fires for messages originating from
   * *other* tabs (BroadcastChannel never delivers a message to the tab that
   * posted it, but we double-check via tabId just in case).
   *
   * @param {MessageEvent<SyncMessage>} event
   */
  function handleMessage(event) {
    const msg = event.data;
    if (!msg || msg.tabId === tabId) return;
    for (const cb of listeners) {
      try {
        cb(msg);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[BroadcastSync] listener error", err);
      }
    }
  }

  channel.addEventListener("message", handleMessage);

  return {
    /**
     * Broadcast a change to every other tab listening on this channel.
     *
     * @param {string} key
     * @param {*} data
     */
    postChange(key, data) {
      if (!channel) {
        // eslint-disable-next-line no-console
        console.warn("[BroadcastSync] channel destroyed — postChange ignored");
        return;
      }

      /** @type {SyncMessage} */
      const message = {
        key,
        data,
        timestamp: Date.now(),
        tabId,
      };

      channel.postMessage(message);
    },

    /**
     * Subscribe to remote changes.
     *
     * @param {RemoteChangeCallback} callback
     * @returns {() => void} Unsubscribe function.
     */
    onRemoteChange(callback) {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },

    /**
     * Tear down the channel and remove all listeners.
     */
    destroy() {
      if (channel) {
        channel.removeEventListener("message", handleMessage);
        channel.close();
        channel = null;
      }
      listeners.clear();
    },
  };
}

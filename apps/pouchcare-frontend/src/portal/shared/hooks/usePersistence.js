import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Shared persistence hook — localStorage-first with optional API sync.
 *
 * Reads initial state from localStorage (instant), then optionally fetches
 * from the API and merges. Writes go to localStorage immediately and to the
 * API in the background (optimistic).
 *
 * @param {string}   storageKey  — localStorage key
 * @param {*}        fallback    — default value if nothing stored
 * @param {Object}   [api]       — optional { fetch: () => Promise, persist: (data) => Promise }
 * @returns {{ data, setData, saving, error, refresh }}
 */
export function usePersistence(storageKey, fallback, api) {
  const [data, setDataRaw] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // On mount, try fetching from API and merge
  useEffect(() => {
    if (!api?.fetch) return;

    let cancelled = false;

    api
      .fetch()
      .then((remote) => {
        if (cancelled || !mounted.current) return;
        if (remote && typeof remote === "object") {
          setDataRaw(remote);
          localStorage.setItem(storageKey, JSON.stringify(remote));
        }
      })
      .catch(() => {
        // API failed — keep local data (offline-first)
      });

    return () => {
      cancelled = true;
    };
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Write data locally + optionally to API. */
  const setData = useCallback(
    (updater) => {
      setDataRaw((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;

        // Persist to localStorage (sync, instant)
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // storage full — continue without crashing
        }

        // Persist to API (async, background)
        if (api?.persist) {
          setSaving(true);
          setError(null);
          api
            .persist(next)
            .catch((err) => {
              if (mounted.current) setError(err);
            })
            .finally(() => {
              if (mounted.current) setSaving(false);
            });
        }

        return next;
      });
    },
    [storageKey, api]
  );

  /** Force re-fetch from API */
  const refresh = useCallback(async () => {
    if (!api?.fetch) return;
    setSaving(true);
    try {
      const remote = await api.fetch();
      if (mounted.current && remote && typeof remote === "object") {
        setDataRaw(remote);
        localStorage.setItem(storageKey, JSON.stringify(remote));
      }
    } catch (err) {
      if (mounted.current) setError(err);
    } finally {
      if (mounted.current) setSaving(false);
    }
  }, [storageKey, api]);

  return { data, setData, saving, error, refresh };
}

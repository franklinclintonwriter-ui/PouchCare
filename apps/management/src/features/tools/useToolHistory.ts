import { useCallback, useMemo, useState } from 'react';

const STORAGE_KEY = 'pouchcare-tools-history';
const MAX_PER_TOOL = 10;

type Store = Record<string, string[]>;

function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

/**
 * Last N query strings per tool id (e.g. favicon, backlinks).
 */
export function useToolHistory(toolId: string) {
  const [version, setVersion] = useState(0);

  const history = useMemo(() => {
    void version;
    const store = readStore();
    return store[toolId] ?? [];
  }, [toolId, version]);

  const push = useCallback(
    (query: string) => {
      const q = query.trim();
      if (!q) return;
      const store = readStore();
      const prev = store[toolId] ?? [];
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, MAX_PER_TOOL);
      store[toolId] = next;
      writeStore(store);
      setVersion((v) => v + 1);
    },
    [toolId],
  );

  const clear = useCallback(() => {
    const store = readStore();
    delete store[toolId];
    writeStore(store);
    setVersion((v) => v + 1);
  }, [toolId]);

  return { history, push, clear };
}

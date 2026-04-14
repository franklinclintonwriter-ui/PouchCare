import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useFilters<T extends Record<string, string>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = { ...defaults } as T;
  for (const key of Object.keys(defaults)) {
    const param = searchParams.get(key);
    if (param !== null) {
      (filters as Record<string, string>)[key] = param;
    }
  }

  const setFilter = useCallback(
    (key: keyof T, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== defaults[key]) {
          next.set(key as string, value);
        } else {
          next.delete(key as string);
        }
        next.delete('page');
        return next;
      });
    },
    [setSearchParams, defaults],
  );

  const clearFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const hasActiveFilters = Object.keys(defaults).some(
    (key) => filters[key as keyof T] !== defaults[key as keyof T],
  );

  return { filters, setFilter, clearFilters, hasActiveFilters };
}

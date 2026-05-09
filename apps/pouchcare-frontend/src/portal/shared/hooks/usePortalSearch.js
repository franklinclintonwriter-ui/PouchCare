import { useState, useMemo } from "react";

/**
 * Generic search + filter hook for portal list pages.
 *
 * @param {Array} items — source array
 * @param {Object} options
 * @param {string[]} options.searchKeys — object keys to match `query` against
 * @param {Object}   options.initialFilters — e.g. { status: "all", category: "all" }
 * @returns {{ query, setQuery, filters, setFilter, filtered }}
 */
export function usePortalSearch(items = [], { searchKeys = ["name"], initialFilters = {} } = {}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(initialFilters);

  /** Update a single filter key. Pass "all" to clear that filter. */
  const setFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const filtered = useMemo(() => {
    let result = items;

    // Apply key-based filters (skip values that are "all" or "")
    Object.entries(filters).forEach(([key, value]) => {
      if (!value || value === "all") return;
      result = result.filter((item) => {
        const field = item[key];
        if (field === undefined) return false;
        return String(field).toLowerCase() === String(value).toLowerCase();
      });
    });

    // Apply free-text search across searchKeys
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((item) =>
        searchKeys.some((key) => {
          const val = item[key];
          return val && String(val).toLowerCase().includes(q);
        })
      );
    }

    return result;
  }, [items, query, filters, searchKeys]);

  return { query, setQuery, filters, setFilter, filtered };
}

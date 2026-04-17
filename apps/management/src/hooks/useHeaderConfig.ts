import { useEffect } from "react";
import type { DependencyList } from "react";
import { useHeaderStore } from "@/store/headerStore";
import type { HeaderConfig } from "@/types/header";

/**
 * Push page-level header actions (buttons, filters, toggles, search) to the
 * global header bar. The page `title` is shown next to those actions (truncated).
 * Breadcrumbs / description in the config are accepted for backwards-compat but not rendered in the bar.
 *
 * @param syncDeps Optional extra dependencies so header actions pick up fresh callbacks.
 */
export function useHeaderConfig(
  config: HeaderConfig,
  syncDeps?: DependencyList,
) {
  const setHeader = useHeaderStore((s) => s.setHeader);
  const clearHeader = useHeaderStore((s) => s.clearHeader);

  const actionKey =
    config.actions
      ?.map((a) => {
        if (a.type === "button") {
          return `${a.type}${a.isLoading ? ":loading" : ""}${a.disabled ? ":disabled" : ""}`;
        }
        return `${a.type}${"value" in a ? (a as { value: unknown }).value : ""}`;
      })
      .join("|") ?? "";

  useEffect(() => {
    setHeader(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.title, actionKey, setHeader, ...(syncDeps ?? [])]);

  useEffect(() => {
    return () => clearHeader();
  }, [clearHeader]);
}

import type { QueryClient } from "@tanstack/react-query";

/** Central attendance-related keys — use for invalidation to avoid typos. */
export const attendanceKeys = {
  root: ["attendance"] as const,
  list: (params?: unknown) => ["attendance", params] as const,
  my: ["my-attendance"] as const,
  today: ["attendance-today"] as const,
  team: (date?: string) => ["team-attendance", date ?? "current"] as const,
  staff: (staffId: string, params?: unknown) =>
    ["staff-attendance", staffId, params] as const,
};

/** Central project-related keys. */
export const projectKeys = {
  root: ["projects"] as const,
  list: (params?: unknown) => ["projects", params] as const,
  detail: (id: string) => ["project", id] as const,
};

/** Tasks list queries (prefix match). */
export const taskKeys = {
  root: ["tasks"] as const,
  lists: () => ["tasks"] as const,
  detail: (id: string) => ["task", id] as const,
  my: ["my-tasks"] as const,
};

/**
 * Invalidates every attendance-backed query (lists, team board, per-staff, today).
 * Use after check-in/out and any attendance mutation.
 */
export function invalidateAllAttendanceQueries(qc: QueryClient) {
  return qc.invalidateQueries({
    predicate: (q) => {
      const k = q.queryKey[0];
      return (
        k === "attendance" ||
        k === "my-attendance" ||
        k === "attendance-today" ||
        k === "team-attendance" ||
        k === "staff-attendance"
      );
    },
  });
}

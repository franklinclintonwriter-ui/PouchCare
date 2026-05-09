/**
 * Unified status-to-CSS-class mapping for StatusBadge components.
 *
 * Covers all 16 statuses used across both admin and customer portals.
 * Grouped by semantic colour so the intent behind each status is clear.
 */
export const statusMap = {
  // -- Green: healthy / active states ---
  Active: "bg-emerald-100 text-emerald-700",
  Installed: "bg-emerald-100 text-emerald-700",
  Published: "bg-emerald-100 text-emerald-700",
  Paid: "bg-emerald-100 text-emerald-700",

  // -- Sky: informational / trial states ---
  Trial: "bg-sky-100 text-sky-700",
  Staging: "bg-sky-100 text-sky-700",

  // -- Amber: needs attention ---
  Pending: "bg-amber-100 text-amber-700",
  Open: "bg-amber-100 text-amber-700",

  // -- Slate: neutral / inactive ---
  Invited: "bg-slate-100 text-slate-700",
  Draft: "bg-slate-100 text-slate-700",

  // -- Blue: completed / resolved ---
  Resolved: "bg-blue-100 text-blue-700",

  // -- Rose: problematic / overdue ---
  Overdue: "bg-rose-100 text-rose-700",
  "Past Due": "bg-rose-100 text-rose-700",
  Disabled: "bg-rose-100 text-rose-700",

  // -- Orange: suspended / paused ---
  Suspended: "bg-orange-100 text-orange-700",
  Paused: "bg-orange-100 text-orange-700",
};

/**
 * Fallback class string used when a status is not found in the map.
 */
export const defaultStatusClass = "bg-slate-100 text-slate-700";

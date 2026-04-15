/**
 * Shared UI class fragments for the landing app. Compose with `cn()`.
 *
 * Responsiveness: prefer mobile-first Tailwind (`grid-cols-1` → `sm:` → `lg:`),
 * min touch targets 44px for primary actions, and pair wide tables with card
 * layouts under `md:hidden` / `hidden md:block`. See
 * `pages/dashboard/DASHBOARD_PORTAL.md` (all dashboard pages) and
 * `pages/dashboard/HOSTING_PORTAL.md` (hosting routes only) and
 * `pages/portal/ACCOUNT_PORTAL.md` (`/my-accounts/*`), and
 * `MARKETING_LANDING.md` (repo root of `apps/landing/src` — public marketing routes).
 *
 * **Master index (all areas):** `docs/UI_MASTER_INDEX.md` (under `apps/landing`).
 * **Implementation checklists (components + mock CRUD):** `docs/TASKS_INDEX.md`.
 */

/** `/my-accounts/*` — `text-base` (16px) avoids iOS zoom on input focus */
export const accountInputClass =
  "min-h-[48px] w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30";

export const accountTextareaClass =
  "min-h-[7rem] w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30";

export const ui = {
  /** Keyboard / focus ring aligned with dashboard shell */
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/45 focus-visible:ring-offset-2",

  /** Destructive actions */
  focusRingDanger:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/45 focus-visible:ring-offset-2",

  /** Modal / dialog backdrop */
  overlay:
    "fixed inset-0 z-[200] bg-black/45 backdrop-blur-[2px] supports-[backdrop-filter]:bg-black/35",

  /** Floating panels (popover, menus) */
  overlayLight: "fixed inset-0 z-[170] bg-transparent",

  /** Card-style surface */
  panel:
    "rounded-2xl border border-gray-200/90 bg-white shadow-xl shadow-gray-900/10 ring-1 ring-black/5 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/20 dark:ring-white/5",

  popoverSurface:
    "rounded-xl border border-gray-200/90 bg-white py-1 shadow-lg shadow-gray-900/10 ring-1 ring-black/5 dark:border-gray-800 dark:bg-gray-900 dark:ring-white/5",

  heading: "text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100",
  headingLg: "text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100",
  description: "text-sm text-gray-600 dark:text-gray-400",
  label: "text-sm font-medium text-gray-700 dark:text-gray-300",

  /** z-index scale (keep in sync with portal components) */
  z: {
    sheet: 195,
    modal: 200,
    modalNested: 210,
    popover: 170,
  },
} as const;

export const transition = {
  spring: { type: "spring" as const, duration: 0.32, bounce: 0.14 },
  easeOut: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
} as const;

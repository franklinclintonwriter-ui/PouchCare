# Hosting portal — AI & maintainer guide (read first)

This folder implements **domain hosting** under `/dashboard/hosting/*`. For **all** client dashboard pages (orders, wallet, billing, etc.), see `DASHBOARD_PORTAL.md` in this folder.

## Routes (nested)

- `HostingLayout` wraps: **index** = overview (`HostingOverviewPage`), **`register`** = search/register mock (`HostingRegisterPage`), **`:domainId`** = detail + edit (`HostingDomainDetailPage`).
- Route order in `App.tsx` must keep **`register` before `:domainId`** so `"register"` is not parsed as a domain id.

## Responsiveness rules (mandatory for any change)

1. **Never rely on horizontal scroll as the only mobile UX.** Pair `overflow-x-auto` tables with a **card list** for `< md` (`hidden md:block` / `md:hidden`).
2. **Touch targets:** interactive controls ≥ `44px` height on small screens (`min-h-[44px]`, `py-3`).
3. **Typography:** headings `text-xl sm:text-2xl`; body `text-sm sm:text-base`; panel padding `p-4 sm:p-5 md:p-6` (see `DashboardPanel`).
4. **Grids:** start `grid-cols-1`, then `sm:`, `lg:` breakpoints; avoid fixed `min-w-*` on outer wrappers—only inside scroll regions.
5. **Subnav:** `HostingLayout` tabs use `overflow-x-auto` + `snap-x` + `shrink-0` so all tabs are reachable on small phones.

## Mock data

`src/data/mockHosting.ts` — replace with API calls later; keep shape stable for UI.

## Paths

`paths.dashboardHosting`, `paths.dashboardHostingRegister`, `paths.dashboardHostingDomain(id)` in `src/routes/paths.ts`.

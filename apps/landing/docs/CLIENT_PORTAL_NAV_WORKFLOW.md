# Client portal navigation — plan, tasks, and workflow

## Goal

Align the **landing client dashboard** (`/dashboard/*`) with **Management** app patterns: fixed sidebar (collapsible on desktop, drawer on mobile), sticky **header** with menu + title + actions, and **bottom mobile nav** — polished, consistent, and easy to extend.

## Reference (source of truth)

| Area | Management | Landing (client) |
|------|------------|------------------|
| Shell | `AppLayout` + `Sidebar` + `Header` + `MobileNav` | `DashboardLayout` + `ClientSidebar` + `ClientDashboardHeader` + `ClientMobileNav` |
| Sidebar width | 260px / 72px collapsed | Same |
| Mobile drawer | Overlay + slide-in panel | Same |
| Bottom nav | 5 columns, “More” opens drawer | Same route set |

## Workflow

1. **Design tokens** — Reuse Management spacing: `h-14`/`h-16` header, sidebar `border-gray-200/80`, primary active states (`bg-primary-50`, `text-primary-700`).
2. **Single nav config** — `config/clientDashboardNav.ts` defines groups + items (labels, paths, icons). All UI consumes this (sidebar, mobile bar, optional future breadcrumbs).
3. **State** — `clientShellStore`: `isCollapsed`, `isMobileOpen`, toggles (mirrors `sidebarStore` in Management).
4. **Responsive** — `useIsMobile()` at `max-width: 1023px` — sidebar becomes drawer; main content gets `pl-[260px]` / `pl-[72px]` on large screens only.
5. **QA** — Resize viewport: desktop collapse, mobile drawer + bottom bar; keyboard Tab through menu; active route highlights.

## Task checklist

- [x] Document workflow (this file).
- [x] Add `clientShellStore`, `useMediaQuery`, `clientDashboardNav` config.
- [x] Implement `ClientSidebar` (grouped nav, user row, collapse control, mobile overlay).
- [x] Implement `ClientDashboardHeader` (menu, page title, website link, sign out).
- [x] Implement `ClientMobileNav` (5 slots + “More”).
- [x] Replace `DashboardLayout` composition; remove ad-hoc horizontal tab strip.
- [x] Add lightweight `Avatar` for client shell.
- [x] Full dashboard pages wired to API: overview, orders (+ detail), cart, services catalog, wallet (deposit), billing (commissions + payouts), referrals, profile, settings (password), support (+ ticket thread).
- [ ] Optional: portal notifications badge on header (needs API).
- [ ] Optional: `usePageTitle` hook + route meta for dynamic header actions.

## File map

| File | Role |
|------|------|
| `src/stores/clientShellStore.ts` | Sidebar open/collapsed state |
| `src/hooks/useMediaQuery.ts` | Breakpoint helpers |
| `src/config/clientDashboardNav.ts` | Nav groups + `getClientDashboardTitle()` |
| `src/components/ui/Avatar.tsx` | Initials / image avatar |
| `src/components/portal/ClientSidebar.tsx` | Desktop + mobile drawer |
| `src/components/portal/ClientDashboardHeader.tsx` | Sticky top bar |
| `src/components/portal/ClientMobileNav.tsx` | Fixed bottom bar |
| `src/components/layout/DashboardLayout.tsx` | Composes shell + `<Outlet />` |
| `src/api/portal-dashboard.ts` | React Query hooks for portal REST (`/portal/*`, `/services`, `/support/*`) |
| `src/stores/cartStore.ts` | Persisted cart for checkout (`POST /portal/orders` per line) |
| `src/pages/dashboard/*.tsx` | Feature pages (see `App.tsx` routes) |

## Conventions

- **Paths** stay in `src/routes/paths.ts`; nav config imports them (no duplicated string literals).
- **New dashboard route**: add to `paths`, add item to `CLIENT_NAV_GROUPS`, add title in `getClientDashboardTitle`, add to `MOBILE_NAV_ITEMS` if it should appear in the bottom bar (max 5 primary actions including “More”).

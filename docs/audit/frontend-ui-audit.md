# Frontend UI Audit — Management App
> Generated: 2026-04-04 | Scope: `apps/management/src/`

---

## A) Fragmentation Issues (Pages That Should Be Merged)

### A1 · Services — two separate routes for one domain

| File | Route |
|------|-------|
| `pages/services/ServiceList.tsx` | `/services` |
| `pages/services/BacklinkPackages.tsx` | `/services/backlinks` |

**Problem:** Both belong to the same "Services" catalog. Service types (SEO, Web Dev, Backlinks, etc.) should be tabs or a category filter on *one* dynamic page, not separate routes.

**Fix:** Single `ServiceList.tsx` at `/services` with a `category` filter sent to the header's filter slot. A dedicated `/services/backlinks` is deleted and its data absorbed as one category. Fields on the create/edit form change dynamically based on the chosen category.

---

### A2 · Assets — three inconsistent list UIs + broken hub breadcrumb

| File | Route | UI pattern |
|------|-------|-----------|
| `pages/assets/Domains.tsx` | `/assets/domains` | `DataTable` |
| `pages/assets/Websites.tsx` | `/assets/websites` | `DataTable` |
| `pages/assets/Servers.tsx` | `/assets/servers` | **Card grid** (inconsistent) |
| `pages/assets/Devices.tsx` | `/assets/devices` | `DataTable` |

**Problems:**
- All breadcrumbs link to `/assets` which has **no route** → 404.
- `Servers.tsx` uses a card layout; everything else uses `DataTable`.
- Each page is siloed — no shared navigation hub.

**Fix:** Add `/assets` index page (tabs: Domains / Websites / Servers / Devices) or redirect to first child. Convert `Servers.tsx` to `DataTable` for consistency. Fix breadcrumbs to `/assets/servers` etc.

---

### A3 · Analytics vs Dashboard vs Finance/Forecast — triple overlap

| File | Data pulled |
|------|------------|
| `pages/dashboard/Dashboard.tsx` | health score, revenue, staff stats, client stats, leaderboard, forecast |
| `pages/analytics/Analytics.tsx` | revenue, health score, staff stats, client stats |
| `pages/finance/Forecast.tsx` | forecast, revenue |

**Problem:** Three separate surfaces pulling nearly identical data with different chart presentations.

**Fix:** Dashboard stays as executive KPI summary. Analytics becomes the drill-down analyst view (detail tables, date ranges). Finance/Forecast merges into the Finance section only. Remove duplicate data hooks.

---

### A4 · Performance page — misplaced file vs route

| Detail | Value |
|--------|-------|
| File path | `pages/hr/Performance.tsx` |
| Actual route | `/performance` (not `/hr/performance`) |

**Problem:** File is under `hr/` but routed at top-level `/performance`. The nav item in Sidebar, breadcrumb, and file location are inconsistent.

**Fix:** Either move file to `pages/performance/Performance.tsx` and keep the route, or change route to `/hr/performance` and update `Sidebar.tsx`.

---

### A5 · CRM — clients vs portal members confusion

- `crm/ClientAccounts.tsx` manages **CRM client accounts**.
- `CommandPalette.tsx` live search navigates `clients` to `/admin/portal/members/${item.id}` (portal members).

**Problem:** CRM clients and portal members are different entities but the command palette conflates them, sending users to the wrong detail page.

**Fix:** CRM client search in CommandPalette must navigate to `/crm/clients/:id` (once that route exists — see section C).

---

## B) Header/Search Duplication (Inline Chrome That Must Move to Global Header)

The app has a `useHeaderConfig` hook that can supply `search`, `filter`, and `actions` to the shared `Header.tsx`. The following pages ignore this and duplicate UI in the page body.

### B1 · `staff/BranchManagement.tsx` — inline search bar (~lines 100–110)

Renders `<input type="search">` inside the page body. The header only has "New Branch".

**Fix:** Pass `search` to `useHeaderConfig`. Remove the inline bar.

---

### B2 · `staff/BranchDetail.tsx` — second inline search for members (~line 373)

Duplicate toolbar for filtering branch members while already inside a detail page.

**Fix:** Move to header search; scope is implicit (only members of this branch).

---

### B3 · `portal/PortalOrders.tsx` — `SearchInput` + `FilterDropdown` in page body (~lines 78–87)

Header title/breadcrumbs only; full filter chrome is rendered below tabs.

**Fix:** Header `search` + `filter` actions via `useHeaderConfig`. Remove inline component.

---

### B4 · `broadcast/BroadcastList.tsx` — channel + audience filter strip (~lines 224–255)

A card strip with two `<select>` dropdowns sits in the page body. Header has "Compose" only.

**Fix:** Channel and Audience become filter actions in the header's filter slot. Body strip removed.

---

## C) Missing Detail Pages

| List page | Missing detail route | Notes |
|-----------|---------------------|-------|
| `crm/ClientAccounts.tsx` | `/crm/clients/:id` | Edit/view is modal-only; no shareable URL |
| `hr/Positions.tsx` | `/hr/positions/:id` | Edit is modal-only |
| `leave/LeaveList.tsx` | `/leave/:id` | No audit trail / comment view |
| `services/ServiceList.tsx` | `/services/:id` | Edit is inline modal |
| `reports/DailyReports.tsx` | `/reports/:id` | No detail route in `routes/index.tsx` |

---

## D) Missing List Pages

No orphan detail pages found. All detail pages have a corresponding list page or are accessed through a parent (e.g. portal member detail from portal members list).

---

## E) API Client Gaps

### E1 · Dual `useForecast` hooks — wrong one easily imported

| File | Hook | Endpoint |
|------|------|---------|
| `api/analytics.ts` | `useForecast` | `/analytics/forecast` |
| `api/finance.ts` | `useForecast` | `/finance/forecast` |

**Fix:** Rename one (e.g. `useFinanceForecast` in finance.ts) and export with distinct names. Add a lint rule or alias check.

---

### E2 · Missing mutations

| Module | Missing |
|--------|---------|
| `api/hr.ts` | `useDeletePosition`, `useDeleteApplication` |
| `api/performance.ts` | `useUpdatePerformanceReview`, `useDeletePerformanceReview` |
| `api/broadcast.ts` | `useUpdateBroadcast` |
| `api/admin-resources.ts` | `useUpdateClientAccount`, `useDeleteClientAccount` |

---

## F) Inconsistent Patterns

### F1 · Table pattern — DataTable vs Cards vs custom map

| Pattern | Pages |
|---------|-------|
| `DataTable` component | Most list pages (correct) |
| Custom card grid | `ServiceList.tsx`, `Servers.tsx`, `notifications/NotificationList.tsx` |
| Raw `.map()` with manual div rows | some older views |

**Fix:** Convert `Servers.tsx` to `DataTable` (or a shared `AssetCard` grid applied consistently). Services catalog intentionally uses cards — document that as the exception.

---

### F2 · Broken breadcrumb `href` targets

| File | Broken href |
|------|------------|
| `Domains.tsx`, `Websites.tsx`, `Servers.tsx`, `Devices.tsx` | `{ label: 'Assets', href: '/assets' }` → no route |
| `Positions.tsx`, `Performance.tsx` | `{ label: 'HR', href: '/hr' }` → no route |

**Fix:** Either add index routes (`/assets`, `/hr`) or change hrefs to the first child (`/assets/domains`, `/hr/positions`).

---

### F3 · Wrong permission gate

`pages/hr/Performance.tsx` line ~35: `perm.can('hr.recruitment')` guards "Add Review" — performance reviews are not a recruitment action.

**Fix:** Add a dedicated `hr.performance` permission key or gate on manager/ops roles.

---

### F4 · Weak typing

`pages/analytics/Analytics.tsx` ~line 26: `(r: any)` for revenue rows. Should use a typed interface from `models.ts`.

---

### F5 · RoleGuard defined but unused

`routes/guards.tsx` exports `RoleGuard` (lines 39–66). `routes/index.tsx` only uses `PermissionGuard` and `AuthGuard`.

**Fix:** Either use `RoleGuard` on role-specific routes or remove it.

---

## G) Dead / Unused Routes & Navigation Gaps

### G1 · `ROUTES` in `config.ts` missing entries

`/settings/role-permissions` is registered in `routes/index.tsx` but **not** in `ROUTES` constants in `config.ts`. Any code that navigates with the constant will fail silently.

**Fix:** Add `SETTINGS_ROLE_PERMISSIONS: '/settings/role-permissions'` to `config.ts`.

---

### G2 · Settings not in Sidebar

`Sidebar.tsx` has no Settings section. Users must use Command Palette or type the URL manually. This is a UX gap — settings (profile, security, preferences, role permissions) should be accessible from the main nav.

**Fix:** Add a Settings section (or footer link) to `Sidebar.tsx`. Show Role Permissions only when `perm.can('settings.role_permissions')`.

---

### G3 · `RoleGuard` — dead code

Defined, exported, never imported. See F5.

---

## H) Enhancement Opportunities

### H1 · Services — dynamic form per category (highest priority)

When creating/editing a service the form should change fields based on category:
- **SEO (on-page/off-page)**: Keywords, target URLs, monthly hours, reporting frequency.
- **Web Dev**: Stack, deliverables, milestone dates.
- **Backlinks**: DA range, anchor text, turnaround.
- **Design**: Asset types, brand kit, revisions.

One page with a `category` select that renders the correct fieldset. No more separate route for backlinks.

---

### H2 · Assets — `/assets` hub page

Add an `/assets` index page that:
- Shows summary KPIs (total domains expiring, servers down, pending SSL, devices unassigned).
- Has tabs for Domains / Websites / Servers / Devices.
- Fixes all breadcrumb links.

---

### H3 · CRM — client detail route + CommandPalette fix

Create `/crm/clients/:id` with full account info, related leads, invoices, and orders. Fix CommandPalette client search to navigate here instead of portal members.

---

### H4 · Sidebar — Settings & Role Permissions

```
Sidebar sections (add):
  ...existing items...
  ─────────────
  ⚙ Settings
    Profile
    Security
    Preferences
    Role Permissions  [CEO/Ops only — perm.can('settings.role_permissions')]
```

---

### H5 · Leave — detail/audit view

Add `/leave/:id` with timeline of status changes, comments from approver, attached documents (sick notes, etc.).

---

### H6 · Performance — dedicated permission + correct file location

Move `pages/hr/Performance.tsx` → `pages/performance/Performance.tsx` and add `hr.performance` key to `permissionKeys.ts` + `managementPermissions.ts`. Use that key consistently.

---

### H7 · Analytics — consolidate data hooks

Define single shared `useAnalyticsSummary` hook that Dashboard, Analytics, and Forecast all consume, differing only in how they visualize the data. Eliminates duplicate `/analytics/*` vs `/finance/*` calls for the same data.

---

### H8 · Breadcrumbs — add index routes

```
/assets        → redirect to /assets/domains
/hr            → redirect to /hr/positions
/services      → keep as ServiceList (already the index)
/finance       → redirect to /finance/invoices (currently not a route)
```

---

## Summary — Priority Order

| Priority | Item |
|----------|------|
| 🔴 P1 | B1–B4: Move inline search/filters to header (`useHeaderConfig`) |
| 🔴 P1 | A1: Merge BacklinkPackages into ServiceList with category dynamic form |
| 🔴 P1 | A5 + H3: Fix CommandPalette client navigation; add CRM client detail |
| 🟠 P2 | A2 + H2: Assets hub page + fix breadcrumbs |
| 🟠 P2 | G2 + H4: Add Settings to Sidebar |
| 🟠 P2 | G1: Add missing ROUTES constants |
| 🟠 P2 | E1: Rename duplicate `useForecast` hooks |
| 🟡 P3 | C (table): Add missing detail pages (leave, positions, daily reports) |
| 🟡 P3 | E2: Add missing API mutations |
| 🟡 P3 | F3: Fix Performance permission key |
| 🟡 P3 | A4: Align Performance file location with route |
| 🟢 P4 | H5: Leave audit trail detail |
| 🟢 P4 | H7: Consolidate analytics data hooks |
| 🟢 P4 | G3 / F5: Remove dead RoleGuard or use it |

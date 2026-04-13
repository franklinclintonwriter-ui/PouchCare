# Management app — RBAC audit (frontend)

**Scope:** `apps/management` — navigation, route guards, dashboard shortcuts, command palette, and alignment with `usePermission()` / API permission keys.

**Sources of truth**

- Permission keys: `apps/management/src/constants/permissionKeys.ts` (must match `apps/api/src/lib/managementPermissions.ts`).
- Role helpers: `apps/management/src/utils/permissions.ts` (`isCEO`, `isOps`, `isManager`, …).
- Effective permissions are loaded on staff login (`/v1/staff/me` → `permissions` on `StaffUser`).

---

## 1. How enforcement works today

| Layer | Mechanism |
|-------|-----------|
| **Routes** | `PermissionGuard` (single key), `AuthGuard`, `RoleGuard` (used rarely). |
| **Sidebar** | `NavItem.permission?: () => boolean`; child links filtered by `child.permission`. |
| **`usePermission().can(key)`** | `true` only if `user.permissions[key] === true` (from API matrix + overrides). |
| **API** | Many `/v1/*` routes only use `requireStaff`; UI restrictions can be bypassed via API or direct URL. |

**Gap:** UI can hide a link but **routes stay reachable** unless wrapped. Several high-impact areas were only partially guarded.

---

## 2. Issues found (pre-fix inventory)

### 2.1 CRM (Leads, Pipeline, Sales orders)

- **Sidebar:** “CRM” was visible to **all** staff; only “Client Accounts” had a permission check on the child link.
- **Routes:** `/crm/leads`, `/crm/pipeline`, `/crm/orders` (+ details) had **no** `PermissionGuard`.
- **Quick Actions:** “CRM Leads” had **no** `permission` field → always eligible for the first 4 tiles for every role.
- **API:** CRM list routes use `requireStaff` only (`apps/api/src/routes/crm/index.ts`) — any staff token can call them.

**Product assumption applied in code:** CRM pipeline areas are **manager-and-above** (`isManager`: CEO, Co-MD, Ops Manager, Branch Manager, HR Manager). **Staff** and **Intern** should use CRM only if you explicitly grant API + UI later (e.g. new permission key).

### 2.2 Command palette (`CommandPalette.tsx`)

- Static commands included **Payroll, Invoices, Leads, Pipeline, Analytics** without checking `payroll.access`, `finance.access`, `analytics.access`, or manager scope.
- **Live search** could surface CRM leads and portal “clients” to everyone; portal member links used a **wrong href** (`/admin/portal/members/:id` for CRM client results — separate data model issue).

### 2.3 Finance sidebar

- **Exchange Rates** requires `finance.exchange_rates` in the permission matrix but the nav child was not gated separately (parent required `finance.access` only).

### 2.4 Settings

- **API Keys:** Sidebar used `perm.isCEO` but the **route** was not wrapped → any staff could open `/settings/api-keys` by URL if the API allowed it.
- **System config:** Sidebar `isCEO` vs route `settings.role_permissions` — inconsistent expectations.

### 2.5 Assets, Tools, Plugins

- Routes generally **unauthenticated beyond `requireStaff`** on API; sidebar showed Domains/Servers/Websites/Tools/Plugins to all staff.
- Acceptable for some orgs; if you need ops-only tools, add `PermissionGuard` + API checks.

### 2.6 `permissions` missing / stale client

- If `staff.permissions` is **undefined** (old session), `can()` returns **false** for everything — safe but can look “broken”. Re-login refreshes permissions.

---

## 3. Fixes implemented (this pass)

| Area | Change |
|------|--------|
| **Guards** | `ManagerGuard` — blocks non-managers with a standard “Access denied” screen. |
| **Routes** | CRM leads/pipeline/orders (+ detail routes) wrapped in `ManagerGuard`. |
| **Sidebar** | CRM parent item requires `isManager`; Exchange Rates child requires `finance.exchange_rates`. |
| **Quick Actions** | “CRM Leads” requires `isManager`. |
| **Command palette** | Commands carry `permission` and/or `requireManager`; list filtered. Live CRM lead hits only for managers. Live “client” hits: one row per result — `/crm/clients/:id` when `crm.client_accounts`, else `/admin/portal/members/:id` when `admin_portal.access` (no duplicate links for users with both). |
| **API Keys route** | Wrapped with `PermissionGuard permission="settings.role_permissions"` (aligned with sensitive settings). |

---

## 4. Recommended follow-ups (not all done here)

1. **API:** Add `isStaffAllowed`-style checks (or role gates) on CRM, finance, and assets endpoints to match UI.
2. **New permission keys** (optional): `crm.pipeline`, `assets.domains`, `tools.access` for finer control without overloading `finance.access`.
3. **System Config route:** Align `PermissionGuard` vs CEO-only with actual API authorization for `/v1/admin/system-config`.
4. **Live search (API):** Return typed entities (CRM client vs portal member) so hrefs are always correct; UI currently prefers CRM path when `crm.client_accounts` is granted, otherwise portal path when `admin_portal.access` only.
5. **E2E tests:** Log in as STAFF / INTERN / BRANCH_MANAGER and assert denied routes return 403 or access-denied UI.

---

## 5. Files touched in the fix pass

- `apps/management/src/routes/guards.tsx` — `ManagerGuard`
- `apps/management/src/routes/index.tsx` — CRM + settings/api-keys
- `apps/management/src/components/layout/Sidebar.tsx` — CRM + Exchange Rates
- `apps/management/src/components/dashboard/QuickActions.tsx` — CRM leads
- `apps/management/src/components/shared/CommandPalette.tsx` — filtering + live search tweaks

---

*Generated as part of RBAC hardening; adjust product rules if managers should not see CRM.*

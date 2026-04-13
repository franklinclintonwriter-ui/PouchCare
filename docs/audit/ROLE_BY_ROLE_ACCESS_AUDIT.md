# Role-by-role access audit (Management app + API defaults)

This document is updated **in batches**: each batch deep-reads **three** functional areas (routes, guards, key API behavior), records per-role mismatches, then pauses for the next batch.

**Sources of truth**

- Prisma enum: `apps/api/prisma/schema.prisma` → `SystemRole`
- Default permission matrix: `apps/api/src/lib/managementPermissions.ts` (`buildDefaultMatrix` / `defaultForRole`)
- Frontend guards: `apps/management/src/routes/index.tsx`, `routes/guards.tsx`, `components/layout/Sidebar.tsx`
- Frontend role helpers: `apps/management/src/utils/permissions.ts`

---

## Part A — All roles (canonical list)

| Role | Prisma value | Typical use |
|------|----------------|-------------|
| CEO | `CEO` | Full strategic + permission matrix (with Co-MD) |
| Co-MD | `CO_MD` | Same permission defaults as CEO for keys; mapped as “Brother / Co-MD” in DB |
| Operations Manager | `OP_MANAGER` | Ops-wide modules; not Co-MD on plugins publish or role-permission UI |
| HR Manager | `HR_MANAGER` | HR recruitment/performance defaults; not “ops” finance/CRM portal unless overridden |
| Branch Manager | `BRANCH_MANAGER` | Manager UI (e.g. CRM pipeline); branch-scoped monitor when not global |
| Staff | `STAFF` | Standard employee; branch-scoped monitor; no manager CRM routes |
| Intern | `INTERN` | Restricted (e.g. no `monitor.view` by default) |

---

## Part B — Default API permission keys (before `role_permission` DB overrides)

Legend: **Y** = granted by default, **N** = not granted.

| Key | CEO | Co-MD | Ops | HR | Branch Mgr | Staff | Intern |
|-----|-----|-------|-----|-----|------------|-------|--------|
| staff.branches | Y | Y | Y | N | N | N | N |
| staff.manage_profiles | Y | Y | Y | Y | N | N | N |
| payroll.access | Y | Y | Y | N | N | N | N |
| finance.access | Y | Y | Y | N | N | N | N |
| finance.exchange_rates | Y | Y | Y | N | N | N | N |
| crm.client_accounts | Y | Y | Y | N | N | N | N |
| hr.recruitment | Y | Y | Y | Y | N | N | N |
| hr.performance | Y | Y | Y | Y | N | N | N |
| assets.devices | Y | Y | Y | N | N | N | N |
| monitor.view | Y | Y | Y | Y | Y | Y | **N** |
| broadcast.access | Y | Y | Y | N | N | N | N |
| analytics.access | Y | Y | Y | N | N | N | N |
| admin_portal.access | Y | Y | Y | N | N | N | N |
| settings.role_permissions | Y | Y | N | N | N | N | N |

Implementation note: `defaultForRole` uses groups `ops` = CEO + Co-MD + OP_MANAGER, `hrRecruitment` = CEO + Co-MD + OP_MANAGER + HR_MANAGER, `ceoCoMd` = CEO + Co-MD only.

---

## Part C — CEO “full system” access (expectation vs code)

**Expectation:** CEO should have full access to operational and governance features.

**Aligned with defaults**

- All permission keys above are **Y** for CEO except keys that are intentionally **Co-MD–only** for governance: there are none—**CEO and Co-MD share** `settings.role_permissions`.
- **Monitor / cameras:** CEO is in **global** scope (`resolveMonitorBranchScope` in `lib/monitorBranchScope.ts`) → all branches, not branch-filtered.
- **Dashboard:** CEO has `analytics.access` → full analytics dashboard (not the “lite” home).

**Intentional restrictions (not “full” vs other executives)**

- **Plugins — create / publish / sensitive writes:** `apps/api/src/routes/plugins/index.ts` uses `isCEO` middleware = **CEO + Co-MD only** (not OP_MANAGER). So **Ops Manager cannot** create plugins; this is **stricter than “ops” elsewhere**, not a CEO gap.
- **Some CRM deletes / lead deletes:** may still be `CEO_ROLES`-only in places—by design for destructive actions.

**Items to confirm in later batches**

- System config API: verify `admin/system-config` or equivalent matches `settings.role_permissions` for writes.
- HR_MANAGER: has monitor global + HR keys but **not** ops finance/portal by default—override via Role permissions UI if product wants “HR sees finance.”

---

# Batch 1 — Deep read (3 areas)

The following three areas were read end-to-end (management routes + relevant API behavior + prior fixes).

### 1) Dashboard (`/`)

| Aspect | Detail |
|--------|--------|
| **Route guard** | None on `/`; always loads for any authenticated staff. |
| **Behavior** | Uses `usePermission().can('analytics.access')`. If **N**, shows **Quick links** home (no `/analytics/*` calls). If **Y**, loads `useDashboardSummary` + `useForecast` (full KPIs). |
| **CEO** | Full dashboard (**Y** on analytics). |
| **Co-MD / Ops** | Full dashboard (**Y**). |
| **HR_MANAGER** | Has `analytics.access` **N** by default → **lite** home unless DB override. Possible **product mismatch** if HR should see company-wide analytics. |
| **Branch Manager / Staff** | Lite home unless override. |
| **INTERN** | Lite home; aligns with restricted analytics. |

**Mismatch note (HR):** Default matrix denies HR `analytics.access`; sidebar also hides Analytics nav. If HR should see analytics, grant via Role permissions or change `defaultForRole`.

---

### 2) Monitor — CCTV (`/monitor`, `/monitor/:branchId`)

| Aspect | Detail |
|--------|--------|
| **Route guard** | `PermissionGuard permission="monitor.view"`. |
| **INTERN** | Default **N** for `monitor.view` → cannot open monitor routes (Access Denied). |
| **CEO / Co-MD / OP / HR** | **Global** branch scope → all branches in summary and camera lists. |
| **Branch Manager / Staff / Intern** | If `monitor.view` granted: **branch-scoped** by `StaffMember.branch` → `Branch.name` → `branchId` (see `lib/monitorBranchScope.ts`). Wrong branch in URL vs scope → **403** on APIs. |
| **Vigi integration GET** | `GET /assets/vigi/branches/:branchId` allowed with `monitor.view` + branch assert; writes remain senior roles. |

**CEO:** Full fleet visibility; no mismatch for “see all cameras.”

---

### 3) Settings — Role permissions, System config, API keys (`/settings/role-permissions`, `/settings/system`, `/settings/api-keys`)

| Aspect | Detail |
|--------|--------|
| **Route guard** | All three use `PermissionGuard permission="settings.role_permissions"`. |
| **Default matrix** | Only **CEO** and **Co-MD** have this key. |
| **OP_MANAGER / HR_MANAGER / others** | **Access Denied** on these pages unless DB override. |

**CEO:** Full access to edit permission matrix and (with Co-MD) sensitive settings—aligned with “governance” ownership.

**Mismatch note:** If product expects **only CEO** (not Co-MD) to edit permissions, the current default grants **both**; that would be a policy change in `defaultForRole` or split keys.

---

## Batch 1 — Summary table (mismatches / follow-ups)

| ID | Topic | Severity | Notes |
|----|--------|----------|--------|
| B1-1 | HR default: no `analytics.access` | Medium (product) | HR sees lite dashboard + no Analytics nav unless override. |
| B1-2 | Role permissions: CEO **and** Co-MD | Low (policy) | Confirm whether Co-MD should remain equal to CEO on governance screens. |
| B1-3 | Plugins: only CEO/Co-MD write | Info | OP cannot publish plugins—by API design, not a CEO gap. |

---

## Batch 2 — Deep read (Tasks + Projects, Staff + HR, Finance)

*Requested as “next” — first three items from the planned queue.*

### 1) Tasks (`/tasks`, `/tasks/mine`, `/tasks/:id`)

| Aspect | Detail |
|--------|--------|
| **Management routes** | No `PermissionGuard`; all authenticated staff reach the UI. |
| **API `GET /tasks`** | **STAFF** / **INTERN**: `where.assignedMemberId = req.user.id` (only own tasks). **Managers+**: full list unless `mine=true`. |
| **API `GET /tasks/:id`** | Staff/Intern: **404** if not assignee. |
| **API `POST /tasks`** | `isManager` (CEO, Co-MD, Ops, HR, Branch Manager). |
| **API `PUT /tasks/:id`** | Staff/Intern: limited fields (progress, notes, …). Managers: full; **Branch Manager**: restricted via `canEditTaskAssignment` (same branch as `assignedBranch`, or task’s manager). CEO/Co-MD/Ops/HR: broad edit per handler. |
| **API `DELETE /tasks/:id`** | **`isCEO`** → in code this is `requireRoles(CEO, CO_MD)` only — **not** all “managers”. **CEO & Co-MD** can delete; Ops/Branch Manager cannot delete via this route. |
| **Task meta `GET /tasks/meta`** | **`isManager`** — non-managers cannot load branch/category meta for *create* form (aligned with create). |

**CEO:** Full task visibility; can delete; can verify (`POST .../verify` uses CEO middleware in file). **Co-MD:** Same as CEO for delete/verify. **OP_MANAGER:** Sees all tasks, create/approve, but **cannot** delete task if route is CEO-only—confirm product intent.

---

### 2) Projects (`/projects`, `/projects/:id`)

| Aspect | Detail |
|--------|--------|
| **Management routes** | No role guard on list/detail. |
| **API `GET /projects`** | **`authenticate` only** — **no role filter**. Any staff token returns **all** projects (client names, notes scope depends on Prisma select). |
| **API `POST/PUT /projects`** | `isManager`. |
| **API `DELETE /projects/:id`** | **`isCEO`** (CEO + Co-MD only), same pattern as task delete. |

**Mismatch (high):** **Staff / Intern** can **list and read every project** via API even though they only see **assigned tasks** in `/tasks`. UI shows project list to everyone—**information exposure** vs task scoping.

**CEO:** Sees all projects (expected). **Branch Manager / Staff:** Same project list as CEO unless UI/API is tightened.

---

### 3) Staff directory + HR (`/staff`, `/hr/*`)

| Aspect | Detail |
|--------|--------|
| **Staff list `GET /staff/members`** | `buildStaffListWhere` filters by query params only (`q`, `status`, `role`, `branch`). **No automatic branch filter** for Branch Manager—**same directory as CEO** unless the client passes `branch=`. |
| **Staff detail `GET /staff/members/:id`** | **Admin** select (`staff.manage_profiles` / HR path via `canAccessStaffProfileAdmin`) vs **limited** colleague view. |
| **POST /staff/members** | **HR_ROLES** (CEO, Co-MD, Ops, HR)—not Branch Manager. |
| **HR `routes/hr/index.ts`** | All recruitment CRUD wrapped in `requirePermission('hr.recruitment')` — default **Y** for CEO, Co-MD, Ops, HR; **N** for Branch Manager, Staff, Intern. |
| **Performance `GET /performance`** | Staff/Intern: own ratings only; others: can list all (optional `memberId` filter). |

**Mismatch (medium):** **Branch Manager** is **not** branch-scoped on staff list/stats—differs from **monitor** branch scoping. **CEO** has full staff + HR APIs per defaults.

---

### 4) Finance (`/finance/*`)

| Aspect | Detail |
|--------|--------|
| **Management routes** | Every finance sub-route uses `PermissionGuard` + keys: `finance.access` or `finance.exchange_rates`. |
| **API** | `router.use(authenticate)` + each route `requirePermission('finance.access')` or `finance.exchange_rates`. |
| **Defaults** | **Y** for CEO, Co-MD, Ops only. **N** for HR, Branch Manager, Staff, Intern. |

**CEO:** Full finance UI + API (subject to permission matrix). **HR / Branch Manager / Staff:** No access unless **Role permissions** overrides—UI and API aligned.

---

## Batch 2 — Summary table (mismatches / follow-ups)

| ID | Topic | Severity | Notes |
|----|--------|----------|--------|
| B2-1 | **`GET /projects` lists all projects for any staff** | **High** | Staff/Intern see company-wide projects; tasks are assignee-scoped. Consider scoping projects by assignee/branch or role. |
| B2-2 | **Task delete: `isCEO` = CEO + Co-MD only** | Medium (policy) | Ops/Branch Manager cannot delete tasks via API; may be intentional. |
| B2-3 | **Staff directory not branch-scoped for Branch Manager** | Medium | BM sees all staff in API unless UI sends `branch=`; differs from monitor branch scope. |
| B2-4 | Finance gated consistently | OK | CEO/Ops default; others denied unless overrides. |

---

## Next batch — choose **three** areas (Batch 3)

Reply with **three** numbers or names:

1. **CRM** (manager leads/pipeline + `crm.client_accounts` clients)  
2. **Admin portal** (`/admin/portal/*`)  
3. **Tools hub** (`/tools/*` + `routes/tools`)  
4. **Assets** (domains / servers / websites / devices — non-monitor)  
5. **Support + Broadcast + Notifications**  
6. **Attendance + Leave + Reports**  
7. **Plugins UI** vs CEO-only plugin API  

Example: **“Batch 3: CRM, Admin portal, Tools”** or **“1, 2, 6”**.

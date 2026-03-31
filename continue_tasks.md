# Continue Task Pack - Complete All Remaining Pages/APIs

Date: 2026-04-01  
Repo: `W:/PouchCare/PouchCare`

## Important

- The current provider error indicates billing/credit is exhausted for one model provider.
- Use Continue with another available provider/model until billing is restored.
- Do not embed secrets in prompts or files.

---

## Execution Rules for Continue Agent

Use these rules in every task:

1. Work only in this repo: `W:/PouchCare/PouchCare`.
2. Do not remove existing working features.
3. After edits, run lint/typecheck for touched apps.
4. For each task, return:
   - changed files
   - what was fixed
   - test steps
   - remaining gaps

---

## Task 1 - CEO Access and Permission Audit

### Prompt for Continue

Audit and fix all frontend and backend access control issues that block CEO credentials from opening pages.

Scope:
- Frontend permissions:
  - `apps/management/src/hooks/usePermission.ts`
  - `apps/management/src/utils/permissions.ts`
  - `apps/management/src/components/layout/Sidebar.tsx`
  - `apps/management/src/routes/index.tsx`
- Backend auth/rbac:
  - `apps/api/src/middleware/auth.ts`
  - all route files under `apps/api/src/routes/**`

Requirements:
- CEO and CO_MD must access all staff/admin pages.
- OP_MANAGER must access ops pages only.
- HR_MANAGER only HR-related privileged pages.
- Remove any string-literal role drift (`Operation Manager` vs `OP_MANAGER`) by normalizing.
- Verify all routes listed in sidebar are reachable for CEO.

Deliverables:
- code fixes
- list of corrected role gates
- manual test matrix by role.

---

## Task 2 - Route Completeness (No Missing Page Routes)

### Prompt for Continue

Match all route constants with actual route wiring and page components.

Files:
- `apps/management/src/routes/config.ts`
- `apps/management/src/routes/index.tsx`
- `apps/management/src/pages/**`

Requirements:
- Every route constant is either:
  - implemented in router with valid page, or
  - removed from config if deprecated.
- Add missing pages with basic functional shells only when truly missing.
- Ensure navigation points to valid paths.

Deliverables:
- mismatch report before/after
- exact constants resolved
- code changes.

---

## Task 3 - Security Flows Completion

### Prompt for Continue

Complete password/security flows end-to-end for staff and portal accounts.

Frontend:
- `apps/management/src/pages/settings/Security.tsx`
- `apps/management/src/pages/portal/PortalSettings.tsx`
- `apps/management/src/api/auth.ts`

Backend:
- `apps/api/src/routes/auth/index.ts`
- `apps/api/src/routes/portal/auth.ts`

Requirements:
- current password verification
- minimum password policy
- prevent same-as-old password
- clear success/error handling
- keep token/session behavior consistent

Deliverables:
- implemented endpoints and UI wiring
- tested request/response examples
- any migration or schema notes if needed.

---

## Task 4 - Portal Order Messaging Completion

### Prompt for Continue

Make portal order messages fully functional and production-ready.

Files:
- `apps/management/src/pages/portal/PortalOrderDetail.tsx`
- `apps/management/src/api/portal.ts`
- `apps/api/src/routes/portal/orders.ts`
- prisma schema (if needed)

Requirements:
- list messages
- post messages
- robust storage model (avoid fragile JSON-in-notes if schema table is better)
- timestamps + author labels
- proper validation and permissions

Deliverables:
- final implementation
- migration file if schema changed
- API contract documentation.

---

## Task 5 - Finance/Payroll/Analytics Functional Gaps

### Prompt for Continue

Close remaining non-functional behavior in finance and analytics pages.

Targets:
- `apps/management/src/pages/payroll/PayrollList.tsx` (pagination + UX)
- `apps/management/src/pages/finance/*`
- `apps/management/src/pages/analytics/Analytics.tsx`
- relevant API hooks in `apps/management/src/api/*.ts`

Requirements:
- pagination and filtering actually wired
- no placeholder actions
- loading/error/empty states consistent
- data contract alignment with backend responses

Deliverables:
- fixed pages list
- before/after behavior summary
- test steps.

---

## Task 6 - Backend Route Canonicalization

### Prompt for Continue

Eliminate duplicated/overlapping backend route implementations and keep one canonical set.

Scope:
- `apps/api/src/server.ts`
- `apps/api/src/routes/auth/*`
- `apps/api/src/routes/portal/*`
- any route files not mounted but overlapping mounted endpoints

Requirements:
- no duplicate endpoint definitions with conflicting behavior
- remove/retire dead route files safely
- keep imports and mount list clean
- ensure tests/build pass

Deliverables:
- canonical route map
- removed/deprecated files
- risk notes.

---

## Task 7 - API Contract Unification

### Prompt for Continue

Unify request/response contracts between frontend API hooks and backend envelope responses.

Scope:
- `apps/management/src/api/client.ts`
- all hooks under `apps/management/src/api/*.ts`
- backend response helpers in `apps/api/src/lib/response.ts`

Requirements:
- one consistent envelope handling strategy
- remove mixed array/envelope assumptions
- strict typing for returned data/meta
- no breaking change to existing pages

Deliverables:
- contract standard summary
- modified hooks list
- any compatibility shims.

---

## Task 8 - Final QA Sweep

### Prompt for Continue

Run full QA sweep and produce final completion report.

Checks:
- all pages load with CEO credentials
- all major sections usable: Dashboard, Staff, Tasks, Projects, Finance, CRM, HR, Assets, Support, Portal Admin
- no route 404 from sidebar
- no known placeholder actions
- lint/typecheck pass for `apps/management` and `apps/api`

Deliverables:
- final report: COMPLETED / PARTIAL / BLOCKED
- blocker list with exact file and reason
- recommended next actions.

---

## Suggested Run Order

1. Task 1  
2. Task 2  
3. Task 3  
4. Task 4  
5. Task 5  
6. Task 6  
7. Task 7  
8. Task 8

---

## Provider/Billing Recovery Notes

If Continue shows provider credit errors:

1. Switch model/provider in Continue settings to one with available balance.
2. If using Anthropic-compatible provider, top up credits first.
3. Re-run tasks from the last successful checkpoint.

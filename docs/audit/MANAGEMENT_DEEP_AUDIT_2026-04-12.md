# Management Frontend + Backend Deep Audit

Date: 2026-04-12
Scope: apps/management + apps/api
Reviewer: GitHub Copilot

## Audit Method

- Enumerated all backend route modules under apps/api/src/routes.
- Enumerated all frontend pages under apps/management/src/pages.
- Enumerated all frontend API clients under apps/management/src/api.
- Cross-checked backend HTTP methods vs frontend API hook methods.
- Deep-read high-risk modules (finance, support, notifications, projects, leave, attendance, HR performance, admin resources, API keys, tools).

## Coverage Snapshot

- Backend route modules inventoried: 39 files.
- Management pages inventoried: 92 files.
- Management API client files inventoried: 30 files.

## Findings (Ordered By Severity)

### Critical

1. Monthly revenue CRUD is incomplete end-to-end.

- Backend only provides read endpoint for revenue history.
- No create/update/delete endpoints for monthly revenue rows.
- Frontend revenue page is read-only (charts + table only).
- Evidence:
  - apps/api/src/routes/finance/index.ts (GET /revenue/monthly only)
  - apps/management/src/pages/finance/Revenue.tsx (no create/edit/delete actions)
- Impact:
  - Finance cannot maintain revenue dataset from application UI.
  - Data changes require direct DB access or ad-hoc scripts.

### High

2. Exchange rate edit/delete exists in backend but is missing in frontend API hooks and UI.

- Backend exposes full CRUD for exchange rates.
- Frontend API only has list + create hooks.
- Frontend page only supports create.
- Evidence:
  - apps/api/src/routes/admin/resources.ts (PUT/DELETE /exchange-rates/:id)
  - apps/management/src/api/admin-resources.ts (missing useUpdateExchangeRate and useDeleteExchangeRate)
  - apps/management/src/pages/finance/ExchangeRates.tsx (imports create + list only)
- Impact:
  - Incorrect rates cannot be corrected or removed from management portal.

3. Invoice paidAmount mapping is incorrect for partial payments.

- Frontend maps paidAmount as either 0 or total based on status only.
- Partial payments are displayed as 0 even when backend can carry actual paid amount.
- Evidence:
  - apps/management/src/api/finance.ts (mapInvoice sets paidAmount to status === PAID ? total : 0)
- Impact:
  - Finance summary/detail can show wrong receivable state.

4. Ticket detail page has no status management actions despite backend support.

- Backend supports ticket status updates.
- Frontend API hook for update exists.
- Ticket detail page only allows replies; no status transition UI.
- Evidence:
  - apps/api/src/routes/support/index.ts (PUT /tickets/:id)
  - apps/management/src/api/support.ts (useUpdateTicket exists)
  - apps/management/src/pages/support/TicketDetail.tsx (no status update actions)
- Impact:
  - Support workflow is incomplete in primary ticket detail screen.

5. HR performance form requires manual staff UUID input.

- Form requests "Staff Member ID" as free text.
- No staff picker/search integration.
- Evidence:
  - apps/management/src/pages/hr/Performance.tsx (Staff Member ID input)
- Impact:
  - Real-world usability is poor; high chance of invalid submissions.

### Medium

6. Attendance manual create flow is missing in management app.

- Backend supports creating attendance records.
- Frontend API layer does not expose a create attendance hook.
- Team Attendance UI supports edit/delete flow only.
- Evidence:
  - apps/api/src/routes/attendance/index.ts (POST /attendance exists)
  - apps/management/src/api/attendance.ts (no useCreateAttendance)
  - apps/management/src/pages/attendance/TeamAttendance.tsx (no create action)
- Impact:
  - Managers cannot backfill missed check-ins from UI.

7. Leave management lacks admin-side create-on-behalf flow.

- Existing flow is staff self-apply endpoint and form.
- No manager create endpoint for backdated/manual leave entries.
- Evidence:
  - apps/api/src/routes/leave/index.ts (POST /apply only)
  - apps/management/src/pages/leave/LeaveRequestForm.tsx (self-apply flow)
- Impact:
  - HR/manager cannot record leave for staff when needed.

8. Project delete UX is misleading relative to backend behavior.

- Backend "delete" route cancels project by setting status CANCELLED.
- Frontend shows "Project deleted" and redirects as if hard delete happened.
- Evidence:
  - apps/api/src/routes/projects/index.ts (DELETE sets status: CANCELLED)
  - apps/management/src/pages/projects/ProjectDetail.tsx (toast.success('Project deleted'))
- Impact:
  - User expectation mismatch and confusion when project still exists in lists.

9. Notifications page is read-only while backend supports management actions.

- Backend supports mark-read, delete-one, delete-read.
- Frontend API exposes mark-read hooks only; no delete hooks.
- UI page does not expose mark-read/delete controls.
- Evidence:
  - apps/api/src/routes/notifications/index.ts
  - apps/management/src/api/notifications.ts
  - apps/management/src/pages/notifications/NotificationList.tsx
- Impact:
  - Notification center cannot be cleaned or triaged from UI.

10. API key management misses update/rotate actions available in backend.

- Backend supports PUT update and POST rotate.
- Frontend API has list/create/revoke only.
- UI page has generate/revoke only.
- Evidence:
  - apps/api/src/routes/api-keys/index.ts
  - apps/management/src/api/api-keys.ts
  - apps/management/src/pages/settings/ApiKeys.tsx
- Impact:
  - No lifecycle control for active keys without direct API calls.

### Low / Architectural Risk

11. Payroll routes are duplicated across namespaces with uneven capability.

- Full payroll CRUD exists at /v1/payroll.
- A separate subset also exists under /v1/finance/payroll with only list/create.
- Frontend uses /payroll endpoints, not /finance/payroll.
- Evidence:
  - apps/api/src/routes/payroll/index.ts
  - apps/api/src/routes/finance/index.ts
  - apps/management/src/api/payroll.ts
- Impact:
  - Contract drift risk and maintenance ambiguity.

## Confirmed Complete Areas

- CRM leads/orders/client accounts: full backend + frontend CRUD.
- Finance invoices/expenses: backend + frontend CRUD available.
- Payroll main module: backend + frontend CRUD (plus mark paid) available.
- Tasks workflow: create/update/delete plus submit/approve/reject/verify/rate.
- Assets (domains/servers/websites/devices): CRUD coverage present.
- Plugins core flow: list/detail/create/publish/update available.

## Resolved Concern During Verification

- Daily reports reviewed status mapping is handled in frontend normalization.
- REVIEWED is mapped to APPROVED_MGR in frontend API layer.
- Evidence: apps/management/src/api/reports.ts (normalizeApprovalStatus).

## Recommended Remediation Sequence

1. Revenue CRUD (backend + frontend).
2. Exchange rate edit/delete hooks + UI.
3. Invoice paidAmount mapping correction.
4. Ticket status management actions in TicketDetail.
5. HR performance staff selector.
6. Attendance create hook + TeamAttendance add modal.
7. Leave admin create-on-behalf flow.
8. Notifications actions (mark one/all + delete one/read).
9. API key update/rotate support in API hooks + settings UI.
10. Project cancel/delete language alignment and UX.
11. Payroll route canonicalization decision.

## Execution Notes

- No destructive git actions were used.
- This report is evidence-backed from source reads and method matrix cross-checks.

## Remediation Status Update (2026-04-12)

Implemented:

- Monthly revenue full CRUD: backend endpoints + management page create/edit/delete.
- Exchange rates edit/delete: hooks + page actions.
- Invoice paid amount mapping: uses backend paidAmount where available.
- Ticket detail status controls: managers can update state directly.
- HR performance staff selection: replaced manual UUID entry with staff picker.
- Team attendance manual add: backend endpoint + API hook + create modal.
- Leave create-on-behalf: backend endpoint + API hook + manager modal in LeaveList.
- Notifications actions: mark one/all read, delete one, clear read.
- API keys lifecycle: update metadata + rotate key in settings UI.
- Project UX alignment: delete labeling changed to cancellation semantics.

Resolved:

- Payroll endpoint drift: canonical namespace finalized to /v1/payroll, and duplicate /v1/finance/payroll routes were removed.

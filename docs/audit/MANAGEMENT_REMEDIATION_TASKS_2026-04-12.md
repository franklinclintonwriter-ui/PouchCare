# Management Remediation Tasks and Progress

Date: 2026-04-12
Source: docs/audit/MANAGEMENT_DEEP_AUDIT_2026-04-12.md
Owner: Engineering

## Progress Legend

- Status: Not Started | In Progress | Blocked | Done
- Progress: 0-100

## Program Progress

- Total tasks: 11
- Completed: 11
- In progress: 0
- Blocked: 0
- Program progress: 100%

## Task Board

1. Revenue CRUD (backend + frontend)

- Priority: Critical
- Status: Done
- Progress: 100
- Scope:
  - Add POST/PUT/DELETE revenue endpoints in apps/api/src/routes/finance/index.ts
  - Add hooks in apps/management/src/api/finance.ts
  - Add create/edit/delete UI in apps/management/src/pages/finance/Revenue.tsx
- Acceptance:
  - User can create, edit, delete monthly revenue entries from management UI.
  - Revenue table and charts update correctly after mutations.

2. Exchange rates edit/delete completion

- Priority: High
- Status: Done
- Progress: 100
- Scope:
  - Add useUpdateExchangeRate and useDeleteExchangeRate in apps/management/src/api/admin-resources.ts
  - Add edit/delete actions in apps/management/src/pages/finance/ExchangeRates.tsx
- Acceptance:
  - Existing exchange rates can be edited and removed from UI.

3. Invoice paidAmount mapping fix

- Priority: High
- Status: Done
- Progress: 100
- Scope:
  - Update mapInvoice in apps/management/src/api/finance.ts to use backend paidAmount field when available.
- Acceptance:
  - PARTIAL invoices display accurate paid amount and remaining balance.

4. TicketDetail status controls

- Priority: High
- Status: Done
- Progress: 100
- Scope:
  - Add status change actions in apps/management/src/pages/support/TicketDetail.tsx
  - Reuse useUpdateTicket hook from apps/management/src/api/support.ts
- Acceptance:
  - Staff/managers can update ticket status from detail page.

5. HR performance staff selector

- Priority: High
- Status: Done
- Progress: 100
- Scope:
  - Replace free-text Staff Member ID with searchable staff picker in apps/management/src/pages/hr/Performance.tsx
  - Populate staffMemberId and staffName from selected user.
- Acceptance:
  - Review can be created without manually typing UUIDs.

6. Attendance manual create flow

- Priority: Medium
- Status: Done
- Progress: 100
- Scope:
  - Add useCreateAttendance hook in apps/management/src/api/attendance.ts
  - Add create modal/action in apps/management/src/pages/attendance/TeamAttendance.tsx
- Acceptance:
  - Managers can add attendance records for a selected date/staff.

7. Leave admin create-on-behalf flow

- Priority: Medium
- Status: Done
- Progress: 100
- Scope:
  - Add backend endpoint for manager/HR to create leave for any staff.
  - Add UI in leave list or dedicated form to choose target staff.
- Acceptance:
  - Manager can create leave request on behalf of another staff member.

8. Notifications action completeness

- Priority: Medium
- Status: Done
- Progress: 100
- Scope:
  - Add delete hooks in apps/management/src/api/notifications.ts
  - Add mark-read and delete actions in apps/management/src/pages/notifications/NotificationList.tsx
- Acceptance:
  - User can mark one/all as read and remove notifications from UI.

9. API key update/rotate support

- Priority: Medium
- Status: Done
- Progress: 100
- Scope:
  - Add update + rotate hooks in apps/management/src/api/api-keys.ts
  - Add update/rotate actions in apps/management/src/pages/settings/ApiKeys.tsx
- Acceptance:
  - Active key can be rotated and metadata updated from management UI.

10. Project cancel/delete UX correction

- Priority: Medium
- Status: Done
- Progress: 100
- Scope:
  - Align UI language in apps/management/src/pages/projects/ProjectDetail.tsx with backend cancellation behavior.
  - Optionally rename action from Delete to Cancel Project.
- Acceptance:
  - User feedback and action labels match actual backend effect.

11. Payroll endpoint canonicalization

- Priority: Low
- Status: Done
- Progress: 100
- Scope:
  - Decide canonical payroll namespace (/payroll or /finance/payroll)
  - Deprecate or align secondary route to avoid drift
- Acceptance:
  - Single documented payroll API contract with no partial duplicate.

## Implementation Delta (2026-04-12)

- Task 1 done: Added backend revenue POST/PUT/DELETE and frontend CRUD hooks + UI modals/actions.
- Task 2 done: Added exchange rate update/delete hooks and page-level edit/delete actions.
- Task 3 done: Invoice mapping now reads backend paidAmount.
- Task 4 done: TicketDetail now supports manager status transitions.
- Task 5 done: Performance form uses staff picker instead of manual UUID entry.
- Task 6 done: Added manager attendance create endpoint, API hook, and TeamAttendance create modal.
- Task 7 done: Added manager leave create endpoint, API hook, and LeaveList create-on-behalf modal.
- Task 8 done: Notifications now support mark one/all read and delete one/clear read.
- Task 9 done: API keys now support update and rotate in API hooks + settings UI.
- Task 10 done: Project action text and confirmations now correctly represent cancellation.
- Task 11 done: Canonical payroll namespace finalized to /payroll; duplicate /finance/payroll routes removed.

## Suggested Delivery Waves

- Wave 1 (Fast high impact): Tasks 2, 3, 4, 10
- Wave 2 (Core functional gaps): Tasks 1, 5
- Wave 3 (Operational completeness): Tasks 6, 7, 8, 9
- Wave 4 (Architecture hygiene): Task 11

## Tracking Template For Daily Updates

Use this template for each task update:

- Task ID:
- Status:
- Progress:
- What changed:
- Blockers:
- Next step:

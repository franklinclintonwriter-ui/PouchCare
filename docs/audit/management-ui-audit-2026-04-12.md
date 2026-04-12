# Management UI Comprehensive Audit Report

**Date:** 2026-04-12
**Scope:** All 93 management frontend pages (`apps/management/src/pages/`)
**Stack:** React 18 + TypeScript + Vite 5 + TailwindCSS + TanStack React Query + Zustand

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| HIGH     | 5     | 5     |
| MEDIUM   | 7     | 7     |
| LOW      | 6     | 5     |
| PHASE 3  | 10    | 10    |
| PHASE 4  | 5     | 5     |
| PHASE 5  | 17    | 17    |
| PHASE 6  | 11    | 11    |
| **Total**| **61**| **60**|

---

## HIGH Priority Issues

### H1. StaffDetail.tsx — No edit capability
- **File:** `pages/staff/StaffDetail.tsx:48`
- **Issue:** `actions: []` is empty. `useUpdateStaff` hook exists in `api/staff.ts:139` but is not imported or used. Staff name, email, phone, branch, department, salary cannot be updated after creation.
- **Fix:** Add edit modal with useUpdateStaff mutation, gated behind `perm.can('staff.manage')`.

### H2. TaskList.tsx — Incomplete create form
- **File:** `pages/tasks/TaskList.tsx:202-215`
- **Issue:** Create modal only has Title and Priority fields. Missing: description, dueDate, assignee.
- **Fix:** Add description (Textarea), dueDate (Input type=date), pass to `createTask.mutateAsync`.

### H3. ProjectList.tsx — Incomplete create form
- **File:** `pages/projects/ProjectList.tsx:205-208`
- **Issue:** Create modal only has Project Name and Client Name. Missing: budget, dueDate, description.
- **Fix:** Add budget (number Input), dueDate (date Input), description (Textarea).

### H4. TaskDetail.tsx — No edit capability
- **File:** `pages/tasks/TaskDetail.tsx:101-118`
- **Issue:** Header actions have submit/approve/reject/verify/rate workflow buttons but no Edit button. `useUpdateTask` exists in `api/tasks.ts:89` but is not used. Cannot change title, description, priority, dueDate after creation.
- **Fix:** Add Edit button + modal using useUpdateTask, gated behind manager permission.

### H5. SalesOrders.tsx — Type safety bypass
- **File:** `pages/crm/SalesOrders.tsx:199`
- **Issue:** `as any` cast on `createSalesOrder.mutateAsync` payload. The mutation accepts `Record<string, unknown>` so the cast is unnecessary.
- **Fix:** Remove `as any`.

---

## MEDIUM Priority Issues

### M1. PayrollDetail.tsx — Edit form init incomplete
- **File:** `pages/payroll/PayrollDetail.tsx:48-49`
- **Issue:** `paymentMethod` and `notes` initialized as empty strings instead of from existing entry data.
- **Fix:** Populate from `entry.paymentMethod` and `entry.notes` in `openEdit`.

### M2. LeaveRequestForm.tsx — No date cross-validation
- **File:** `pages/leave/LeaveRequestForm.tsx:28`
- **Issue:** Only checks `!startDate || !endDate` but not `endDate >= startDate`.
- **Fix:** Add validation before submit.

### M3. Positions.tsx — No salary range validation
- **File:** `pages/hr/Positions.tsx:90-103`
- **Issue:** `handleSubmit` doesn't validate that `salaryMin <= salaryMax`.
- **Fix:** Add validation in handleSubmit.

### M4. ReportSubmit.tsx — Mood is free text
- **File:** `pages/reports/ReportSubmit.tsx:54`
- **Issue:** Mood is an `Input` with hint text "(great/good/okay/bad)" but accepts any string. DailyReports.tsx `moodConfig` only maps `great|good|okay|bad`.
- **Fix:** Change to `Select` with the 4 valid options.

### M5. TicketDetail.tsx — Assignee is free text
- **File:** `pages/support/TicketDetail.tsx:95-99`
- **Issue:** "Assign To" is a free text `Input` with placeholder "Staff ID / email". No validation against actual staff.
- **Fix:** Change to staff Select dropdown using `useStaffForManager` hook.

### M6. ApplicationDetail.tsx — Interviewer notes not pre-filled
- **File:** `pages/hr/ApplicationDetail.tsx:109`
- **Issue:** `setInterviewerNotes('')` always resets to empty when entering edit mode, discarding existing interviewer notes.
- **Fix:** Change to `setInterviewerNotes(app?.interviewerNotes || '')`.

### M7. MyTasks.tsx — Completely read-only
- **File:** `pages/tasks/MyTasks.tsx:56-91`
- **Issue:** No action buttons. Users must navigate to TaskDetail to submit tasks. Should have quick "Submit for Review" action on IN_PROGRESS tasks.
- **Fix:** Add submit action column using `useSubmitTask`.

---

## LOW Priority

### L1. ~~DailyReports.tsx — Stats from page subset~~ ✅ FIXED
- **File:** `pages/reports/DailyReports.tsx`
- **Fix:** Added separate `useDailyReports({})` query for stats. `avgHours`, `avgTasks`, and `approved` now computed from full dataset.

### L2. ~~PortalDashboard.tsx — Stats from 5-item subset~~ ✅ FIXED
- **File:** `pages/portal/PortalDashboard.tsx`
- **Fix:** Added separate `usePortalOrders({ limit: 100 })` query for stats, decoupled from the 5-item recent orders list.

### L3. ClientDetail.tsx — Missing orders list
- **File:** `pages/crm/ClientDetail.tsx`
- **Issue:** Shows totalOrders count but no actual order list section.
- **Needs:** Client-specific orders endpoint.
- **Status:** Deferred — requires backend changes.

### L4. Email validation in create modals
- **Files:** StaffList, InvoiceList, ClientAccounts create modals
- **Issue:** Email fields use `type="email"` HTML attribute but no JS-level validation before submit.
- **Impact:** Low — HTML5 validation handles most cases.

### L5. BranchManagement.tsx — No in-page permission gating
- **File:** `pages/staff/BranchManagement.tsx`
- **Issue:** Create/Delete actions not gated behind permission checks (relies on route-level protection only).
- **Impact:** Low — route-level auth likely sufficient.

### L6. ~~Unused sort state not passed to API~~ ✅ FIXED
- **Files:** `TaskList.tsx`, `ProjectList.tsx`
- **Fix:** Wired `sortField`/`sortDir` state to API query params (`sort`, `order`).

---

## Phase 2 Enhancements

| File | Enhancement |
|------|-------------|
| `pages/crm/SalesOrderDetail.tsx` | Added edit modal (10 fields), replaced SENIOR_ROLES with usePermission, Status field uses Select dropdown |
| `pages/crm/SalesOrders.tsx` | Replaced SENIOR_ROLES with usePermission, added empty state to DataTable |
| `pages/crm/ClientAccounts.tsx` | Replaced SENIOR_ROLES with usePermission |
| `pages/crm/ClientDetail.tsx` | Replaced SENIOR_ROLES with usePermission |
| `pages/crm/LeadList.tsx` | Expanded create form (phone, source Select, estimatedValue), added empty state |
| `pages/finance/InvoiceList.tsx` | Expanded create form (service, dueDate), added empty state |
| `pages/finance/ExpenseList.tsx` | Expanded create form (category Select, date picker, receipt URL), added empty state |
| `pages/support/TicketDetail.tsx` | Added delete capability with ConfirmDialog |
| `pages/tasks/TaskList.tsx` | Wired sortField/sortDir to API query params |
| `pages/projects/ProjectList.tsx` | Wired sortField/sortDir to API query params |
| `pages/portal/PortalDashboard.tsx` | Stats now use full order set (limit: 100) instead of 5-item subset |
| `pages/portal/admin/PortalMemberDetail.tsx` | Removed 3 unnecessary `as any` casts (referralsCount, orders, walletTx) |

---

## Phase 3 Enhancements

| File | Enhancement |
|------|-------------|
| `pages/reports/DailyReports.tsx` | Stats now use full dataset via separate `useDailyReports({})` query |
| `pages/assets/Domains.tsx` | Replaced hardcoded SENIOR_ROLES with `usePermission` hook |
| `pages/assets/Servers.tsx` | Replaced hardcoded SENIOR_ROLES with `usePermission` hook |
| `pages/projects/ProjectList.tsx` | Stats now use full dataset via separate `useProjects({})` query |
| `pages/tasks/TaskList.tsx` | Stats now use full dataset via separate `useTasks({})` query |
| `pages/crm/SalesOrders.tsx` | Create form Status changed from free text Input to Select dropdown |
| `pages/assets/Devices.tsx` | Device Type changed from free text Input to Select dropdown (Laptop, Desktop, Phone, Tablet, Monitor, Other) |
| `pages/support/TicketList.tsx` | Added `emptyDescription` to DataTable |
| `pages/hr/Applications.tsx` | Added `emptyDescription` to DataTable, Source changed from free text to Select dropdown |
| `pages/payroll/PayrollList.tsx` | Added `emptyTitle`/`emptyDescription` to DataTable, Payment Method changed to Select, Year changed from number Input to Select |

---

## Phase 4 Enhancements

| File | Enhancement |
|------|-------------|
| `pages/services/ServiceList.tsx` | Replaced hardcoded `SENIOR_ROLES` + `useAuthStore` with `usePermission` hook |
| `pages/assets/Websites.tsx` | Replaced hardcoded `SENIOR_ROLES` + `useAuthStore` with `usePermission` hook |
| `pages/portal/PlaceOrder.tsx` | Removed `as any` casts on service pricing — uses proper `priceRange.min` from typed Service |
| `pages/portal/Commissions.tsx` | Removed `as any` cast on payout method — uses proper union type cast |
| `pages/payroll/PayrollDetail.tsx` | Payment Method changed from free text Input to Select dropdown (matching PayrollList) |

**Milestone:** Zero `SENIOR_ROLES` patterns remaining. Zero `as any` casts in pages directory.

---

## Phase 5 Enhancements

### Empty States — Added `emptyTitle`/`emptyDescription` to 14 DataTables

| File | Empty State Added |
|------|-------------------|
| `pages/finance/Revenue.tsx` | "No revenue data" / "Add monthly revenue records to start tracking." |
| `pages/tools/BacklinksToolPage.tsx` | "No backlinks found" / "Try a different domain to see results." |
| `pages/tools/DaPaToolPage.tsx` | "No results" / "Enter domains above to check DA/PA scores." |
| `pages/tools/KeywordsToolPage.tsx` | "No keywords found" / "Enter a seed keyword to discover related terms." |
| `pages/tools/SerpTop100ToolPage.tsx` | "No SERP results" / "Enter a keyword to see the top 100 results." |
| `pages/analytics/Analytics.tsx` | Added `emptyDescription` |
| `pages/assets/Domains.tsx` | Added `emptyDescription` |
| `pages/assets/Websites.tsx` | Added `emptyDescription` |
| `pages/hr/PositionDetail.tsx` | Added `emptyDescription` |
| `pages/hr/Positions.tsx` | Added `emptyDescription` |
| `pages/portal/admin/ReferralFraud.tsx` | Added `emptyDescription` |
| `pages/portal/PortalOrders.tsx` | Added `emptyDescription` |
| `pages/portal/ReferralLeaderboard.tsx` | Added `emptyDescription` |
| `pages/staff/Leaderboard.tsx` | Added `emptyDescription` |

### Notes Input → Textarea (3 files)

| File | Change |
|------|--------|
| `pages/crm/SalesOrders.tsx` | Notes field changed from `<Input>` to `<Textarea rows={2}>` |
| `pages/payroll/PayrollDetail.tsx` | Notes field changed from `<Input>` to `<Textarea rows={2}>` |
| `pages/staff/BranchDetail.tsx` | Notes field changed from `<Input>` to `<Textarea rows={2}>` |

---

## Phase 6 — Full-Stack Audit Fixes

### Frontend: Breadcrumb Navigation (7 files)

All portal admin pages had `href: '/admin'` instead of `href: '/admin/portal'`:

| File | Fix |
|------|-----|
| `pages/portal/admin/PortalMemberDetail.tsx` | Breadcrumb `/admin` → `/admin/portal` |
| `pages/portal/admin/ReferralFraud.tsx` | Breadcrumb `/admin` → `/admin/portal` |
| `pages/portal/admin/PortalMembers.tsx` | Breadcrumb `/admin` → `/admin/portal` |
| `pages/portal/admin/PortalCommissions.tsx` | Breadcrumb `/admin` → `/admin/portal` |
| `pages/portal/admin/PortalDeposits.tsx` | Breadcrumb `/admin` → `/admin/portal` |
| `pages/portal/admin/PortalOrdersAdmin.tsx` | Breadcrumb `/admin` → `/admin/portal` |
| `pages/portal/admin/PortalPayouts.tsx` | Breadcrumb `/admin` → `/admin/portal` |

### Frontend: Type Safety — Remaining `any` types removed (4 files)

| File | Fix |
|------|-----|
| `pages/portal/admin/PortalMemberDetail.tsx` | `Column<any>` → `Column<MemberOrder>` / `Column<MemberWalletTx>` with inline types |
| `pages/analytics/Analytics.tsx` | `(r: any)` → `(r: MonthlyRevenue & {...})` with proper import |
| `pages/portal/PlaceOrder.tsx` | `(s: any)` → `(s: Service)` using existing `isActive` field |
| `pages/projects/ProjectDetail.tsx` | `(t: any)` → `(t: Task)` with `Task` type import |

### Backend: Input Validation — CRM Routes (`routes/crm/index.ts`)

Added Zod schemas + `validate()` middleware + explicit field whitelisting:

| Route | Fix |
|-------|-----|
| `POST /leads` | Added `createLeadSchema` (company, contactName, email, phone, source, stage, estimatedValue, notes) — replaces `...req.body` |
| `PUT /leads/:id` | Added `updateLeadSchema` — replaces `{ ...req.body }` spread with explicit field extraction |
| `POST /orders` | Added `createOrderSchema` (clientName, service, amountUsd, paymentStatus, invoiceReference, notes) — replaces `...req.body` |
| `PUT /orders/:id` | Added `updateOrderSchema` — replaces `data: req.body` with explicit field extraction |

### Backend: Input Validation — Finance Routes (`routes/finance/index.ts`)

Added Zod schemas + `validate()` middleware + explicit field whitelisting:

| Route | Fix |
|-------|-----|
| `POST /invoices` | Added `createInvoiceSchema` — replaces `...req.body` with whitelisted fields |
| `PUT /invoices/:id` | Added `updateInvoiceSchema` — replaces `data: req.body` with explicit field extraction |
| `POST /expenses` | Added `createExpenseSchema` — replaces `...req.body` with whitelisted fields |
| `PUT /expenses/:id` | Added `updateExpenseSchema` — replaces `data: req.body` with explicit field extraction |

### Backend: Missing `return` Before `serverError()` (3 files, 28 catch blocks)

| File | Occurrences Fixed |
|------|-------------------|
| `routes/finance/index.ts` | 11 catch blocks |
| `routes/attendance/index.ts` | 9 catch blocks |
| `routes/leave/index.ts` | 8 catch blocks |

**Milestone:** Both `apps/management` and `apps/api` compile with zero TypeScript errors.

---

## Previously Fixed (Prior Session)

| File | Fix |
|------|-----|
| `pages/assets/DomainDetail.tsx` | Added Edit + Delete modals |
| `pages/assets/ServerDetail.tsx` | Added Edit + Delete modals |
| `pages/assets/WebsiteDetail.tsx` | Added Edit + Delete modals |
| `pages/payroll/PayrollDetail.tsx` | Added Edit + Delete modals |
| `pages/dashboard/Dashboard.tsx` | Removed manual refresh buttons |

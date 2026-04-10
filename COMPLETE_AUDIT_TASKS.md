# PouchCare — Complete Codebase Audit & Task List

**Generated:** 2026-04-10  
**Auditor:** AI Agent (Deep Dive Verification)

---

## Executive Summary

The original audit from `full_codebase_audit_42232e59.plan.md` has been **verified and updated**. Several issues marked as problems are **now resolved** or were **incorrectly identified**. This document provides the complete, verified task list.

### Audit Status Legend
- ✅ **RESOLVED** — Issue from original audit is now fixed
- ⚠️ **CONFIRMED** — Issue verified, needs work
- 🆕 **NEW** — Issue discovered during deep dive
- 🔄 **UPDATED** — Original issue updated with new findings

---

## Section 1 — API Status (Verified)

### 1.1 Original "Stubs/Not Implemented" — RESOLVED ✅

| Original Claim | Actual Status |
|----------------|---------------|
| `POST /auth/reset-password` is stub | ✅ Implemented with real token logic |
| `POST /auth/forgot-password` only logs | ✅ Uses Resend in production |
| `POST /portal/reset-password` TODO | ✅ Implemented (dev token logging for debugging only) |

### 1.2 Original "Missing Routes" — VERIFIED STATUS

| Module | Original Missing | Actual Status |
|--------|-----------------|---------------|
| **Leave** | `GET /:id`, `PUT /:id`, `DELETE /:id` | ✅ All exist now |
| **Reports** | `GET /:id`, `DELETE /:id` | ✅ `GET /daily/:id` and `DELETE /daily/:id` exist |
| **Performance** | `GET /:id`, `PUT /:id`, `DELETE /:id` | ✅ All exist |
| **Payroll** | `PUT /:id`, `DELETE /:id` | ✅ All exist |
| **Finance Invoices** | `DELETE /:id` | ✅ Exists |
| **Finance Expenses** | `GET /:id`, `DELETE /:id` | ✅ Both exist |
| **Assets/Domains** | `GET /:id`, `DELETE /:id` | ✅ Full CRUD exists |
| **Assets/Servers** | All CRUD | ✅ Full CRUD exists |
| **Assets/Websites** | All CRUD | ✅ Full CRUD exists |
| **HR/Positions** | `GET /:id`, `DELETE /:id` | ✅ Full CRUD exists |
| **HR/Applications** | `GET /:id`, `DELETE /:id` | ✅ Full CRUD exists |
| **HR/Performance** | All CRUD | ✅ Full CRUD exists |
| **CRM/Orders** | `GET /:id`, `DELETE /:id` | ✅ Full CRUD exists |
| **Broadcast** | `GET /:id`, `DELETE /:id` | ✅ Exist; ⚠️ Missing `PUT /:id` for edit |
| **Support/Tickets** | `DELETE /:id` | ⚠️ Still missing |
| **Services** | `DELETE /admin/:id` | ✅ Exists |

### 1.3 Unmounted Route Files — VERIFIED

| Original Claim | Actual Status |
|----------------|---------------|
| `routes/auth/staff.ts` unmounted | ✅ File doesn't exist (false positive) |
| `routes/portal/index.ts` unmounted | ✅ Not needed, individual routes mounted |
| `routes/admin/index.ts` unmounted | ✅ Not needed, resources.ts used |
| `routes/portal/members.ts` unmounted | ✅ Handled via `admin/portal.ts` |
| `routes/assets/hr.ts` unmounted | ✅ File doesn't exist |

---

## Section 2 — Frontend Status (Verified)

### 2.1 Pages with Missing Actions — UPDATED STATUS

| Page | Original Issue | Actual Status |
|------|---------------|---------------|
| **Leave List** | Approve/Reject/Cancel not wired | ⚠️ **NEEDS VERIFICATION** — hooks exist |
| **Payroll List** | No Create/Mark Paid | ⚠️ **NEEDS VERIFICATION** |
| **HR Positions** | No create/edit modal | ⚠️ **NEEDS VERIFICATION** |
| **HR Applications** | No status change | ✅ Status changes wired |
| **Broadcast List** | No compose button | ⚠️ Compose exists; no shareable detail URL |

### 2.2 Hard-coded Data — VERIFIED

| Page | Issue | Status |
|------|-------|--------|
| **Analytics** | KPI deltas hard-coded | ✅ **RESOLVED** — Dashboard uses real trends |
| **Preferences** | Local state only | ✅ Uses localStorage + currency via API |

### 2.3 Missing Detail Pages — CURRENT STATUS

| Resource | Status |
|----------|--------|
| Leave Detail (`/leave/:id`) | ⚠️ Missing route |
| HR Position Detail (`/hr/positions/:id`) | ⚠️ Missing route |
| CRM Client Detail (`/crm/clients/:id`) | ⚠️ Missing route |
| Asset Device Detail (`/assets/devices/:id`) | ⚠️ Missing route |
| Broadcast Detail (`/broadcast/:id`) | ⚠️ Modal only, no shareable URL |

**RESOLVED Detail Pages:**
- ✅ Invoice Detail (`/finance/invoices/:id`)
- ✅ Expense Detail (`/finance/expenses/:id`)
- ✅ Payroll Detail (`/payroll/:id`)
- ✅ Domain/Server/Website Detail (all exist)
- ✅ HR Application Detail (`/hr/applications/:id`)

---

## Section 3 — API/Frontend Mismatches (Verified)

| # | Original Issue | Status |
|---|---------------|--------|
| 1 | No `GET /admin/devices/:id` | ✅ Full CRUD exists |
| 2 | No `GET /assets/domains/:id` | ✅ Exists |
| 3 | Servers/Websites read-only | ✅ Full CRUD exists |
| 4 | Backlink packages duplicate paths | ⚠️ Still dual paths, works but confusing |
| 5 | Finance forecast not called | ✅ Dashboard uses `/analytics/forecast`, Finance page uses `/finance/forecast` — **intentional split** |
| 6 | Attendance DELETE missing | ⚠️ Still missing |
| 7 | Password reset stub | ✅ Implemented |
| 8 | KPI deltas fake | ✅ Real trend data now |
| 9 | Deposit approval no UI | ⚠️ `/admin/portal/deposits` page exists with approve/reject |
| 10 | Services create no UI | ⚠️ **NEEDS VERIFICATION** |

---

## Section 4 — NEW Issues Found in Deep Dive 🆕

### 4.1 QuickActions Component Broken

**File:** `apps/management/src/components/dashboard/QuickActions.tsx`

**Issues:**
1. **Invalid Permission Keys** — Uses permissions not in `PERMISSION_KEYS`:
   - `staff.create` ❌ (should be `staff.manage_profiles`)
   - `tasks.create` ❌ (no such permission)
   - `crm.access` ❌ (should be `crm.client_accounts` or none)
   - `clients.access` ❌ (no such permission)
   - `attendance.access` ❌ (no such permission)
   - `branches.access` ❌ (should be `staff.branches`)

2. **Invalid Routes** — Links to non-existent paths:
   - `/staff/new` ❌ (no such route)
   - `/tasks/new` ❌ (no such route)
   - `/finance/expenses/new` ❌ (no such route)
   - `/crm/leads/new` ❌ (no such route)
   - `/clients` ❌ (should be `/crm/clients`)
   - `/branches` ❌ (should be `/staff/branches`)

### 4.2 Unused API Hooks

| File | Unused Hooks |
|------|--------------|
| `api/analytics.ts` | `useRevenueAnalytics`, `useLeaderboard`, `useTaskStats`, `useActivities` |
| `api/crm.ts` | `useSalesOrder`, `useCreateSalesOrder` |
| `api/documents.ts` | `useUpdateDocument` |
| `api/hr.ts` | `usePosition` |
| `api/monitor.ts` | Camera CRUD hooks (5 hooks) |
| `api/portal.ts` | `useRequestRevision`, `usePayoutsData` |
| `api/projects.ts` | `useUpdateProject`, `useDeleteProject` |
| `api/tasks.ts` | `useDeleteTask` |
| `api/attendance.ts` | `useStaffAttendance` |

### 4.3 Missing Route Constants

**File:** `apps/management/src/routes/config.ts`

Missing constants for existing routes:
- `LEAVE_REQUEST: '/leave/request'`
- `REPORT_SUBMIT: '/reports/submit'`
- `ATTENDANCE_CHECK: '/attendance/check'`
- `BRANCH_DETAIL: '/staff/branches/:branchId'`

### 4.4 Sidebar Navigation Gaps

- Staff Leaderboard (`/staff/leaderboard`) — route exists, no sidebar link
- Portal Referral Leaderboard (`/portal/referrals/leaderboard`) — route exists, no nav link
- Leave Request, Report Submit, Attendance Check — routes exist, accessible only via in-page links

### 4.5 Dual Forecast Endpoints

- Dashboard: Uses `GET /v1/analytics/forecast`
- Finance Forecast Page: Uses `GET /v1/finance/forecast`
- **Risk:** Potential inconsistent numbers between pages

### 4.6 Performance Route Unguarded

- `/performance` route lacks `hr.performance` permission guard
- Should be guarded like other HR routes

---

## Section 5 — Complete Task List (Prioritized)

### Priority 1 — CRITICAL (Broken Functionality)

| ID | Task | Type | Files |
|----|------|------|-------|
| P1-01 | Fix QuickActions permission keys | Frontend | `QuickActions.tsx` |
| P1-02 | Fix QuickActions routes | Frontend | `QuickActions.tsx` |
| P1-03 | Add `DELETE /support/tickets/:id` to API | API | `routes/support/index.ts` |
| P1-04 | Add `DELETE /attendance/:id` to API | API | `routes/attendance/index.ts` |
| P1-05 | Add `PUT /broadcast/:id` to API | API | `routes/broadcast/index.ts` |

### Priority 2 — HIGH (Missing Core Features)

| ID | Task | Type | Files |
|----|------|------|-------|
| P2-01 | Create Leave detail page + route | Frontend | `pages/leave/LeaveDetail.tsx`, `routes/index.tsx` |
| P2-02 | Create Position detail page + route | Frontend | `pages/hr/PositionDetail.tsx`, `routes/index.tsx` |
| P2-03 | Create CRM Client detail page + route | Frontend | `pages/crm/ClientDetail.tsx`, `routes/index.tsx` |
| P2-04 | Create Device detail page + route | Frontend | `pages/assets/DeviceDetail.tsx`, `routes/index.tsx` |
| P2-05 | Wire Leave approve/reject/cancel actions | Frontend | `pages/leave/LeaveList.tsx` |
| P2-06 | Wire Payroll create + mark-paid actions | Frontend | `pages/payroll/PayrollList.tsx` |
| P2-07 | Add HR Positions create/edit modal | Frontend | `pages/hr/Positions.tsx` |
| P2-08 | Add Broadcast shareable detail route | Frontend | `pages/broadcast/BroadcastDetail.tsx` |

### Priority 3 — MEDIUM (Polish & Consistency)

| ID | Task | Type | Files |
|----|------|------|-------|
| P3-01 | Add missing route constants | Frontend | `routes/config.ts` |
| P3-02 | Add Staff Leaderboard to sidebar | Frontend | `components/layout/Sidebar.tsx` |
| P3-03 | Add Portal Referral Leaderboard to nav | Frontend | `components/layout/Sidebar.tsx` |
| P3-04 | Guard `/performance` with permission | Frontend | `routes/index.tsx` |
| P3-05 | Clean up unused API hooks | Frontend | Multiple `api/*.ts` files |
| P3-06 | Consolidate forecast endpoints | API+Frontend | `analytics.ts`, `finance.ts` |
| P3-07 | Wire Project edit/delete mutations | Frontend | `pages/projects/ProjectDetail.tsx` |
| P3-08 | Wire Task delete action | Frontend | `pages/tasks/TaskDetail.tsx` |
| P3-09 | Wire Portal revision request | Frontend | `pages/portal/PortalOrderDetail.tsx` |
| P3-10 | Use document update hook | Frontend | `components/staff/DocumentManager.tsx` |

### Priority 4 — LOW (Nice to Have)

| ID | Task | Type | Files |
|----|------|------|-------|
| P4-01 | Add bulk attendance import | API | `routes/attendance/index.ts` |
| P4-02 | Add notification delete endpoint | API | `routes/notifications/index.ts` |
| P4-03 | Add portal account delete | API | `routes/portal/me.ts` |
| P4-04 | Delete dead file `BacklinkPackages.tsx` | Frontend | `pages/services/BacklinkPackages.tsx` |
| P4-05 | Add API key rotate/update | API | `routes/api-keys/index.ts` |
| P4-06 | Add plugin delete endpoint | API | `routes/plugins/index.ts` |

---

## Section 6 — Implementation Order Recommendation

### Phase 1 — Critical Fixes (Immediate)
1. P1-01 + P1-02: Fix QuickActions (dashboard broken)
2. P1-03 - P1-05: Add missing delete/update endpoints

### Phase 2 — Core CRUD Completion
1. P2-01 - P2-04: Missing detail pages
2. P2-05 - P2-08: Wire missing mutations

### Phase 3 — Polish
1. P3-01 - P3-04: Navigation and routing
2. P3-05 - P3-10: Hook usage and consistency

### Phase 4 — Enhancements
1. P4-01 - P4-06: Nice-to-have features

---

## Section 7 — Valid Permission Keys Reference

```typescript
// apps/management/src/constants/permissionKeys.ts
export const PERMISSION_KEYS = [
  'staff.branches',
  'staff.manage_profiles',
  'payroll.access',
  'finance.access',
  'finance.exchange_rates',
  'crm.client_accounts',
  'hr.recruitment',
  'hr.performance',
  'assets.devices',
  'monitor.view',
  'broadcast.access',
  'analytics.access',
  'admin_portal.access',
  'settings.role_permissions',
] as const;
```

**QuickActions should use:**
- `staff.manage_profiles` instead of `staff.create`
- `finance.access` ✓ (already correct)
- No permission for general tasks (remove or use different approach)
- `crm.client_accounts` instead of `crm.access` and `clients.access`
- No permission for attendance (remove or add to PERMISSION_KEYS)
- `staff.branches` instead of `branches.access`

---

## Section 8 — Verification Checklist

Before marking complete, verify:

- [ ] QuickActions shows correct links and respects permissions
- [ ] All detail pages load and display data
- [ ] All CRUD operations work end-to-end
- [ ] Sidebar links match available routes
- [ ] No console errors on page navigation
- [ ] API endpoints return expected status codes
- [ ] TypeScript has no type errors
- [ ] ESLint passes

---

## Appendix A — Files to Modify

### API Files
- `apps/api/src/routes/support/index.ts`
- `apps/api/src/routes/attendance/index.ts`
- `apps/api/src/routes/broadcast/index.ts`

### Frontend Files
- `apps/management/src/components/dashboard/QuickActions.tsx`
- `apps/management/src/routes/config.ts`
- `apps/management/src/routes/index.tsx`
- `apps/management/src/components/layout/Sidebar.tsx`
- `apps/management/src/pages/leave/LeaveList.tsx`
- `apps/management/src/pages/payroll/PayrollList.tsx`
- `apps/management/src/pages/hr/Positions.tsx`
- `apps/management/src/pages/projects/ProjectDetail.tsx`
- `apps/management/src/pages/tasks/TaskDetail.tsx`

### New Files to Create
- `apps/management/src/pages/leave/LeaveDetail.tsx`
- `apps/management/src/pages/hr/PositionDetail.tsx`
- `apps/management/src/pages/crm/ClientDetail.tsx`
- `apps/management/src/pages/assets/DeviceDetail.tsx`
- `apps/management/src/pages/broadcast/BroadcastDetail.tsx`

---

*End of Complete Audit Tasks Document*

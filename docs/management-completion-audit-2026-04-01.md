# Management Completion Audit (2026-04-01)

## Scope
- Frontend: `apps/management`
- Backend: `apps/api`
- Goal: identify all incomplete/missing management functionality and produce a prioritized completion plan.

## Executive Summary
- The system is **partially complete**. Core navigation and many CRUD surfaces exist, but there are still contract mismatches, dead-end actions, and uneven completeness across modules.
- Most urgent work is not adding random pages, but fixing **API contract drift** and **non-functional actions** in existing pages.

---

## Priority 0: Critical Blockers

1. **Notifications bulk mark-read is broken**
   - Frontend sends `{ ids: string[] }` to `/notifications/mark-read`.
   - Backend currently supports `{ id }` or `{ all }`.
   - Files:
     - `apps/management/src/api/notifications.ts`
     - `apps/api/src/routes/notifications/index.ts`
   - Required fix:
     - Support `{ ids }` in backend OR change frontend to single/batch loop with accepted payload.

2. **Finance revenue DTO mismatch**
   - Frontend analytics/finance components expect `revenue/expenses/profit`.
   - Backend monthly revenue returns DB names: `totalRevenueUsd/totalExpensesUsd/netProfitUsd`.
   - Files:
     - `apps/management/src/types/models.ts`
     - `apps/management/src/api/finance.ts`
     - `apps/api/src/routes/finance/index.ts`
   - Required fix:
     - Normalize DTO in backend response or map in frontend hook consistently.

3. **Notification DTO mismatch**
   - Frontend expects `description/timestamp/resourceUrl`.
   - Backend returns `message/createdAt/link`.
   - Files:
     - `apps/management/src/types/models.ts`
     - `apps/management/src/pages/notifications/NotificationList.tsx`
     - `apps/api/src/routes/notifications/index.ts`
   - Required fix:
     - Add mapping layer in frontend hook or return normalized DTO from backend.

---

## Priority 1: High-Impact Incomplete UX

1. **Portal Wallet withdraw is a dead-end**
   - `onWithdraw` has no functional flow.
   - Files:
     - `apps/management/src/pages/portal/Wallet.tsx`
     - `apps/management/src/components/shared/WalletCard.tsx`
   - Required fix:
     - Add withdraw/payout modal and wire `useRequestPayout`.

2. **Security sessions are static/demo**
   - Session list/revoke is not backed by API.
   - File:
     - `apps/management/src/pages/settings/Security.tsx`
   - Required fix:
     - Add sessions endpoint + revoke endpoint and wire actions.

3. **Payload contract drift in portal financial actions**
   - Deposit/payout method/detail constraints are inconsistent between UI and backend validation.
   - Files:
     - `apps/management/src/api/portal.ts`
     - `apps/api/src/routes/portal/wallet.ts`
     - `apps/api/src/routes/portal/commissions.ts`
   - Required fix:
     - Align TS types with Zod schema and enforce required fields in UI.

4. **Broadcast model mismatch**
   - UI expects fields not returned by backend route.
   - Files:
     - `apps/management/src/types/models.ts`
     - `apps/management/src/pages/broadcast/BroadcastList.tsx`
     - `apps/api/src/routes/broadcast/index.ts`
   - Required fix:
     - Standardize broadcast DTO and adapt page columns/actions.

---

## Module Status Matrix

| Module | Status | Key Gaps |
|---|---|---|
| Tasks | Partial+ | Core flows exist; improve timeline/events fidelity and tests. |
| Staff | Partial+ | Core CRUD exists; add stronger update/delete/status UX consistency. |
| Projects | Partial+ | Core list/detail works; strengthen task linkage and workflow actions. |
| Attendance | Partial+ | Check-in/out present; add stronger manager workflows and validation coverage. |
| Leave | Partial+ | Apply/approve/reject exists; improve date overlap/rules UX. |
| Reports | Partial+ | Submit/list wired; improve validation and manager review UX. |
| Finance | Partial | DTO mismatch + uneven forecast/revenue integration. |
| CRM | Partial | Leads/orders wired; unify client-account ownership and workflow actions. |
| Assets | Partial | Domains/servers/websites/devices exist; still uneven CRUD depth. |
| HR | Partial+ | Positions/applications/performance exist; add full create/edit/status flows. |
| Support | Partial | Ticket flow exists; improve author/session correctness and SLA transitions. |
| Portal | Partial+ | Major pages wired; wallet withdraw and some consistency gaps remain. |
| Admin Portal | Partial+ | Main actions exist; add audit logs, bulk operations, robustness. |
| Settings | Partial | Profile/2FA partly wired; sessions and password lifecycle incomplete. |
| Analytics | Partial | Page still not fully leveraging analytics hooks across all cards. |

---

## Missing / Incomplete Capability Checklist

### Frontend
- [ ] Replace remaining static/demo data blocks in settings/security and wallet summary.
- [ ] Add row-level edit/delete/status controls where mutation hooks already exist.
- [ ] Standardize DTO mapping in hooks (`notifications`, `finance`, `broadcast`).
- [ ] Ensure all action buttons lead to real mutations (no dead-end buttons).
- [ ] Add shared `api->ui` mapper helpers to avoid repeated per-page drift.

### Backend
- [ ] Add/align bulk notification mark-read contract.
- [ ] Normalize finance revenue DTO shape for UI.
- [ ] Normalize notification DTO shape for UI.
- [ ] Align portal deposit/payout schemas with frontend type contracts.
- [ ] Add session management endpoints for security page.

### Quality / Hardening
- [ ] Add contract tests for every `apps/management/src/api/*.ts` hook against backend payload/response expectations.
- [ ] Add smoke tests for all routes in `apps/management/src/routes/index.tsx`.
- [ ] Add role-based authorization matrix tests for admin/ops/hr protected actions.

---

## Suggested Execution Plan

### Phase 1 (Blockers, 1-2 days)
- Fix notification and finance DTO contract drift.
- Fix portal wallet withdraw flow.
- Fix security sessions API + wiring.

### Phase 2 (Core UX completion, 2-4 days)
- Complete CRUD/action parity for HR, Finance, CRM, Assets.
- Remove all dead-end buttons and static placeholders.

### Phase 3 (Stability, 1-2 days)
- Add contract/smoke tests and role-access regression checks.
- Final pass on pagination/meta consistency.

---

## Deliverable Definition of Done
- No dead-end actions in management pages.
- No DTO/payload mismatch between frontend hooks and backend endpoints.
- All major modules have list + create + update + status/action flow.
- Smoke tests pass for all management routes and key role-based actions.

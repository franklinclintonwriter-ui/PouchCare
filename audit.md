# PouchCare Completion Audit

Date: 2026-04-01  
Scope: `apps/management` + `apps/api`  
Goal: Complete missing pages, align API contracts, and remove incomplete flows.

## 1) Critical Fixes (Do First)

### 1.1 Portal wallet payment method contract mismatch
- **Problem**: Frontend sends values like `BANK_TRANSFER`, `PAYONEER`, `USDT_TRC20`, `BINANCE` but backend expects different enums/labels in some routes.
- **Frontend files**:
  - `apps/management/src/pages/portal/Wallet.tsx`
  - `apps/management/src/api/portal.ts`
- **Backend files**:
  - `apps/api/src/routes/portal/wallet.ts`
  - `apps/api/src/routes/portal/commissions.ts`
- **Action**:
  - Define one canonical enum format.
  - Update all validators and select options to match exactly.
  - Add mapping only if legacy compatibility is required.
- **Acceptance**:
  - Deposit/payout calls pass validation with no 400 enum errors.

### 1.2 Route config contains paths not implemented
- **Problem**: Route constants exist without page route wiring.
- **Files**:
  - `apps/management/src/routes/config.ts`
  - `apps/management/src/routes/index.tsx`
- **Missing/unchecked**:
  - `SETTINGS_PREFERENCES`
  - `PORTAL_LEADERBOARD`
  - `LEADERBOARD` (`/staff/leaderboard`)
- **Action**:
  - Either implement pages + route entries, or remove unused constants.
- **Acceptance**:
  - Every route in `config.ts` is either implemented in `index.tsx` or intentionally removed.

### 1.3 Duplicate backend route implementations
- **Problem**: Multiple route files define overlapping auth/portal behavior; only one set is mounted.
- **Mounted in server**: `auth/index`, `portal/auth`, `portal/me`, `portal/wallet`, `portal/orders`, `portal/referrals`, `portal/commissions`.
- **Potential duplicates/drift files**:
  - `apps/api/src/routes/auth/staff.ts`
  - `apps/api/src/routes/auth/portal.ts`
  - `apps/api/src/routes/portal/index.ts`
  - `apps/api/src/routes/portal/members.ts`
- **Action**:
  - Choose one canonical implementation per endpoint group.
  - Remove/retire duplicates or clearly namespace them.
- **Acceptance**:
  - No overlapping endpoint definitions with different behavior.

---

## 2) High Priority Incomplete UI/API Flows

### 2.1 Staff security page password update not implemented
- **File**: `apps/management/src/pages/settings/Security.tsx`
- **Current**: Uses toast placeholder.
- **Action**:
  - Add backend endpoint for password change.
  - Wire mutation + validation + success/error handling.
- **Acceptance**:
  - Password updates work with current-password verification.

### 2.2 Portal settings password change flow not wired
- **File**: `apps/management/src/pages/portal/PortalSettings.tsx`
- **Current**: UI fields exist; button not wired to API.
- **Action**:
  - Add/use mutation in `apps/management/src/api/auth.ts` or `portal.ts`.
  - Add backend endpoint and validation.
- **Acceptance**:
  - Portal user can change password end-to-end.

### 2.3 Portal order detail messages tab is placeholder
- **File**: `apps/management/src/pages/portal/PortalOrderDetail.tsx`
- **Current**: Static “No messages yet”.
- **Action**:
  - Add order-message list endpoint + post endpoint.
  - Add query + mutation + message composer.
- **Acceptance**:
  - Member and staff can exchange messages tied to order.

### 2.4 Task detail activity timeline is partial
- **File**: `apps/management/src/pages/tasks/TaskDetail.tsx`
- **Current**: Minimal activity representation.
- **Action**:
  - Use canonical activity endpoint/events (status changes, comments, approvals, ratings).
  - Render proper timeline component.
- **Acceptance**:
  - Full task lifecycle appears in activity tab.

### 2.5 Payroll pagination callback not implemented
- **File**: `apps/management/src/pages/payroll/PayrollList.tsx`
- **Current**: `onPageChange={() => {}}`.
- **Action**:
  - Add local page state and pass to API query.
- **Acceptance**:
  - Table paging changes API request page and updates rows.

---

## 3) Medium Priority Consistency Work

### 3.1 Standardize API response handling in frontend hooks
- **Problem**: Mixed array/unwrapped/envelope assumptions.
- **Files**: all under `apps/management/src/api/*.ts`
- **Action**:
  - Standardize return contract from axios interceptor.
  - Update hooks to one consistent pattern.
- **Acceptance**:
  - All hooks follow same response model and types.

### 3.2 Normalize status/type enums across app
- **Areas**:
  - payment methods
  - order statuses
  - payout statuses
  - ticket statuses/priorities
- **Action**:
  - Centralize enum strings in shared types/constants.
  - Remove hardcoded mixed-case literals in pages.
- **Acceptance**:
  - No case/format drift between frontend and backend.

### 3.3 Remove dead route constants and unused pages
- **Action**:
  - Run usage audit and cleanup.
- **Acceptance**:
  - No orphan route constants or unreachable page files.

---

## 4) Backend TODOs Detected

- `apps/api/src/routes/portal/auth.ts`
  - TODO comments around email send flow.
- `apps/api/src/routes/auth/staff.ts`
  - TODO comment for reset email sending.

**Action**: Complete all TODOs or replace with tracked issue references.

---

## 5) Completion Checklist by Area

## Frontend Routes
- [ ] All `ROUTES` constants are implemented in router.
- [ ] All navigation links resolve to existing pages.
- [ ] No dead routes.

## Frontend Pages
- [ ] All placeholder actions replaced with API-backed logic.
- [ ] All forms include loading/error/success states.
- [ ] Detail views (task/order/ticket/member) are fully interactive.

## Frontend API Layer
- [ ] Unified response shape handling.
- [ ] Strongly typed request/response models.
- [ ] Consistent invalidation keys and cache strategy.

## Backend API
- [ ] One canonical route implementation per endpoint.
- [ ] Validators aligned with frontend payloads.
- [ ] No TODO-only endpoints in auth/security paths.

## Integration
- [ ] Auth refresh works for both staff and portal.
- [ ] Wallet deposit and payout flows pass end-to-end.
- [ ] Portal orders and commission flows pass end-to-end.

---

## 6) Suggested Execution Order

1. Fix enum/contract mismatches (payment methods, statuses).  
2. Resolve route config mismatches (implement or remove).  
3. Implement security password-change endpoints + UI wiring.  
4. Complete placeholder tabs (order messages, task activity).  
5. Remove duplicate backend routes and dead code.  
6. Standardize API response handling and tighten types.  
7. Run final integration tests for staff + portal paths.

---

## 7) Definition of Done

- No missing routes/pages from configured navigation.
- No placeholder toasts for core operations.
- No backend endpoint duplication ambiguity.
- All key workflows (auth, order, wallet, commission, support) are API-complete and tested.
- Lint/typecheck/build pass for both `apps/management` and `apps/api`.

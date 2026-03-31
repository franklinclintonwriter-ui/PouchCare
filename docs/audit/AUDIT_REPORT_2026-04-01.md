# PouchCare — Comprehensive Audit Report (2026-04-01)

This report summarizes codebase completeness, inconsistencies, risks, and the next concrete actions to continue development without confusion.

## 1) Executive Summary

**Overall status:** Functional baseline is strong (apps build and type-check), but **auth flows are split across duplicate route implementations** and there are a few **security and contract risks** that should be addressed before production hardening.

**Verified health checks (local)**
- Install: `npm install` ✅
- Type-check: `npm run type-check` ✅
- Lint: `npm run lint` ✅ (warnings only)
- Build: `npm run build` ✅ (warnings only)
- Tests: `npm test` ✅ (no tests configured / no tasks executed)
- Dependency security: `npm audit` ⚠️ (6 vulnerabilities; 2 high)

## 2) Documentation Cleanup Status

The repository contains only these markdown files:
- [README.md](file:///w:/PouchCare/PouchCare/README.md) (keep)
- [.github/PULL_REQUEST_TEMPLATE.md](file:///w:/PouchCare/PouchCare/.github/PULL_REQUEST_TEMPLATE.md) (keep)
- [audit.md](file:///w:/PouchCare/PouchCare/audit.md) (legacy)
- [continue_tasks.md](file:///w:/PouchCare/PouchCare/continue_tasks.md) (legacy)

Archived copies were created for the legacy files:
- [docs/archive/audit-2026-04-01.md](file:///w:/PouchCare/PouchCare/docs/archive/audit-2026-04-01.md)
- [docs/archive/continue_tasks-2026-04-01.md](file:///w:/PouchCare/PouchCare/docs/archive/continue_tasks-2026-04-01.md)

Note: the original deletions were skipped, so the legacy files remain at repo root.

## 3) Completeness Snapshot (By Area)

### 3.1 API (apps/api)

**Complete / solid**
- Server routing and module structure: [server.ts](file:///w:/PouchCare/PouchCare/apps/api/src/server.ts)
- Response envelope helpers: [response.ts](file:///w:/PouchCare/PouchCare/apps/api/src/lib/response.ts)
- Env validation: [env.ts](file:///w:/PouchCare/PouchCare/apps/api/src/config/env.ts)

**Needs attention (high priority)**
- **Duplicate + conflicting auth implementations**
  - Mounted staff auth router: [routes/auth/index.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/auth/index.ts)
    - `POST /auth/reset-password` returns a placeholder message (not implemented).
    - `POST /auth/forgot-password` does not generate/store tokens or send email.
  - Unmounted staff auth router (more complete but not used): [routes/auth/staff.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/auth/staff.ts)
    - Implements token generation + reset flow, but stores reset token in `refreshToken` field (bad modeling) and logs the token.
  - Mounted portal auth router: [routes/portal/auth.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/portal/auth.ts)
    - Generates verify/reset tokens but **logs tokens** (unsafe).
    - Forgot-password currently logs token; does not send email.
  - Unmounted portal auth router (more complete email behavior): [routes/auth/portal.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/auth/portal.ts)
    - Sends reset email via [email.ts](file:///w:/PouchCare/PouchCare/apps/api/src/lib/email.ts), but is not mounted in [server.ts](file:///w:/PouchCare/PouchCare/apps/api/src/server.ts).

**Needs attention (medium priority)**
- Minor routing issue: duplicate middleware call in [search/index.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/search/index.ts) (`router.use(authenticate)` twice).

### 3.2 Management App (apps/management)

**Complete / solid**
- Route wiring appears consistent with route constants (no missing routes):  
  - [routes/config.ts](file:///w:/PouchCare/PouchCare/apps/management/src/routes/config.ts)  
  - [routes/index.tsx](file:///w:/PouchCare/PouchCare/apps/management/src/routes/index.tsx)
- Token refresh logic uses `refresh_token` and selects correct endpoints based on user type: [api/client.ts](file:///w:/PouchCare/PouchCare/apps/management/src/api/client.ts)
- Staff security flows are wired to API hooks (password change, 2FA setup/verify): [Security.tsx](file:///w:/PouchCare/PouchCare/apps/management/src/pages/settings/Security.tsx)
- Portal order messaging is wired end-to-end at UI level (empty state is normal when no messages): [PortalOrderDetail.tsx](file:///w:/PouchCare/PouchCare/apps/management/src/pages/portal/PortalOrderDetail.tsx)

**Needs attention (medium priority)**
- “Active Sessions” list is hardcoded UI and revoke is not wired: [Security.tsx](file:///w:/PouchCare/PouchCare/apps/management/src/pages/settings/Security.tsx)
- Portal wallet has placeholders:
  - Withdraw is a no-op
  - `pendingCommissions` / `totalEarned` are hardcoded values  
  [Wallet.tsx](file:///w:/PouchCare/PouchCare/apps/management/src/pages/portal/Wallet.tsx)

### 3.3 Office App (apps/office) and Client Portal (apps/client-portal)

**Build/type-check status**
- Both apps now type-check and build successfully.

**Needs attention (high priority)**
- **Refresh token contract mismatch** in both apps:
  - Both send `{ refreshToken: <token> }` to `/auth/refresh`
  - The API expects `{ refresh_token: <token> }` and portal refresh is under `/portal/refresh`  
  Office: [apps/office/src/lib/api.ts](file:///w:/PouchCare/PouchCare/apps/office/src/lib/api.ts)  
  Client portal: [apps/client-portal/src/lib/api.ts](file:///w:/PouchCare/PouchCare/apps/client-portal/src/lib/api.ts)

**Needs attention (medium priority)**
- Multiple UI surfaces show placeholder KPIs/flows (e.g., “—” KPI values, report submit panel copy). These are not broken builds, but indicate unfinished product wiring.

## 4) Security & Data Integrity Findings (Critical)

### 4.1 Token leakage in logs

These routes print verification/reset tokens to stdout:
- [portal/auth.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/portal/auth.ts)
- [auth/staff.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/auth/staff.ts)

**Risk:** tokens can be harvested from server logs in production-like environments.

**Recommendation:** remove token logging; send tokens only via email using [email.ts](file:///w:/PouchCare/PouchCare/apps/api/src/lib/email.ts). If local-only debug is needed, gate it strictly behind `NODE_ENV !== 'production'` and still prefer printing a one-time URL rather than raw tokens.

### 4.2 Reset token stored in refreshToken field (staff)

- [auth/staff.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/auth/staff.ts) stores reset token as `refreshToken: "reset:<token>"`.

**Risk:** breaks refresh semantics, complicates auth auditing, and creates confusion across codepaths.

**Recommendation:** use dedicated columns (like the portal member model already does) or a separate `PasswordResetToken` table.

## 5) Dependency Vulnerabilities (npm audit)

`npm audit` reports:
- `path-to-regexp` (high)
- `picomatch` (high)
- `brace-expansion` (moderate)
- `esbuild` (moderate; fix requires a major Vite upgrade according to npm)

Source output is from the root audit run; see terminal output for full details.

**Recommendation**
- Run `npm audit fix` (non-breaking) and re-audit.
- Treat `npm audit fix --force` as a separate upgrade project (may jump Vite major versions and require code changes).

## 6) “Complete / Incomplete / Needs Fix” File Index (Focused)

**Complete / OK**
- [apps/api/src/server.ts](file:///w:/PouchCare/PouchCare/apps/api/src/server.ts)
- [apps/api/src/lib/response.ts](file:///w:/PouchCare/PouchCare/apps/api/src/lib/response.ts)
- [apps/api/src/config/env.ts](file:///w:/PouchCare/PouchCare/apps/api/src/config/env.ts)
- [apps/management/src/api/client.ts](file:///w:/PouchCare/PouchCare/apps/management/src/api/client.ts)
- [apps/management/src/routes/index.tsx](file:///w:/PouchCare/PouchCare/apps/management/src/routes/index.tsx)

**Incomplete / Needs Fix (blockers)**
- Staff reset-password API is not implemented in the mounted router: [apps/api/src/routes/auth/index.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/auth/index.ts)
- Portal auth route logs verification/reset tokens: [apps/api/src/routes/portal/auth.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/portal/auth.ts)
- Office refresh contract mismatch: [apps/office/src/lib/api.ts](file:///w:/PouchCare/PouchCare/apps/office/src/lib/api.ts)
- Client portal refresh contract mismatch: [apps/client-portal/src/lib/api.ts](file:///w:/PouchCare/PouchCare/apps/client-portal/src/lib/api.ts)

**Duplication / Canonicalization Needed**
- Portal auth duplicate (mounted vs unmounted):  
  [apps/api/src/routes/portal/auth.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/portal/auth.ts) vs  
  [apps/api/src/routes/auth/portal.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/auth/portal.ts)
- Staff auth duplicate (mounted vs unmounted):  
  [apps/api/src/routes/auth/index.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/auth/index.ts) vs  
  [apps/api/src/routes/auth/staff.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/auth/staff.ts)

## 7) Recommended Next Work Order (to continue cleanly)

1. **Choose canonical auth routers** (staff + portal) and remove/retire the duplicates.
2. Implement email-based verification/reset using [email.ts](file:///w:/PouchCare/PouchCare/apps/api/src/lib/email.ts); remove token logging.
3. Fix Office + Client Portal refresh contract + correct refresh endpoint selection (portal vs staff).
4. Decide the intended scope of the Office and Client Portal UIs (what is MVP vs later), then convert placeholder KPIs/actions into tracked tasks.
5. Add at least smoke tests (API route tests or minimal integration tests) so `npm test` actually validates flows.

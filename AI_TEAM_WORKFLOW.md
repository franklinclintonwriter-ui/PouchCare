# PouchCare OS — AI Team Workflow for Project Completion

> **Generated:** April 14, 2026 · **Version:** 2.0 (Deep Read Audit)
> **Goal:** Complete all remaining work to make PouchCare OS fully production-ready.

---

## Quick Context

PouchCare OS is a monorepo (`apps/api`, `apps/management`, `apps/landing`, `packages/*`). The **backend API** and **Management frontend** are production-ready. The **Landing/Portal frontend** has 11 pages using mock/sessionStorage data that must be replaced with real API calls. Two shared packages are empty stubs.

**Tech stack:** Express + Prisma + PostgreSQL · React 18 + Vite + Tailwind CSS + React Query + Zustand · TypeScript throughout.

---

## Team of 5 Agents

| Agent | Role | Works In | Depends On |
|-------|------|----------|------------|
| **Agent 1** | Backend API Developer | `apps/api/` | None |
| **Agent 2** | Frontend Integration Developer | `apps/landing/` | Agent 1 |
| **Agent 3** | Testing & QA | `e2e/`, all apps | Agents 1 + 2 |
| **Agent 4** | DevOps & Deployment | root, `deploy/` | None |
| **Agent 5** | Code Quality & Cleanup | all packages/apps | None |

**Agents 1, 4, and 5 run in parallel (Phase 1). Agent 2 runs after Agent 1 (Phase 2). Agent 3 runs last (Phase 3).**

---

## Agent 1: Backend API Developer

**Mission:** Build 18 new portal API endpoints so the frontend can replace all mock data.

**Key files to read first:**
- `apps/api/src/server.ts` — see how routes are mounted
- `apps/api/src/routes/portal/` — existing portal routes (auth.ts, me.ts, orders.ts, wallet.ts, commissions.ts, referrals.ts) for patterns
- `apps/api/prisma/schema.prisma` — all models
- `apps/api/src/middleware/auth.ts` — portalAuth middleware
- `apps/api/src/lib/response.ts` — ok(), created(), err() helpers
- `apps/api/src/middleware/validate.ts` — Zod validation pattern

**All endpoints must:**
- Use portalAuth middleware (authenticates portal member via JWT)
- Return envelope format: `{ success: true, data: {...}, meta?: {...} }`
- Have Zod validation on POST/PATCH bodies
- Support pagination (page, limit query params) on list endpoints
- Include try/catch with contextual error logging

### Task 1A: Portal Invoices (HIGH priority)

Create `apps/api/src/routes/portal/invoices.ts`:

```
GET  /portal/invoices          — List invoices for current portal member (paginated, filterable by status)
GET  /portal/invoices/:id      — Invoice detail with line items
```

Use existing `Invoice` model. Scope by `portalMemberId` from auth token. Include related Project name if linked.

Register in `server.ts`:
```typescript
import portalInvoices from './routes/portal/invoices';
app.use('/v1/portal/invoices', portalAuth, portalInvoices);
```

### Task 1B: Portal Hosting/Domains (HIGH priority)

Create `apps/api/src/routes/portal/hosting.ts`:

```
GET    /portal/hosting/domains          — List domains owned by member
POST   /portal/hosting/domains          — Register new domain record
GET    /portal/hosting/domains/:id      — Domain detail (DNS, SSL, nameservers, usage)
PATCH  /portal/hosting/domains/:id      — Update (auto-renew, notes, nameservers)
DELETE /portal/hosting/domains/:id      — Remove domain
GET    /portal/hosting/search           — Domain availability check (can return mock data initially)
POST   /portal/hosting/domains/:id/dns  — Add DNS record
PATCH  /portal/hosting/domains/:id/dns/:recordId — Update DNS record
DELETE /portal/hosting/domains/:id/dns/:recordId — Delete DNS record
```

Use existing `Domain` model. May need to add `portalMemberId` field to Domain model if not present — check schema. DNS records can be stored as JSON field or separate model.

### Task 1C: Portal Websites (MEDIUM priority)

Create `apps/api/src/routes/portal/websites.ts`:

```
GET  /portal/websites      — List websites with status, SEO score, uptime
GET  /portal/websites/:id  — Detail with analytics, tech stack, SSL info
```

Use existing `Website` model. Scope by portal member.

### Task 1D: Web-to-APK Jobs (MEDIUM priority)

Create `apps/api/src/routes/portal/web-to-apk.ts`:

This may need a new Prisma model `ApkJob` with fields: id, portalMemberId, appName, url, plan, status (queued/processing/ready/failed/expired), apkSizeMb, downloadUrl, timestamps.

```
GET  /portal/web-to-apk/jobs      — List jobs for member
POST /portal/web-to-apk/jobs      — Submit new job (status: queued)
GET  /portal/web-to-apk/jobs/:id  — Job status + download URL
```

### Task 1E: Portal Security & Profile Extension (LOW priority)

Create `apps/api/src/routes/portal/security.ts`:

```
GET    /portal/sessions         — List active sessions
DELETE /portal/sessions/:id     — Revoke session
GET    /portal/login-history    — Login audit log
PATCH  /portal/settings         — Update notification + appearance prefs
```

**Also:** Extend `PUT /portal/me` in `apps/api/src/routes/portal/me.ts` to accept: `companyName`, `vatId`, `companyWebsite`, `industry`, `addressLine1`, `addressLine2`, `city`, `state`, `zip`, `country`, `telegram`, `skype`, `preferredContact`. May need to add these fields to `PortalMember` model in schema.prisma.

### Acceptance Criteria
- [ ] All endpoints accessible and returning correct data
- [ ] Zod validation on all write endpoints
- [ ] Pagination working on all list endpoints
- [ ] Error responses use err() helper with proper status codes
- [ ] Routes registered in server.ts

---

## Agent 2: Frontend Integration Developer

**Mission:** Replace all 7 mock data files and rewire 11 pages to use real API calls.

**DEPENDENCY: Wait for Agent 1 to complete the backend endpoints.**

**Key files to read first:**
- `apps/landing/src/api/client.ts` — Axios setup, envelope unwrapping, token refresh
- `apps/landing/src/api/portal-dashboard.ts` — existing hook patterns (usePortalOrders, usePortalWallet, etc.)
- All 7 mock files in `apps/landing/src/data/` — understand the data shapes
- All 11 affected pages in `apps/landing/src/pages/dashboard/`

### Task 2A: Create New API Hook Files

**File: `apps/landing/src/api/portal-hosting.ts`**
```typescript
// Follow exact same patterns as portal-dashboard.ts
export function usePortalDomains(page, limit) { ... }     // GET /portal/hosting/domains
export function usePortalDomain(id) { ... }                // GET /portal/hosting/domains/:id
export function useSearchDomains(query) { ... }            // GET /portal/hosting/search
export function useRegisterDomain() { ... }                // POST mutation
export function useUpdateDomain() { ... }                  // PATCH mutation
export function useDeleteDomain() { ... }                  // DELETE mutation
export function useAddDnsRecord() { ... }                  // POST mutation
export function useUpdateDnsRecord() { ... }               // PATCH mutation
export function useDeleteDnsRecord() { ... }               // DELETE mutation
```

**File: `apps/landing/src/api/portal-websites.ts`**
```typescript
export function usePortalWebsites(page, limit) { ... }
export function usePortalWebsite(id) { ... }
```

**File: `apps/landing/src/api/portal-web-to-apk.ts`**
```typescript
export function useApkJobs(page, limit) { ... }
export function useCreateApkJob() { ... }  // POST mutation
export function useApkJob(id) { ... }      // with refetchInterval for polling
```

**File: `apps/landing/src/api/portal-security.ts`**
```typescript
export function useSessions() { ... }
export function useRevokeSession() { ... }
export function useLoginHistory(page, limit) { ... }
export function useSecuritySettings() { ... }
export function useUpdateSecuritySettings() { ... }
```

**Add to existing `apps/landing/src/api/portal-dashboard.ts`:**
```typescript
export function usePortalInvoices(page, limit, status?) { ... }
export function usePortalInvoice(id) { ... }
// Extend useUpdateProfile() to handle company/address/contacts
```

### Task 2B: Rewire Pages (one at a time)

For EACH page:
1. Remove mock data imports
2. Add React Query hook calls
3. Add loading skeleton/spinner while data loads
4. Add error state when API fails
5. Update all toast messages to remove "(mock)" text
6. Test the page works with real data

**Pages to rewire (in order):**
1. `InvoicesPage.tsx` — Replace `MOCK_INVOICES` with `usePortalInvoices()`
2. `InvoiceDetailPage.tsx` — Replace mock lookup with `usePortalInvoice(id)`
3. `HostingOverviewPage.tsx` — Replace `useMockHostingDomains()` with `usePortalDomains()`
4. `HostingRegisterPage.tsx` — Replace `mockDomainSearchSuggestions()` with `useSearchDomains()`
5. `HostingDomainDetailPage.tsx` — Replace mockHostingStore with `usePortalDomain()` + mutations
6. `WebsitesPage.tsx` — Replace `MOCK_WEBSITES` with `usePortalWebsites()`
7. `WebsiteDetailPage.tsx` — Replace mock with `usePortalWebsite(id)`
8. `WebToApkPage.tsx` — Replace `setTimeout` simulation with `useApkJobs()` + polling
9. `ProfilePage.tsx` — Replace `mockProfile` sessionStorage with extended `useUpdateProfile()`
10. `SettingsPage.tsx` — Replace `mockSecurity` with real security API hooks
11. `DashboardOverviewPage.tsx` — Replace `MOCK_WEBSITES`/`MOCK_INVOICES` imports with API queries

### Task 2C: Delete Mock Files

After all pages are rewired:
- Delete `apps/landing/src/data/mockHosting.ts`
- Delete `apps/landing/src/data/mockHostingStore.ts`
- Delete `apps/landing/src/data/mockInvoices.ts`
- Delete `apps/landing/src/data/mockWebsites.ts`
- Delete `apps/landing/src/data/mockWebToApk.ts`
- Delete `apps/landing/src/data/mockProfile.ts`
- Delete `apps/landing/src/data/mockSecurity.ts`
- Delete `apps/landing/src/hooks/useMockHostingDomains.ts` (if exists)
- Remove `apps/landing/src/data/marketingHosting.ts` references to mock data (keep marketing catalog)

### Acceptance Criteria
- [ ] Zero imports from any mock data file
- [ ] All 7 mock files deleted
- [ ] All 11 pages fetch from real API
- [ ] Loading and error states on every page
- [ ] No "(mock)" in any toast message
- [ ] No sessionStorage usage for data (only cart/theme are OK)
- [ ] `npm run build` passes with zero errors

---

## Agent 3: Testing & QA

**Mission:** Validate everything works end-to-end after Agents 1 and 2 complete.

**DEPENDENCY: Wait for Agents 1 and 2.**

### Tasks

1. **Fix playwright.config.ts** — Change `baseURL` port from 3000 to the actual Vite dev port (check vite.config.ts for each app)

2. **Write E2E tests** in `e2e/` directory:
   - `portal-auth.spec.ts` — Register, verify email, login, logout flow
   - `portal-orders.spec.ts` — Browse services, add to cart, place order
   - `portal-wallet.spec.ts` — View balance, request deposit
   - `portal-invoices.spec.ts` — List invoices, view detail
   - `portal-hosting.spec.ts` — List domains, view detail, manage DNS
   - `management-rbac.spec.ts` — Expand existing 3 tests to cover more roles
   - `management-tasks.spec.ts` — Create, assign, approve workflow

3. **Build verification:**
   - Run `npm run build` across all workspaces
   - Run `npm run type-check` — zero TypeScript errors
   - Run `npm run lint` — zero ESLint errors

4. **API smoke tests:** Verify all new portal endpoints return correct response format

### Acceptance Criteria
- [ ] All E2E tests pass
- [ ] Full build succeeds with zero errors
- [ ] Type check passes
- [ ] Lint passes

---

## Agent 4: DevOps & Deployment

**Mission:** Complete CI/CD, harden deployment, and add monitoring.

**No dependencies — can run in parallel with Agent 1.**

### Tasks

1. **Implement GitLab CI deploy stage** in `.gitlab-ci.yml`:
   ```yaml
   deploy:production:
     stage: deploy
     only: [main]
     when: manual
     script:
       - ssh deploy@$SERVER_IP "cd /home/pouchcare/Developments/PouchCare && bash deploy/update.sh"
   ```
   (Or Docker-based deploy if preferred)

2. **Add DB backup to `deploy/update.sh`** before `prisma migrate`:
   ```bash
   pg_dump pouchcare > /home/pouchcare/backups/pre-deploy-$(date +%Y%m%d%H%M%S).sql
   ```

3. **PM2 improvements** in `ecosystem.config.js`:
   - Change `instances: 1` to `instances: "max"` or a reasonable number
   - Add `max_memory_restart: "512M"`
   - Add `min_uptime: "10s"`, `max_restarts: 10`

4. **Turbo config cleanup:** Remove `.next/**` from `turbo.json` outputs (app uses Vite, not Next.js)

5. **Environment variable audit:** Verify all vars in `.env.example` files match what the code actually uses

6. **Log rotation:** Set up PM2 log rotation and Nginx log rotation

7. **Health monitoring:** Set up external uptime monitoring for `api.pouchcare.com/health`

### Acceptance Criteria
- [ ] CI/CD deploy job works on manual trigger
- [ ] DB backup runs before every migration
- [ ] PM2 runs in cluster mode
- [ ] All env vars documented

---

## Agent 5: Code Quality & Cleanup

**Mission:** Fix all code quality issues, align types, remove stubs.

**No dependencies — can run in parallel with Agent 1.**

### Tasks

1. **Consolidate API config:** Merge `apps/api/src/config/index.ts` into `apps/api/src/config/env.ts`. Remove hardcoded JWT fallback secrets. Update all imports.

2. **Fix task route logging:** In `apps/api/src/routes/tasks/index.ts`, replace 5 bare `console.error(e)` calls (lines 79, 145, 219, 340, 387) with contextual prefixes like `console.error('[tasks/list]', e)`.

3. **Add portal auth rate limiting:** In `apps/api/src/server.ts`, apply `authLimiter` middleware to portal auth routes:
   ```typescript
   app.use('/v1/portal/login', authLimiter);
   app.use('/v1/portal/register', authLimiter);
   ```

4. **Fix type mismatch:** In `packages/types/src/index.ts`, rename `CrmStage` to `LeadStage` to match the Prisma schema enum name. Update all imports.

5. **Handle empty packages:** For `packages/auth/src/index.ts` and `packages/ui/src/index.ts`:
   - Option A: Extract shared auth utilities (JWT verify, token refresh) into @pouchcare/auth
   - Option B: Remove these empty packages from the monorepo and update `workspaces` in root package.json
   - **Recommended: Option B** — the apps already have their own auth implementations

6. **Fix 'any' types** in management app (5 instances):
   - `apps/management/src/api/admin-portal.ts` line 294
   - `apps/management/src/api/system-config.ts` lines 7, 42
   - `apps/management/src/pages/settings/SystemConfig.tsx` lines 45, 74

7. **Add React error boundaries** to both frontend apps — wrap `<Outlet />` in route layouts

8. **Gate dev logging:** In `apps/api/src/lib/email.ts`, ensure `[DEV]` logs only fire when `NODE_ENV !== 'production'`

9. **Final verification:** Run `npm run type-check` and `npm run lint` across all workspaces

### Acceptance Criteria
- [ ] Single config file (env.ts only)
- [ ] No hardcoded secret fallbacks
- [ ] All console.error calls have context
- [ ] Portal auth has rate limiting
- [ ] Types aligned across packages and schema
- [ ] No empty stub packages
- [ ] Zero 'any' types in management app
- [ ] Error boundaries in both frontends
- [ ] Full type-check and lint pass

---

## Execution Timeline

```
Phase 1 (Parallel):  Agent 1 (backend) + Agent 4 (devops) + Agent 5 (cleanup)
Phase 2 (Sequential): Agent 2 (frontend) — depends on Agent 1
Phase 3 (Sequential): Agent 3 (QA) — depends on Agents 1 + 2
Phase 4 (All):        Final review, build, deploy
```

**Estimated total:** 7-10 AI sessions across all agents.

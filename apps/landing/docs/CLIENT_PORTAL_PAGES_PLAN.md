# Client portal — page & route plan (pouchcare.com / `apps/landing`)

The standalone **`apps/client-portal`** app has been **removed**. The new client experience will live in the **same Vite SPA as the marketing site** (`apps/landing`), under **`pouchcare.com`**, so URLs stay on one domain (SEO, cookies, branding).

**Principle:** Public marketing stays at `/`, `/services`, `/pricing`, … Client-only flows sit under a dedicated prefix — **`/my-accounts`** (auth & account settings) and **`/dashboard`** (signed-in home). Adjust prefixes only in one module (e.g. `src/lib/portal.ts` + route constants).

---

## 1. URL map (recommended)

| Area | Path | Purpose |
|------|------|--------|
| **Marketing** | `/`, `/about`, `/services`, `/pricing`, `/contact`, `/blog`, … | Unchanged public pages |
| **Auth & account shell** | `/my-accounts/login` | Email + password sign-in |
| | `/my-accounts/register` | New portal member registration |
| | `/my-accounts/verify-email?token=` | Email verification (matches API email links) |
| | `/my-accounts/forgot-password` | Request reset email |
| | `/my-accounts/reset-password?token=` | Set new password after email link |
| **Signed-in app** | `/dashboard` | Post-login home (KPIs, shortcuts) |
| | `/dashboard/orders` | Order history & detail |
| | `/dashboard/wallet` | Balance, transactions |
| | `/dashboard/referrals` | Referral code, commissions |
| | `/dashboard/services` | Browse / place orders (if productized) |
| | `/dashboard/profile` | Profile, password change, preferences |
| | `/dashboard/support` | Tickets or contact |
| **Legal** | `/privacy`, `/terms` | Already exist; ensure copy mentions entity + data |

Nested routes under `/dashboard/*` keep the “app” clearly separate from marketing without a second subdomain.

---

## 2. Implementation phases

### Phase A — Routing & shell (foundation)

- Add React Router routes in `apps/landing` for all rows in §1 (placeholders OK).
- **Auth guard:** routes under `/dashboard` require portal JWT (Zustand + `localStorage` or httpOnly cookie strategy — align with API `/v1/portal/*`).
- **Marketing guard:** `/my-accounts/*` for logged-in portal users can redirect to `/dashboard` (optional).
- Shared layout: `MarketingLayout` (existing navbar/footer) vs `PortalShell` (minimal header, focus on task) vs `DashboardLayout` (sidebar + top bar).

### Phase B — API wiring

- Reuse existing API: `POST /v1/portal/login`, `register`, `refresh`, `verify-email`, `forgot-password`, `reset-password`, `GET /v1/portal/me`, wallet, orders, referrals as already implemented in `apps/api`.
- Central `api` client in landing: axios/fetch with base `VITE_API_URL` + `/v1`, unwrap `{ success, data }`, refresh on 401 via `/portal/refresh`.

### Phase C — Pages (priority order)

1. Login / Register / Verify / Forgot / Reset (unblocks everything).
2. `/dashboard` overview.
3. Wallet + referrals (portal member value).
4. Orders + services.
5. Profile + support.

### Phase D — Deploy & ops

- **Single build:** `npm run build` in `apps/landing` outputs `dist/` to **`pouchcare.com`** docroot (must be **built** Vite output, not raw repo copy).
- **Remove** separate Nginx vhost for `my.pouchcare.com` (no longer deployed).
- **API env:** `PORTAL_URL=https://pouchcare.com` so verification/reset emails point to `https://pouchcare.com/my-accounts/...` (see `apps/api/src/lib/email.ts`).
- **CORS:** allow `https://pouchcare.com` (and `www` if used); drop dedicated client subdomain from allowlists once traffic migrates.

---

## 3. Files to add or extend (landing)

| Piece | Suggestion |
|-------|------------|
| Routes | `src/App.tsx` or `src/routes/index.tsx` — split marketing vs portal route trees |
| Constants | `src/lib/portal.ts` — already exposes `portalLoginUrl()`, `portalRegisterUrl()`, `portalDashboardUrl()`; extend with path constants for new pages |
| Auth store | `src/stores/portalAuthStore.ts` — portal user + tokens (or shared naming) |
| API | `src/lib/api.ts` or `src/api/portalClient.ts` |
| Layouts | `src/components/layout/PortalLayout.tsx`, `DashboardLayout.tsx` |
| Pages | `src/pages/my-accounts/*`, `src/pages/dashboard/*` |

---

## 4. Dependencies

- Add to `apps/landing` if not present: **`@tanstack/react-query`**, **`axios`**, **`zod`**, **`react-hook-form`** (match management portal patterns).
- **Do not** reintroduce `apps/client-portal` unless you explicitly split the product again.

---

## 5. Checklist before launch

- [ ] Landing production deploy runs **`vite build`** and serves **`dist/`**.
- [ ] All portal links on Navbar/Footer use `portal.ts` helpers (env-driven base + paths).
- [ ] API `PORTAL_URL` and email templates use `/my-accounts/...` paths.
- [ ] E2E smoke: register → verify email → login → dashboard.

---

## 6. Reference — removed app

The old **`my.pouchcare.com`** / `apps/client-portal` deployment has been **retired** in favour of this single-domain plan.

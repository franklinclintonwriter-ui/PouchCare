# Tasks — Web → APK service

**New files:**
- [`src/data/mockWebToApk.ts`](../src/data/mockWebToApk.ts) — plans, features, FAQ, mock orders
- [`src/pages/ServicesWebToApkPage.tsx`](../src/pages/ServicesWebToApkPage.tsx) — marketing page
- [`src/pages/dashboard/WebToApkPage.tsx`](../src/pages/dashboard/WebToApkPage.tsx) — dashboard tool

**Updated files:**
- [`src/App.tsx`](../src/App.tsx) — routes `/services/web-to-apk` + `/dashboard/web-to-apk`
- [`src/routes/paths.ts`](../src/routes/paths.ts) — `dashboardWebToApk`
- [`src/config/clientDashboardNav.ts`](../src/config/clientDashboardNav.ts) — sidebar entry "Web → APK"
- [`src/components/layout/Navbar.tsx`](../src/components/layout/Navbar.tsx) — nav link
- [`src/components/layout/Footer.tsx`](../src/components/layout/Footer.tsx) — footer services link

---

## Marketing page (`/services/web-to-apk`)

| Section | Status |
|---------|--------|
| Hero + demo form (mock generate) | ✅ |
| Stats bar (APKs generated, build time, coverage) | ✅ |
| Features grid (6 features from `WEB_TO_APK_FEATURES`) | ✅ |
| How it works (3 steps) | ✅ |
| Plan cards (Free / Starter / Pro) | ✅ |
| FAQ accordion | ✅ |
| CTA section | ✅ |

---

## Dashboard page (`/dashboard/web-to-apk`)

| Feature | Status |
|---------|--------|
| Convert form (URL, app name, plan picker) | ✅ |
| Plan features preview inside form | ✅ |
| Mock queue → processing → ready flow (setTimeout) | ✅ |
| My conversions — desktop table | ✅ |
| My conversions — mobile cards | ✅ |
| Download button (mock toast) | ✅ |
| Upgrade prompt banner | ✅ |

---

## Mock data (`mockWebToApk.ts`)

| Export | Description |
|--------|-------------|
| `WEB_TO_APK_PLANS` | Free / Starter ($9/mo) / Pro ($29/mo) |
| `WEB_TO_APK_FEATURES` | 6 feature cards for marketing |
| `WEB_TO_APK_FAQ` | 6 FAQ items |
| `MOCK_APK_ORDERS` | 3 seed jobs (ready / ready / expired) |
| `APK_STATUS_LABEL` | Display strings for `ApkJobStatus` |
| `APK_STATUS_VARIANT` | Badge variant map |

---

## API integration checklist (when backend ready)

- [ ] `GET /portal/web-to-apk/jobs` — list conversion jobs.
- [ ] `POST /portal/web-to-apk/jobs` — create job (URL, appName, plan, iconFile).
- [ ] `GET /portal/web-to-apk/jobs/:id` — poll status.
- [ ] `GET /portal/web-to-apk/jobs/:id/download` — signed download URL.
- [ ] Replace `MOCK_APK_ORDERS` seed with API fetch in `WebToApkPage`.
- [ ] Replace mock setTimeout status transitions with polling.

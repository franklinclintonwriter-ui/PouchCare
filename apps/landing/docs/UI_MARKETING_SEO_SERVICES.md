# Marketing site — SEO & services data (`apps/landing`)

## Pages and data sources

| Page | File | Primary data |
|------|------|----------------|
| `/services` | [`src/pages/Services.tsx`](../src/pages/Services.tsx) | `getServices()` → API `/v1/services`; fallback [`SERVICES`](../src/lib/constants.ts). Merged with [`mergeWithMarketingHosting`](../src/data/marketingHosting.ts) so hosting lines stay visible when API returns. |
| `/services/hosting` | [`src/pages/ServicesHostingPage.tsx`](../src/pages/ServicesHostingPage.tsx) | Catalog copy in [`marketingHosting.ts`](../src/data/marketingHosting.ts); plans from `MOCK_HOSTING_PLANS` in [`mockHosting.ts`](../src/data/mockHosting.ts). |
| `/backlinks` | [`src/pages/Backlinks.tsx`](../src/pages/Backlinks.tsx) | API fallback to [`BACKLINK_PACKAGES`](../src/lib/constants.ts) |
| `/pricing` | [`src/pages/Pricing.tsx`](../src/pages/Pricing.tsx) | [`PLANS`](../src/lib/constants.ts) + Home may reuse |

## CTA patterns

- **Sign up / client area:** [`paths.register`](../src/routes/paths.ts), [`paths.dashboard`](../src/routes/paths.ts), or deep links `paths.dashboardHostingRegister` for “search domains” flows.
- External marketing links use [`lib/portal.ts`](../src/lib/portal.ts) builders where applicable (`portalLoginUrl`, etc.).

## API caveat

When `VITE_API_URL` is set and `/v1/services` returns data, the raw catalog no longer uses the static `SERVICES` array alone. **Hosting/infrastructure rows** are merged in the UI layer so they remain listed unless duplicated by name.

## Optional future work

- Dedicated API categories for `Hosting` / `Infrastructure`.
- Single JSON source for service definitions shared with management app (out of scope for landing-only docs).

## Frontend implementation tasks

See [`TASKS_INDEX.md`](TASKS_INDEX.md) (UI components checklist + mock CRUD matrix for domains, DNS, SEO placeholders).

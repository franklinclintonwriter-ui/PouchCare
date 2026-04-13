# Task list — UI utils & shared components (SEO · domain · hosting)

**Purpose:** Checklist so implementers do not miss reusable pieces across marketing (`/services`, `/services/hosting`) and client portal (`/dashboard/hosting/*`). Mark items `[x]` when done.

**Conventions:** Mobile-first grids, `NarrowWide` for table+cards, touch targets ≥44px — see [`src/pages/dashboard/DASHBOARD_PORTAL.md`](../src/pages/dashboard/DASHBOARD_PORTAL.md).

---

## A. Already in codebase (reuse, do not duplicate)

| Piece | Location |
|-------|----------|
| Responsive table / card split | [`src/components/dashboard/ResponsiveSplit.tsx`](../src/components/dashboard/ResponsiveSplit.tsx) (`NarrowWide`) |
| Dashboard shell panels | [`src/components/dashboard/DashboardPanel.tsx`](../src/components/dashboard/DashboardPanel.tsx) |
| Stat / KPI cards | [`src/components/dashboard/StatCard.tsx`](../src/components/dashboard/StatCard.tsx) |
| Status styling helper | [`src/lib/hostingUtils.ts`](../src/lib/hostingUtils.ts) (`hostingStatusVariant`) |
| Marketing + portal field tokens | [`src/lib/ui.ts`](../src/lib/ui.ts) (`accountInputClass`, `ui`) |
| Hosting mock types & plans | [`src/data/mockHosting.ts`](../src/data/mockHosting.ts) |
| Marketing hosting catalog merge | [`src/data/marketingHosting.ts`](../src/data/marketingHosting.ts) |

---

## B. Recommended extracted components (hosting / infra)

Create under `src/components/hosting/` (or `src/components/infra/`) when duplication appears between [`HostingOverviewPage`](../src/pages/dashboard/HostingOverviewPage.tsx), [`HostingDomainDetailPage`](../src/pages/dashboard/HostingDomainDetailPage.tsx), and [`ServicesHostingPage`](../src/pages/ServicesHostingPage.tsx).

| Component | Responsibility | Priority |
|-----------|----------------|----------|
| `HostingPlanCard` | Single plan: name, blurb, price, features, CTA — consumes `MOCK_HOSTING_PLANS` item shape | High |
| `DomainSummaryCard` | One domain row for mobile list (fqdn, status badge, renewal, price) | High |
| `DnsRecordTable` | Desktop table + optional `NarrowWide` wrapper for same data | Medium |
| `NameserverList` | Editable or read-only list with copy buttons | Medium |
| `SslStatusBanner` | Issuer + expiry with warning if &lt; 30 days | Medium |
| `UsageMeter` | Bandwidth / storage progress bars (shared on overview + detail) | Low |

---

## C. SEO / marketing service UI (public site)

| Component / pattern | Where used | Notes |
|---------------------|------------|--------|
| Service grid card | [`Services.tsx`](../src/pages/Services.tsx) | Consider `ServiceCatalogCard` extract if [`ServicesHostingPage`](../src/pages/ServicesHostingPage.tsx) duplicates card markup |
| Category pill strip | `Services.tsx` | Keep overflow-x + `shrink-0` on pills |
| CTA strip (domains/hosting) | `Services.tsx` | Already links `/services/hosting` + portal register |
| Plan grid | `ServicesHostingPage.tsx` | Candidate to use `HostingPlanCard` from section B |

---

## D. Forms & validation (portal, future CRUD)

| Need | Suggested approach |
|------|---------------------|
| DNS record add/edit | `react-hook-form` + zod (match [`ProfilePage`](../src/pages/dashboard/ProfilePage.tsx) pattern) |
| Nameserver edit | String array, max 4–6, FQDN validation |
| Domain settings | Already partial on detail page — extend with same primitives |

---

## E. Accessibility

- [ ] Focus order on hosting drawers / modals (if added)
- [ ] `aria-live` for mock “save DNS” toasts
- [ ] Table headers scoped to responsive cards (same labels)

---

## F. Documentation cross-links

After changes, update [`UI_MARKETING_SEO_SERVICES.md`](UI_MARKETING_SEO_SERVICES.md) and [`HOSTING_PORTAL.md`](../src/pages/dashboard/HOSTING_PORTAL.md) with any new routes or components.

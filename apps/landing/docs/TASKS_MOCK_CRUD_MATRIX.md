# Task list — mock data & CRUD matrix (SEO · domain · hosting)

**Scope:** [`apps/landing`](../) frontend only. Replace mock stores with API calls later; **keep TypeScript interfaces stable** to limit UI churn.

**Related:** [`TASKS_UI_UTILS_COMPONENTS.md`](TASKS_UI_UTILS_COMPONENTS.md), [`data/mockHosting.ts`](../src/data/mockHosting.ts), [`data/mockHostingStore.ts`](../src/data/mockHostingStore.ts).

---

## Legend

| Op | Meaning |
|----|---------|
| ✅ | Implemented (read-only or full) |
| ⚠️ | Partial (UI only, toast, no persistent mock) |
| ⬜ | Not implemented — task |

---

## 1. Domains (`HostingDomain`)

| Operation | Status | Mock source | UI location |
|-----------|--------|-------------|-------------|
| **List** | ✅ | `mockHostingStore` (`useMockHostingDomains`) | [`HostingOverviewPage`](../src/pages/dashboard/HostingOverviewPage.tsx) |
| **Read (detail)** | ✅ | `mockHostingStore` (`getHostingDomainById` / hook) | [`HostingDomainDetailPage`](../src/pages/dashboard/HostingDomainDetailPage.tsx) |
| **Create** (register flow) | ✅ | `addHostingDomainFromMockCheckout` | [`HostingRegisterPage`](../src/pages/dashboard/HostingRegisterPage.tsx) |
| **Update** (settings) | ✅ | `updateHostingDomain` (notes, auto-renew) | Detail page |
| **Delete** / transfer out | ✅ | `deleteHostingDomain` | Detail page (danger zone) |

**Tasks (domains)**

- [x] **Mock store:** `src/data/mockHostingStore.ts` — in-memory array + mutators + `sessionStorage`.
- [x] **Create:** append new domain after mock checkout on register page; navigate to detail.
- [x] **Delete:** confirm + remove from store (mock).

*Note:* `getMockDomainById` in `mockHosting.ts` still resolves the **seed array only** (tests/docs). Runtime UI uses the store.

---

## 2. DNS records (nested under domain)

| Operation | Status | Data | UI location |
|-----------|--------|------|-------------|
| **List** | ✅ | `HostingDomain.dnsRecords` | Detail page (table + cards) |
| **Create** | ✅ | `addDnsRecord` | Detail page |
| **Update** | ✅ | `updateDnsRecord` | Detail page |
| **Delete** | ✅ | `removeDnsRecord` | Detail page |

**Tasks (DNS)**

- [x] Form: type (A/AAAA/CNAME/MX/TXT), host, value, TTL with validation.
- [x] Mock CRUD via `mockHostingStore`.
- [ ] Use `NarrowWide` if table-only on mobile (optional polish).

---

## 3. Nameservers

| Operation | Status | UI |
|-----------|--------|-----|
| **Read** | ✅ | Detail page |
| **Update** | ✅ | Textarea + save → `updateHostingDomain` |

**Tasks**

- [x] Inline edit; toast on success; persist in mock store.

---

## 4. SSL / certificates (read-heavy)

| Operation | Status | Notes |
|-----------|--------|-------|
| **Read** | ✅ | Issuer + expiry on detail |
| **Renew / reissue** | ⚠️ | Button + toast (mock; no persisted state change) |

---

## 5. Hosting plans (catalog)

| Operation | Status | Source |
|-----------|--------|--------|
| **Read** | ✅ | `MOCK_HOSTING_PLANS` — shared: [`HostingRegisterPage`](../src/pages/dashboard/HostingRegisterPage.tsx), [`ServicesHostingPage`](../src/pages/ServicesHostingPage.tsx) via [`HostingPlanCard`](../src/components/hosting/HostingPlanCard.tsx) |
| **Admin CRUD** | ⬜ | Out of scope for client portal; if needed, mock file only |

---

## 6. Domain search / suggestions (marketing)

| Operation | Status | Function |
|-----------|--------|----------|
| **Read** | ✅ | `mockDomainSearchSuggestions(query)` |

---

## 7. SEO services (client portal — optional product area)

*Not a separate route today. Marketing catalog uses [`mergeWithMarketingHosting`](../src/data/marketingHosting.ts) + API `getServices()`.*

| Entity (proposed) | List | Detail | Create | Update | Delete | Notes |
|-------------------|------|--------|--------|--------|--------|-------|
| SEO project / retainer | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Add `src/data/mockSeoProjects.ts` when needed |
| Keyword tracker | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Depends on product scope |
| Audit report | ⬜ | ⬜ | ⬜ | — | ⬜ | PDF/mock JSON |

**Tasks (SEO mock — when prioritized)**

- [ ] Define `SeoProject` interface (id, name, domainFqdn, tier, status, startDate).
- [ ] Seed `MOCK_SEO_PROJECTS: SeoProject[]`.
- [ ] New dashboard route e.g. `/dashboard/seo` + layout (or embed under Services) — **requires product decision**.
- [ ] CRUD hooks: `useMockSeoProjects()` wrapping in-memory store + React Query optional.

---

## 8. Marketing SEO pages (read-only; data from API + constants)

| Page | Data | CRUD |
|------|------|------|
| `/services` | `getServices()` + `mergeWithMarketingHosting` | N/A (catalog) |
| `/services/hosting` | `MARKETING_HOSTING_SERVICES`, `MOCK_HOSTING_PLANS` | N/A |
| `/backlinks` | API + `BACKLINK_PACKAGES` fallback | N/A |
| `/pricing` | `PLANS` in constants | N/A |

**Tasks**

- [ ] If CMS/API owns copy later, keep fallbacks in [`lib/constants.ts`](../src/lib/constants.ts) documented in [`UI_MARKETING_SEO_SERVICES.md`](UI_MARKETING_SEO_SERVICES.md).

---

## Implementation order (suggested)

1. ~~Optional **`mockHostingStore`** + wire domain create from register flow.~~
2. ~~DNS record CRUD on detail page (highest user value).~~
3. ~~Nameserver update mock.~~
4. ~~Extract **`HostingPlanCard`** / usage meters per [`TASKS_UI_UTILS_COMPONENTS.md`](TASKS_UI_UTILS_COMPONENTS.md).~~
5. SEO project mocks only after route/product confirmation.

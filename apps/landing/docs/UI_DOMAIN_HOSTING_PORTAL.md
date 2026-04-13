# Domain & hosting — client portal (`/dashboard/hosting/*`)

## Routes (nested)

Defined in [`src/App.tsx`](../src/App.tsx) under `DashboardLayout`:

| Path | Component | Purpose |
|------|-----------|---------|
| `/dashboard/hosting` | `HostingLayout` + `HostingOverviewPage` | KPIs, domain list (cards `< md`, table `md+`) |
| `/dashboard/hosting/register` | `HostingRegisterPage` | Mock domain search + TLD suggestions + plan picker |
| `/dashboard/hosting/:domainId` | `HostingDomainDetailPage` | DNS, nameservers, settings |

**Critical:** Static segment `register` must be declared **before** `:domainId` so `"register"` is not parsed as a domain id.

## Path helpers

[`src/routes/paths.ts`](../src/routes/paths.ts):

- `dashboardHosting` → `/dashboard/hosting`
- `dashboardHostingRegister` → `/dashboard/hosting/register`
- `dashboardHostingDomain(id)` → `/dashboard/hosting/${domainId}`

## Mock data

[`src/data/mockHosting.ts`](../src/data/mockHosting.ts):

- `MOCK_HOSTING_DOMAINS` — portfolio rows for overview + detail.
- `MOCK_HOSTING_PLANS` — plan cards (shared with public `/services/hosting` where applicable).
- `mockDomainSearchSuggestions(query)` — register page suggestions.
- `getMockDomainById(id)` — detail resolver.

Replace with API calls later; keep TypeScript shapes stable for minimal UI churn.

## Responsive rules

See [`src/pages/dashboard/HOSTING_PORTAL.md`](../src/pages/dashboard/HOSTING_PORTAL.md): card + table pairing, touch targets, subnav scroll.

## Related

- Full dashboard conventions: [`DASHBOARD_PORTAL.md`](../src/pages/dashboard/DASHBOARD_PORTAL.md)

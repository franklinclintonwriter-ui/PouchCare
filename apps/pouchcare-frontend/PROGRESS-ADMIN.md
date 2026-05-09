# Admin Routing Progress

Completion: 99%

- [x] Consolidated admin route map in `src/App.jsx` to reduce drift between mixed and subdomain modes.
- [x] Wired company/project/template/page detail route patterns (`:id`-style) for admin deep-link compatibility.
- [x] Added admin-subdomain compatibility redirects for `/admin/login`, `/admin/register`, and `/admin/*` fallback behavior.
- [x] Hardened runtime host detection in `src/config/runtime.js` for browser-safe execution and configurable admin subdomain via `VITE_ADMIN_SUBDOMAIN`.
- [x] Implemented enterprise admin operations modules (companies, team matrix, billing reconciliation, system checks, webhook logs).
- [x] Converted companies detail to route-driven flow (`/companies/:companyId`) with back navigation.
- [x] Added backend-ready admin repository layer (`src/portal/admin/api/adminPortalRepository.js`) with remote API + local fallback.
- [x] Added auth-aware request headers (Bearer + CSRF) and normalized API error mapping in admin repository.
- [x] Added contract validators for admin event/entity payloads (`src/portal/admin/api/contracts.js`).
- [x] Added typed operation sync paths for company/team/billing events.
- [x] Added entity-level REST adapters (`/admin/companies`, `/admin/team-members`, `/admin/billing-records`) with event fallback.
- [x] Added frontend quality gate scripts (`lint`, `test`) and CI workflow (`.github/workflows/frontend-ci.yml`).
- [ ] Connect repository endpoints to real backend auth/session and enforce server-side contract validation.
- [x] Resolved lint warnings and enforced zero-warning lint policy (`eslint --max-warnings=0`).

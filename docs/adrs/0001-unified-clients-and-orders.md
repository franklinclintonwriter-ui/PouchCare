# ADR 0001 — Unified Clients & Orders in the Admin Panel

- **Status:** Accepted
- **Date:** 2026-04-17
- **Deciders:** CEO, Co-MD, Backend lead, Frontend lead
- **Supersedes:** Prior scattered CRM + portal admin flows

## Context

The PouchCare codebase models clients and orders through multiple parallel tables:

- **Clients** live in two places:
  - `PortalMember` — self-registered users of `my.pouchcare.com` with a wallet balance, referral code and auth identity.
  - `ClientAccount` — CRM-tracked contacts (sales leads, managed-service clients) with assigned manager, source, and lifetime spend.
- **Orders** live in three places:
  - `PortalOrder` — self-serve orders placed by a `PortalMember` from the client portal.
  - `SalesOrder` — sales-driven orders created from a CRM lead.
  - `ApkJob` — web-to-APK build requests, a specialized order kind with its own lifecycle.

Before the Admin Panel, a manager working on a single client had to jump across `/portal/admin/members/:id`, `/crm/clients/:id`, `/finance/invoices`, `/support/tickets`, and sometimes three different order lists to get a full picture. Context was rebuilt from scratch in every window.

## Decision

The Admin Panel presents clients and orders as **unified entities** at the UI and API boundary, while leaving the underlying Prisma tables intact.

### Unified Clients

- A new `GET /v1/admin/clients` endpoint UNIONs `PortalMember` and `ClientAccount`, **de-duplicates by email (case-insensitive)**, and returns a single shape `UnifiedClient` per human.
- The client detail page (`/admin/clients/:id`) loads both sides when they exist and merges them into one 360° view with tabs for Overview, Orders, Wallet, Assets, Tickets, Activity.
- When only one side exists, the view degrades gracefully (no wallet tab data for CRM-only records; no assigned manager for member-only records).
- The `POST /v1/admin/clients/:id/merge` action formalizes the de-dup permanently when human review confirms two records are the same person.

### Unified Orders

- A new `GET /v1/admin/orders` endpoint returns rows from all three sources, tagged with a `kind: 'portal' | 'sales' | 'apk'` discriminator and a composite `id` of the form `<kind>:<uuid>`.
- A canonical **`AdminOrderStatus`** enum is defined in `packages/types/src/admin/` and mapped from each source's native status at serialization time.
- A single status DAG (`ORDER_STATUS_DAG`) governs legal transitions for all order kinds; the server validates every advance/rollback against it.
- Advance, rollback, assign, refund, and bulk endpoints accept the composite `id` and route internally to the correct table.

## Alternatives considered

### A. Collapse Portal/CRM and the three order tables into single Prisma models

Appealing for purity but requires a large destructive migration, downtime, and full rework of every dependent feature (portal self-serve, CRM pipeline, APK build queue). The team could not justify the risk. Rejected.

### B. Leave the UI scattered and invest in better cross-links

Status quo ante. Fast to not build. Loses the core user value of the Admin Panel. Rejected.

### C. Build a materialized view / denormalized `clients_unified` table

Considered as a performance upgrade path. Deferred until p95 on the in-memory merge exceeds 400 ms with real production data. At 10k clients today, the merge runs in under 150 ms. Revisit if/when we hit 100k clients.

## Consequences

### Positive

- Managers open **one page** per client or order, not three.
- New features (audit tab, assets tab, saved segments) have one surface to ship against, not two.
- Reuses 100% of the existing data model — no downtime, no migration, no data loss risk.
- Each existing system (portal, CRM, APK builder) continues to work exactly as before; the Admin Panel is purely additive.

### Negative

- The unified list performs an in-memory merge. Not suitable above ~100k rows without the materialized view path in Alternative C.
- Two sources of truth for "who is this client" remain in the database schema. New features must explicitly handle the member/account duality. Documented in `docs/admin-panel/Staff_Handbook.docx`.
- The `AdminOrderStatus` enum is one more thing to keep in sync with the underlying per-source statuses.

## Mitigations

- **Audit log contract** (`docs/adrs/0002-*.md` covers the audit helper): every state-mutating admin endpoint writes a `SystemAuditLog` row, enforced by the `scripts/audit-coverage.mjs` CI check.
- **Shared types in `packages/types/src/admin`**: one place where `UnifiedClient`, `AdminOrder`, and `AdminOrderStatus` live; both the API and the management app import them, which prevents shape drift.
- **Playwright golden flows** (`e2e/admin-panel.spec.ts`): eight scripted end-to-end tests that exercise the unified surface against a seeded environment.

## References

- Notion — Implementation Roadmap & Phases: https://www.notion.so/344510b39ec9816d9758d2c168108060
- Notion — Data Model & API Contracts: https://www.notion.so/344510b39ec9811b9679fa58e6bbdb72
- Code — `apps/api/src/routes/admin/clients.ts`, `apps/api/src/routes/admin/orders.ts`
- Code — `packages/types/src/admin/index.ts`

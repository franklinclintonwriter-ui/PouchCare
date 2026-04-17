# ADR 0002 — ServicePlan Model

- **Status:** Accepted
- **Date:** 2026-04-17
- **Deciders:** Backend lead, DBA, CEO
- **Relates to:** ADR 0001 (Admin Panel unified surface)

## Context

The `Service` model has historically captured a single base price and turnaround time per service. Real offerings often have tiers:

- Starter (cheap, slower, fewer revisions)
- Pro (mainstream price/speed)
- Enterprise (premium, faster, more revisions)

The older `BacklinkPackage` model implements this pattern **only for the Backlinks service** with a proliferation of per-quantity fields (`priceX10`, `priceX50`, `priceX100`, `priceX1000`). It does not generalize to other services (Hosting, Web-to-APK, SEO audits), so teams invent new tables every time a new service wants tiered pricing.

## Decision

Introduce a generic **`ServicePlan`** Prisma model that can be attached to any `Service`. Each plan captures name, USD/BDT price, delivery days, a `features` array, a `isPopular` flag, and a `displayOrder` for sort control.

```prisma
model ServicePlan {
  id            String   @id @default(uuid())
  serviceId     String   @map("service_id")
  service       Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  name          String
  priceUsd      Float    @map("price_usd")
  priceBdt      Float?   @map("price_bdt")
  deliveryDays  Int?     @map("delivery_days")
  features      String[] @default([])
  isPopular     Boolean  @default(false) @map("is_popular")
  displayOrder  Int      @default(0) @map("display_order")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([serviceId, displayOrder])
  @@map("service_plans")
}
```

Migration: `apps/api/prisma/migrations/20260417120000_service_plans/migration.sql`. Apply with `npx prisma migrate deploy` (prod) or `npx prisma migrate dev` (dev).

### CRUD

- `GET    /v1/admin/services/:id/plans`
- `POST   /v1/admin/services/:id/plans`
- `PATCH  /v1/admin/services/:id/plans/:planId`
- `DELETE /v1/admin/services/:id/plans/:planId`

All writes are audited. The GET endpoint degrades gracefully if the migration has not been applied (returns a clear 400 `service_plans table missing — apply migration …` so the UI can show a helpful message rather than crashing).

### Public surface

The existing `GET /v1/services` (public landing) is extended to include `plans: ServicePlan[]` per service. The addition is backwards compatible — older consumers ignoring the field continue to work.

## Alternatives considered

### A. Generalize by renaming `BacklinkPackage` to `ServicePlan`

Would require a destructive migration (column renames, FK changes) and data backfill. The new model fits differently enough (no per-quantity pricing) that renaming would leak old shape into the new API. Rejected.

### B. Store plans as JSON on `Service`

Fast to ship (no table, no migration). Loses indexability (can't sort by price), loses per-plan audit capture, complicates analytics queries, and makes order-to-plan linkage awkward. Rejected.

### C. Defer plans to a later quarter

Initially considered. Decided against because the Admin Panel's ServiceDetail page has first-class space for plans in the UI design, and shipping without them would leave an obvious gap in the product surface.

## Consequences

### Positive

- Any service can offer tiered pricing without a new table or new backend endpoint.
- Plans have their own indexes, their own CRUD, and are audited individually.
- `BacklinkPackage` continues to work exactly as today; we can migrate it to `ServicePlan` at a later date when there is value.

### Negative

- Two systems for tiered pricing exist side by side (`BacklinkPackage` and `ServicePlan`) until we deprecate the former.
- Orders still reference the service by **name string** (`PortalOrder.service`) rather than a plan ID. Upgrading to plan-ID references is a follow-up ADR.

## Mitigations

- The Admin Panel's ServiceDetail Plans tab is the only plan-editing UI; future order-to-plan coupling happens in one place.
- Audit coverage (`scripts/audit-coverage.mjs`) verifies every plan mutation writes an audit row.

## References

- Migration: `apps/api/prisma/migrations/20260417120000_service_plans/migration.sql`
- Backend: `apps/api/src/routes/admin/services.ts` (plans CRUD at bottom)
- Frontend: `apps/management/src/pages/admin/services/ServiceDetail.tsx` (Plans tab)
- Types: `apps/management/src/api/admin-services.ts` (`ServicePlan` interface + hooks)

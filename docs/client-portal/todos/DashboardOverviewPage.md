# DashboardOverviewPage.tsx — TODO

- **Route:** `/dashboard`
- **Approx lines:** 211
- **Source:** `apps/landing/src/pages/dashboard/DashboardOverviewPage.tsx`

**Purpose.** Welcome splash with wallet/referral/domain/invoice KPI cards, recent orders, and quick-action grid. Fires 6 parallel API queries.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Replace placeholder `"…"` loading state with `Skeleton` stat cards so the grid does not jump on slow networks.
- [ ] Add error fallback UI for each of the 6 queries; currently silent failure just renders `0`.
- [ ] Cap or paginate the secondary queries (`usePortalDomains(1, 100)`, `usePortalInvoices(1, 100)`, `usePortalWebsites(1, 100)`) — unnecessary on the overview page.

## P2 — Nice-to-have

- [ ] Introduce `staleTime` per secondary query so returning to the page doesn't refetch everything at once.

## Enhancements

- [ ] Show "welcome back, first-name" using the resolved portal profile.
- [ ] Surface one actionable CTA card (e.g., "Verify your email" / "Top up your wallet") based on profile completeness.
- [ ] Deep-link each KPI card to its detail page instead of plain read-only cards.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

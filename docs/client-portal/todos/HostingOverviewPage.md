# HostingOverviewPage.tsx — TODO

- **Route:** `/dashboard/hosting`
- **Approx lines:** 259
- **Source:** `apps/landing/src/pages/dashboard/HostingOverviewPage.tsx`

**Purpose.** Hosting hero, KPI cards (active domains, SSL, MRR, next renewal), responsive domain grid.

## P0 — Blockers

- [ ] `nearestExpiry` (lines 33-38) calls `.sort()` on `Date` objects derived from raw strings — if any `expiresAt` is invalid the sort silently returns NaN-ordered garbage. Parse + filter valid dates first, fall back to "—" if none.

## P1 — Should fix

- [ ] "Request migration" opens a mailto link without warning (line 75) — add a tooltip or confirm sheet ("Opens your email client").

## P2 — Nice-to-have

- [ ] Mobile: 2-col "Plan / Monthly" grid (line 149) wraps awkwardly on iPhone SE. Collapse to a single column below 360 px.

## Enhancements

- [ ] Renewal-soon banner when any domain expires in ≤14 days.
- [ ] One-click auto-renew toggle on each card.
- [ ] Filter by plan (starter / pro / enterprise).

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

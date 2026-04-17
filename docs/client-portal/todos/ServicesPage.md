# ServicesPage.tsx — TODO

- **Route:** `/dashboard/services`
- **Approx lines:** 156
- **Source:** `apps/landing/src/pages/dashboard/ServicesPage.tsx`

**Purpose.** Service catalog with search + category filter and "Add to cart" button. Cart lives in Zustand.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Category derivation `useMemo` recomputes on every render regardless of data identity — narrow the dependency to `data?.length` or hash.

## P2 — Nice-to-have

- [ ] Mobile: `line-clamp-3` on description can truncate prices/plans that sit at the bottom of the card — show a "Read more" affordance.
- [ ] Distinguish "no results for search" vs "no services configured" empty states.

## Enhancements

- [ ] Once `ServicePlan` ships, render per-service plan tiers inline with a "pick plan" segmented control.
- [ ] Add a "Featured" row pinned to the top for flagged services.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

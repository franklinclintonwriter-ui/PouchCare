# OrdersPage.tsx — TODO

- **Route:** `/dashboard/orders`
- **Approx lines:** 218
- **Source:** `apps/landing/src/pages/dashboard/OrdersPage.tsx`

**Purpose.** Filterable + searchable orders list. Status tabs (all/pending/processing/completed/cancelled). Responsive: cards on mobile, table on desktop.

## P0 — Blockers

- [ ] Remove the duplicated `orderStatusVariant` helper (lines 17–23) — one copy only, in `lib/format.ts`.

## P1 — Should fix

- [ ] Debounce the search input (300 ms); currently runs `useMemo` on every keystroke across up to 100 orders.
- [ ] Give status filter row proper tab semantics: `role="tab"`, `aria-selected`, keyboard left/right arrow navigation.
- [ ] Show `Skeleton` rows while loading instead of plain "Loading…".
- [ ] Replace the unbounded `(1, 100)` fetch with real pagination once the `Pagination` primitive exists.

## P2 — Nice-to-have

- [ ] Mobile: filter row `overflow-x-auto` needs a visible scroll hint chevron; small buttons are hard to tap.

## Enhancements

- [ ] Empty state per filter (e.g., "No pending orders — try `All`" with a one-click clear).
- [ ] Bulk-select with cancel/export once filter is set.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

# CartPage.tsx — TODO

- **Route:** `/dashboard/cart`
- **Approx lines:** 188
- **Source:** `apps/landing/src/pages/dashboard/CartPage.tsx`

**Purpose.** Checkout view. Line items with qty stepper, subtotal, sticky summary on desktop. Current checkout fires one mutation per item.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Checkout loop calls `place.mutateAsync()` per item (line 25-31) — N round-trips. Replace with a single `POST /portal/orders/batch` that the backend accepts atomically.
- [ ] Add `ConfirmDialog` before checkout — cart total + card count — current flow places orders on a single click.
- [ ] Quantity stepper has no bounds; users can hit -99 or 0. Min = 1, max per-service cap from the plan.

## P2 — Nice-to-have

- [ ] Sticky summary sidebar can overlap content on mid-height viewports (portrait tablet) — test on iPad.

## Enhancements

- [ ] Promo code input + backend redemption.
- [ ] Wallet-first toggle — "pay with wallet balance ($X available)" vs "create invoice".
- [ ] Save-for-later list next to "Remove".

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

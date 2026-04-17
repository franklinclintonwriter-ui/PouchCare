# BillingPage.tsx — TODO

- **Route:** `/dashboard/billing`
- **Approx lines:** 289
- **Source:** `apps/landing/src/pages/dashboard/BillingPage.tsx`

**Purpose.** Commission payout request form, commission ledger table/cards, payout history table/cards.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Three `useState` chains (amount, method, details) → migrate to react-hook-form + Zod.
- [ ] Unbounded queries: commission `(1, 20)` and payout history `(1, 30)` — wire real pagination.

## P2 — Nice-to-have

- [ ] Payout "details" textarea has no format validation — users can type a bank account into a TRC20 field.
- [ ] Placeholder mixes three payment methods' examples — conditionally render help text per selected method.

## Enhancements

- [ ] Client-side regex per method: TRC20 (`T[A-Za-z0-9]{33}`), Payoneer email, IBAN, local BD bank format.
- [ ] Live commission counter ("you have $X claimable, $Y on hold releasing Z days").
- [ ] CSV export of commission ledger.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

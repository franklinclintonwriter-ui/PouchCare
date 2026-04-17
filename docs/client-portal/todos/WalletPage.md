# WalletPage.tsx — TODO

- **Route:** `/dashboard/wallet`
- **Approx lines:** 214
- **Source:** `apps/landing/src/pages/dashboard/WalletPage.tsx`

**Purpose.** Wallet balance card + deposit request form + transaction history (cards on mobile, table on desktop).

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Deposit form lacks ConfirmDialog before submit — users accidentally submit deposit requests.
- [ ] Proof URL `type="url"` but no client-side regex; add `zod.string().url()`.
- [ ] Transaction-color ternary duplicated at lines 159 and 195. Extract `transactionColor(amount)` helper.

## P2 — Nice-to-have

- [ ] Empty state when no transactions ever — current path shows only the header.

## Enhancements

- [ ] Support multiple deposit methods (bank, crypto) driven from system config, not hardcoded.
- [ ] Running balance column in the transactions table.
- [ ] Download statement (PDF / CSV) for a selected month.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

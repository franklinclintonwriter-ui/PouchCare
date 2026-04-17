# HostingRegisterPage.tsx — TODO

- **Route:** `/dashboard/hosting/register`
- **Approx lines:** 222
- **Source:** `apps/landing/src/pages/portal/HostingRegisterPage.tsx`

**Purpose.** Domain search + registration with plan selector. Currently a mock — no real registrar integration.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] "Enter at least 2 characters" error fires only on submit. Surface as inline hint under the input as the user types.
- [ ] Unavailable domains are rendered with a disabled button (lines 158-164); visually noisy. Hide the button entirely or replace with an info chip.

## P2 — Nice-to-have

- [ ] Plan selection lives in local state — reload resets it. Persist via URL query or `cartStore`.

## Enhancements

- [ ] Live price quote as user types (TLD-sensitive pricing).
- [ ] "Add to cart" instead of immediate registration flow so the user can register several domains at once.
- [ ] Integrate with the real Name.com adapter already on the API side (`lib/namecom.ts`).

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

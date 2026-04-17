# SupportPage.tsx — TODO

- **Route:** `/dashboard/support`
- **Approx lines:** 122
- **Source:** `apps/landing/src/pages/dashboard/SupportPage.tsx`

**Purpose.** New-ticket form + ticket list that deep-links to SupportTicketPage.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Message textarea has no `maxLength` — users can paste multi-MB text.
- [ ] Priority select is a hardcoded string-value `<select>` — migrate to a typed `Select` primitive + enum.
- [ ] No pagination on the ticket list.

## P2 — Nice-to-have

- [ ] Subject field has no minimum length — single-character subjects hit the backend.

## Enhancements

- [ ] Attachment upload on ticket creation.
- [ ] Smart "similar tickets" suggestion from past conversations.
- [ ] Category chips (Billing / Technical / Account) that drive routing on the staff side.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

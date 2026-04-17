# SupportTicketPage.tsx — TODO

- **Route:** `/dashboard/support/:id`
- **Approx lines:** 129
- **Source:** `apps/landing/src/pages/dashboard/SupportTicketPage.tsx`

**Purpose.** Ticket conversation thread, reply composer, close button.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Fixed `max-h-[480px]` on mobile (line 88) forces nested scrolling — use `min-h` + page scroll, or a resizer.
- [ ] Close button lacks a confirmation step.
- [ ] No `LogoSpinner` while loading — plain text state.

## P2 — Nice-to-have

- [ ] Staff vs client messages are only colour-differentiated — add an avatar + name chip for screen readers.

## Enhancements

- [ ] Attachments inside a thread.
- [ ] Reopen button on closed tickets.
- [ ] Staff "typing…" indicator via WS.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

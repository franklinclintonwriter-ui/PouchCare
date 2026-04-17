# OrderDetailPage.tsx — TODO

- **Route:** `/dashboard/orders/:id`
- **Approx lines:** 360
- **Source:** `apps/landing/src/pages/dashboard/OrderDetailPage.tsx`

**Purpose.** Single-order workbench: message thread, revision request, rate & review, cancel. Three inline forms, three `useState` chains.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Replace `window.confirm()` (line 44) with the existing `ConfirmDialog` — not keyboard-accessible today.
- [ ] Message thread has fixed `max-h-72` and does not auto-scroll to bottom on new message; last reply is invisible.
- [ ] Migrate revision + review forms to react-hook-form + Zod; kill the three `useState` chains.
- [ ] Clear the textarea on send via optimistic update or `reset()` — users see stale text after send.

## P2 — Nice-to-have

- [ ] Show an "awaiting staff reply" indicator when the last message is from the client.

## Enhancements

- [ ] Attachments on messages (images, zip) — requires `FileUpload` primitive.
- [ ] Typing indicator / unread marker coming from WS if the backend exposes it.
- [ ] Re-order action — quick "order again" button on completed orders.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

# NotificationsPage.tsx — TODO

- **Route:** `/dashboard/notifications`
- **Approx lines:** 146
- **Source:** `apps/landing/src/pages/dashboard/NotificationsPage.tsx`

**Purpose.** Paginated notifications inbox with read/unread, "Mark all read" action, and Previous/Next pagination.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] No visible unread count in the page header — users must scan the list.
- [ ] Inline `timeAgo()` helper (lines 15-25) — move to `lib/date.ts` so other pages can share it.
- [ ] Previous/Next only — add a page input or first/last jump.

## P2 — Nice-to-have

- [ ] Row buttons cover the entire list row (line 81) but the action "click to mark read" is buried; add an explicit marker icon for keyboard users.

## Enhancements

- [ ] Group notifications by day ("Today", "Yesterday", "Last 7 days").
- [ ] Filter by kind (orders / billing / support / system).
- [ ] Push / browser notifications opt-in from here.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

# WebsitesPage.tsx — TODO

- **Route:** `/dashboard/websites`
- **Approx lines:** 351
- **Source:** `apps/landing/src/pages/dashboard/WebsitesPage.tsx`

**Purpose.** "My Websites" grid with health tiles (SEO, uptime, SSL), add/delete website.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Add-Website form appears inline (line 113) without scroll lock or overlay. Use `useBodyScrollLock` + `Sheet` component.
- [ ] Repeated long Tailwind className strings on the two selects (lines 144-170). Extract to `selectInputClass` in `lib/ui.ts`.
- [ ] Delete icon button has neither colour affordance nor an explicit `aria-label` — red tint + label needed.

## P2 — Nice-to-have

- [ ] 2-col stat grid on very small phones is cramped — collapse to 1-col under 360 px.

## Enhancements

- [ ] Real uptime/SEO metrics pulled from the staff assets pipeline instead of stubs.
- [ ] Attach a website to a domain inline.
- [ ] Bulk re-check action on the whole list.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

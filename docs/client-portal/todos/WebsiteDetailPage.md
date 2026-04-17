# WebsiteDetailPage.tsx — TODO

- **Route:** `/dashboard/websites/:id`
- **Approx lines:** 400
- **Source:** `apps/landing/src/pages/dashboard/WebsiteDetailPage.tsx`

**Purpose.** Single-website detail: edit form, perf metrics, SSL, tech stack, delete.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Edit form pushes the save button below the fold; floating action bar needed.
- [ ] Multiple `useState` (isEditing, editName, editUrl, editType, editPlatform, deleteConfirm) — fold into react-hook-form.

## P2 — Nice-to-have

- [ ] Metric tiles (lines 275-303) wrap the whole card in a link but the link text is only the numeric value. Add `aria-label="Open SEO analytics for …"`.

## Enhancements

- [ ] Historical trend chart for uptime / SEO score.
- [ ] "Recheck now" button that triggers a re-scan.
- [ ] Attach to multiple domains (alias list).

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

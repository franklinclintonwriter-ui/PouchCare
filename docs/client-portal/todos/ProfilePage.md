# ProfilePage.tsx — TODO

- **Route:** `/dashboard/profile`
- **Approx lines:** 720
- **Source:** `apps/landing/src/pages/dashboard/ProfilePage.tsx`

**Purpose.** Six-section profile form: identity, contact, company, address, account info, linked services. Uses react-hook-form per section.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Six separate forms each with their own Save — users scroll, miss buttons. Consolidate into one form with section headings + one floating Save.
- [ ] Avatar upload (line 260) is a mock — "no upload endpoint yet". Either ship the endpoint or hide the avatar picker.
- [ ] `eslint-disable-line react-hooks/exhaustive-deps` at lines 149 and 173 — fix the underlying missing deps instead.

## P2 — Nice-to-have

- [ ] Labels use HTML `required` on fields that are in fact optional (phone, telegram). Fix or drop `required`.
- [ ] Mobile: avatar preview flex layout (lines 318-365) causes jumpy reflow between breakpoints.

## Enhancements

- [ ] Auto-detect country from IP on first visit; let user override.
- [ ] Phone field with a country-code dropdown.
- [ ] Company tax-ID validation per country.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

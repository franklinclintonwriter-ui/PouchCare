# LoginPage.tsx — TODO

- **Route:** `/my-accounts/login`
- **Approx lines:** 120
- **Source:** `apps/landing/src/pages/portal/LoginPage.tsx`

**Purpose.** Email + password login, forgot-password + sign-up links.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] No "Show password" toggle.
- [ ] No "Remember me" option — users re-type email every session.

## P2 — Nice-to-have

- [ ] Shared `accountInputClass` utility is referenced without verification — audit `lib/ui.ts` for a11y attributes on focus/error states.

## Enhancements

- [ ] SSO / Google / Apple sign-in if product opens up.
- [ ] Magic-link passwordless option.
- [ ] Throttle + captcha after N failed attempts.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

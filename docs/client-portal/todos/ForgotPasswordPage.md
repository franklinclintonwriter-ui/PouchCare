# ForgotPasswordPage.tsx — TODO

- **Route:** `/my-accounts/forgot-password`
- **Approx lines:** 87
- **Source:** `apps/landing/src/pages/portal/ForgotPasswordPage.tsx`

**Purpose.** Email entry → reset request. Success message is intentionally ambiguous to prevent enumeration.

## P0 — Blockers

_None._

## P1 — Should fix

_None._

## P2 — Nice-to-have

- [ ] Add a "Resend email" button after N seconds so legitimate users with wrong spelling or typos can retry without re-submitting the form.

## Enhancements

- [ ] Small countdown timer between resend attempts.
- [ ] "Check spam folder" hint after 30 s with no click.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

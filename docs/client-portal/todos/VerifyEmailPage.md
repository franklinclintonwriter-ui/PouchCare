# VerifyEmailPage.tsx — TODO

- **Route:** `/my-accounts/verify-email`
- **Approx lines:** 214
- **Source:** `apps/landing/src/pages/portal/VerifyEmailPage.tsx`

**Purpose.** Dual flow — auto-verify from a URL token, or manual OTP entry + resend.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Error messages are generic (line 41). Discriminate "token expired" from "invalid token" from "already verified".
- [ ] `attemptedRef` (lines 27-31) is lost on route re-mount; a user that bounces around can accidentally trigger a double verify. Gate by a hash of `token+email`.
- [ ] Resend button has no cooldown — can be spammed (lines 160-167). 60 s client-side + server-side rate limit.

## P2 — Nice-to-have

- [ ] OTP `<input>` accepts any characters and any length. Enforce digits-only and auto-submit at 6 chars.

## Enhancements

- [ ] Offer a "Re-send to a different email" flow in case the user typoed registration.
- [ ] Resume back to the dashboard with the original intent (e.g., if user was trying to place an order) after verification.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

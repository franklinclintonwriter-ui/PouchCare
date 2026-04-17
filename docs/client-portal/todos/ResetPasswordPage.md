# ResetPasswordPage.tsx — TODO

- **Route:** `/my-accounts/reset-password`
- **Approx lines:** 141
- **Source:** `apps/landing/src/pages/portal/ResetPasswordPage.tsx`

**Purpose.** Consume reset token from URL, set new password, confirm, redirect.

## P0 — Blockers

- [ ] `setTimeout(() => navigate(...), 1500)` (line 43) — if the user closes the tab in that window, the reset is applied server-side but the session isn't re-established. Redirect immediately on mutation success.

## P1 — Should fix

- [ ] No password strength indicator — share the component with SettingsPage and RegisterPage.
- [ ] Invalid token shows minimal copy (line 56) — add a "Request a new reset link" button.

## P2 — Nice-to-have

- [ ] Token sits in the URL query string, visible in browser history. Move to POST body or a one-time opaque reference.

## Enhancements

- [ ] Show last-known login email (masked) on the success panel for trust.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

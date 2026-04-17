# SettingsPage.tsx — TODO

- **Route:** `/dashboard/settings`
- **Approx lines:** 500
- **Source:** `apps/landing/src/pages/dashboard/SettingsPage.tsx`

**Purpose.** Security + settings: password change (with strength indicator), 2FA placeholder, active sessions, login history, notification toggles, appearance (theme + accent), danger zone.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Password requirements appear **after** the user starts typing. Show them upfront.
- [ ] `ToggleRow` (lines 79-130) implements the switch pattern from scratch — use a native `<input type="checkbox">` with `role="switch"` + `aria-checked`, or add a reusable `Toggle` to the UI kit.
- [ ] Danger-zone delete account lacks a confirm-with-typed-email step.

## P2 — Nice-to-have

- [ ] Active-sessions and login-history lists have loading skeletons but no real data path (endpoint stub).

## Enhancements

- [ ] Ship 2FA (TOTP + recovery codes) — backend fields already exist on `PortalMember`.
- [ ] Per-device session revoke.
- [ ] Export-my-data button that packages the user's profile, orders, wallet history into a zip (GDPR right-to-access).

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

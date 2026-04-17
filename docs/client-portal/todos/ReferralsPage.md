# ReferralsPage.tsx — TODO

- **Route:** `/dashboard/referrals`
- **Approx lines:** 152
- **Source:** `apps/landing/src/pages/dashboard/ReferralsPage.tsx`

**Purpose.** Referral code + share link, stats (code/count/earnings), referral list as cards/table.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Referral link is truncated inside a readonly input (line 66) via `truncate` class — users never see the full URL without copying. Use a wider font or wrap.
- [ ] "Copied" badge times out after 2 s (line 25) but does not animate back — appears stuck until page re-renders.

## P2 — Nice-to-have

- [ ] `navigator.clipboard` has no fallback — acceptable for modern browsers, but add a "Copy failed — select the link" branch for legacy.

## Enhancements

- [ ] One-tap share intents (WhatsApp / Telegram / X) pre-filled with a template line.
- [ ] QR code generator for the referral link.
- [ ] Per-referral status chip (active / pending / churned) once member data ships.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

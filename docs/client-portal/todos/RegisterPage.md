# RegisterPage.tsx — TODO

- **Route:** `/my-accounts/register`
- **Approx lines:** 200
- **Source:** `apps/landing/src/pages/portal/RegisterPage.tsx`

**Purpose.** Registration with optional country/phone + password/confirm. Referral code pulled from `?ref=` query.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] No password strength indicator — SettingsPage has one; promote it to a shared component and reuse here.
- [ ] Referral code is accepted blindly from the URL — validate its format and surface "Referred by …" so the user knows it stuck.
- [ ] Country + phone are optional but have no visual "(optional)" indicator.

## P2 — Nice-to-have

- [ ] Confirm-password mismatch fires only on submit — validate on blur.

## Enhancements

- [ ] GDPR / ToS checkbox with link preview.
- [ ] Marketing opt-in checkbox (separated from ToS).
- [ ] Capture UTM params from the URL and persist them to the member record for attribution.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

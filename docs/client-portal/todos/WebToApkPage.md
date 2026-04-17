# WebToApkPage.tsx — TODO

- **Route:** `/dashboard/web-to-apk`
- **Approx lines:** 409
- **Source:** `apps/landing/src/pages/dashboard/WebToApkPage.tsx`

**Purpose.** Web-to-APK job creation, plan selector, polled job list with download links.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Every row component calls `useApkJob()` to poll (lines 48, 98). When the user navigates away, polling keeps firing. Clean up via `AbortController` or lift polling to the parent list.
- [ ] `JobTableRow` and `JobMobileCard` accept `any` (lines 46, 96). Define a `PortalApkJob` type and remove `any`.
- [ ] Plan is global state that only applies to **new** jobs, but UX does not say so. Add a caption "Applies to new conversions only".

## P2 — Nice-to-have

- [ ] Download button placement differs between table and mobile — align.

## Enhancements

- [ ] Build log streaming (or at least a truncated log preview) on the detail panel.
- [ ] Webhook: notify client when a build finishes (email + in-app).
- [ ] APK versioning — show previous builds for the same site.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

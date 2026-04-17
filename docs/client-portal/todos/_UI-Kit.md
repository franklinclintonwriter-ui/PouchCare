# UI kit gaps — client portal

Adding these primitives to `apps/landing/src/components/ui/` removes duplication on 15+ pages. Target: ship all in Week 1.

## Primitives to add

- [ ] `Skeleton` — rows, cards, stat tiles, text shimmer. Used by every list and detail page.
- [ ] `Tabs` — keyboard nav, ARIA tab / tabpanel roles. Used by OrdersPage, InvoicesPage, WalletPage.
- [ ] `Select` — styled to match `Input`. Used by Web-to-APK plans, Profile country, Settings locale, Support priority.
- [ ] `FormField` — label + input + error + help slot; integrates with react-hook-form. Used across **every** form.
- [ ] `DataTable` — responsive (card-on-mobile / table-on-desktop) to replace the repeated `ResponsiveSplit` pattern.
- [ ] `FileUpload` — drag-drop + preview. Needed for Profile avatar, Web-to-APK zip, Support attachments.
- [ ] `PasswordStrength` — already implicit in SettingsPage; promote to reusable, consume in RegisterPage + ResetPasswordPage.
- [ ] `EmptyState` — icon + title + description + action. 14 pages re-roll their own "Nothing here".
- [ ] `Pagination` — previous/next + first/last + page input + page-size select.
- [ ] `ErrorState` — icon + title + message + retry + technical-details toggle. Standardises the "Failed to load" experience.
- [ ] `CopyButton` — text + copy icon + "copied!" animation. Used on Referrals, Profile, Settings, Hosting.
- [ ] `Toggle` — native `role="switch"` pattern. Replaces the hand-rolled `ToggleRow` in SettingsPage.
- [ ] `HelpText` — small caption with info icon + tooltip for field hints.

## Conventions

- Every primitive:
  - **forwardRef** so it composes with react-hook-form.
  - Accepts `className` via `tailwind-merge` so consumers can override.
  - Has a Storybook-style demo (can live in `apps/landing/src/pages/_dev/`) until a true Storybook is set up.
  - Has at least one Vitest component test.

## Acceptance

- [ ] All 13 primitives shipped with docs + tests.
- [ ] Page audit re-run — at least 80% of the P1 TODOs rewritten as "use `FormField` / `Skeleton` / `Pagination`".
- [ ] Bundle size of `components/ui/` under 20 KB gzipped (audit via the admin-panel's `bundle-budget` script, pointed at landing).

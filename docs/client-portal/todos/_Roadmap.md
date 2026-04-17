# 6-week client-portal enhancement roadmap

Each week is a shippable milestone. Weekly work is broken into concrete checkboxes; tick them as PRs land.

## Week 1 — UI kit (foundational)

- [ ] Ship `Skeleton`, `ErrorState`, `EmptyState`, `Tabs`, `Select`, `FormField`, `Pagination`, `DataTable`, `FileUpload`, `CopyButton`, `Toggle`, `PasswordStrength`, `HelpText` — see `_UI-Kit.md`.
- [ ] Add Vitest component tests for each.
- [ ] Document tokens (`src/theme/tokens.ts`).

## Week 2 — Forms migration

- [ ] Consolidate every form onto react-hook-form + Zod.
- [ ] Replace every `useState` trio (form + error + submitting) with `useForm`.
- [ ] Wrap every field in `FormField`.
- [ ] Replace every `window.confirm()` with `ConfirmDialog` on destructive actions.

## Week 3 — Error + loading pass

- [ ] Replace every `"Loading…"` string with a `Skeleton`.
- [ ] Replace every `"Failed to load"` string with `ErrorState` wired to `refetch`.
- [ ] Pipe API error envelopes (`error.response?.data?.error`) into the ErrorState message.
- [ ] Set `staleTime` per query on multi-query pages (DashboardOverview, Hosting, Billing, Settings).

## Week 4 — Pagination + perf

- [ ] Real `Pagination` on Orders, Invoices, Notifications, Billing ledger, Payouts, Wallet transactions, Support tickets.
- [ ] Fix the InvoicesPage double-fetch (use `meta.total`).
- [ ] Kill every `(1, 100)` / `(1, 1000)` fetch that was a placeholder for pagination.
- [ ] Lazy-load Web-to-APK polling; tear down on unmount.
- [ ] Lazy-load heavy dependencies (print CSS, charts, recharts).

## Week 5 — Accessibility

- [ ] `aria-label` on every icon-only button.
- [ ] `useFocusTrap` on every Modal / Sheet / Drawer that currently leaks focus.
- [ ] `role="tab"` + `aria-selected` on tab-like filter rows.
- [ ] Add `e2e/client-a11y.spec.ts` (mirror of the admin-panel a11y spec) with axe-core on every dashboard + portal route.
- [ ] Fail CI on any serious/critical axe violation.

## Week 6 — Feature polish

- [ ] `PasswordStrength` on Register + Reset + Settings.
- [ ] OTP digit-mask + auto-submit on VerifyEmail.
- [ ] Resend cooldowns (60 s) on VerifyEmail + ForgotPassword.
- [ ] Wallet + payout regex validators per method (TRC20, Payoneer, IBAN, BD bank).
- [ ] Real avatar upload endpoint + wiring (Profile).
- [ ] Remove or ship the stub "Email invoice" action.
- [ ] SMS / 2FA ship or hide "Coming soon" tab.

## Success criteria

- [ ] Every `P0` in `Audit_Report.md` checked.
- [ ] Every `P1` in per-page TODOs checked.
- [ ] `npm run test:e2e` green on the new client-portal specs (a11y + golden flows).
- [ ] Bundle budget under 250 KB gz per route (client dashboard).
- [ ] p95 list-page response under 400 ms at 10k seeded rows.

## Tracking

Weekly checkpoints land in the **#client-portal** Slack channel every Friday. At the end of each week, tick boxes here and in the per-page TODO files.

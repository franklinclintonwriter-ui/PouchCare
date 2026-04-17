# Cross-cutting TODO — client portal

Issues that span the whole portal. Fixing each of these once removes work from many per-page TODOs.

## P0 — Blockers

- [ ] Audit every `window.confirm()` call and replace with the existing `ConfirmDialog` from `src/components/ui/ConfirmDialog.tsx`. At minimum: OrderDetailPage (cancel), CartPage (checkout), WalletPage (deposit), WebsitesPage (delete), SupportTicketPage (close), SettingsPage (delete account).

## P1 — Systemic

### Error UI
- [ ] Add an `ErrorState` primitive to `src/components/ui/` — icon + title + description + retry button + technical details toggle.
- [ ] Wrap every `useQuery` consumer with an explicit `isError` branch that renders `ErrorState`.
- [ ] Wire a retry handler (`refetch()` from react-query) to the button.
- [ ] Pipe error messages from the API envelope (`error.response?.data?.error`) so users see actionable copy, not "Failed to load".

### Loading UI
- [ ] Add `Skeleton` primitive (rows, cards, stat tiles) to the UI kit.
- [ ] Replace every plain `Loading…` text with a `Skeleton` of the same rough footprint as the loaded content.
- [ ] For pages with multiple independent queries (DashboardOverview, Hosting, Billing), render skeletons per card rather than one global spinner.

### Forms
- [ ] Migrate the remaining `useState`-driven forms to react-hook-form + Zod: CartPage qty steppers, BillingPage payout request, WalletPage deposit, OrderDetailPage revision + review, SupportPage new ticket.
- [ ] Introduce a `FormField` wrapper (label + input + error + help) so every form inherits a11y for free.
- [ ] Standardise form error display: inline under the field + a summary `sonner` toast on submit failure.

### Destructive actions
- [ ] Make `ConfirmDialog` the only path to delete, close, cancel, checkout, reset — catalogue every call site and migrate.

### Pagination
- [ ] Add a `Pagination` primitive (previous/next + first/last + page input).
- [ ] Replace every `use*(1, 100)` / `(1, 1000)` fetch with real pagination: OrdersPage, InvoicesPage (double-fetch fix), BillingPage (commissions + payouts), WalletPage, SupportPage.
- [ ] Use `useInfiniteQuery` for NotificationsPage if load-more is preferred over pages.

### Accessibility
- [ ] Add `aria-label` to every icon-only button (delete, edit, download, copy) — especially in WebsitesPage, InvoicesPage, NotificationsPage, HostingDomainDetailPage.
- [ ] Ensure every `Modal` and `Sheet` traps focus and restores it on close (`useFocusTrap` hook already exists in `src/hooks/`).
- [ ] Run `@axe-core/playwright` against every dashboard route — mirror the admin-panel a11y spec at `e2e/admin-a11y.spec.ts`.
- [ ] Add `role="tab"` + `aria-selected` to filter-bar tab clones (OrdersPage, InvoicesPage status chips).

### Performance
- [ ] DashboardOverviewPage fires 6 parallel queries; set `staleTime` per query so returning to the page does not refetch them all.
- [ ] Lazy-load heavy dependencies — the print stylesheet on InvoiceDetailPage, recharts on Settings theme preview, etc.
- [ ] Image lazy-loading (`loading="lazy"`) on avatars and service icons.

## P2

- [ ] Theme tokens (`src/theme/tokens.ts`) — map every hardcoded Tailwind colour (`text-emerald-700`, `text-red-600`) to a semantic token (`--color-success`, `--color-danger`) and drive dark-mode from there.
- [ ] Extract duplicated format helpers (`orderStatusVariant`, `transactionColor`, `timeAgo`) into `src/lib/format.ts` and `src/lib/date.ts`.
- [ ] Document the state-management model (Zustand vs react-query vs useState) in `docs/client-portal/STATE.md`.

## Security

- [ ] Move the reset-password token out of the URL into a POST body or a one-time reference.
- [ ] Add regex validation per payout method (TRC20, Payoneer, IBAN, local BD bank) on BillingPage.
- [ ] Remove or ship the stub "Email invoice" button on InvoiceDetailPage.
- [ ] Add 60 s resend cooldown on VerifyEmailPage (client + server).

## Tracking

Every item here has a concrete landing spot in the 6-week roadmap (`_Roadmap.md`). As soon as the UI-kit primitives ship (W1), 40% of the P1 list becomes one-line PRs.

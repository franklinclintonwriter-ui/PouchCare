# Trae IDE Workflow — Complete the PouchCare Client Portal

> **Target repo:** `github.com/franklinclintonwriter-ui/PouchCare` (branch `develop`)
> **Only touch:** `apps/landing/src/` and `docs/client-portal/`.
> **Source of truth for status:** `docs/client-portal/Client_Portal_Tracker.xlsx`
> **Companion handoff doc:** `docs/client-portal/Completion_Brief.docx`

## Agent preamble (paste this into Trae's Agent prompt)

You are completing the remaining client-portal tasks for the PouchCare project. The
shared UI kit is 100% complete and lives under `apps/landing/src/components/ui/` —
every primitive you need (`Skeleton`, `EmptyState`, `ErrorState`, `CopyButton`,
`FormField`, `Select`, `PasswordStrength`, `Toggle`, `HelpText`, `Tabs`,
`Pagination`, `DataTable`, `FileUpload`) is already built, tested, and barrel-
exported from `@/components/ui`. **Do not add new primitives.** Compose.

Rules:

1. Import from the barrel: `import { DataTable, FormField, … } from "@/components/ui"`.
2. Every new / migrated form uses `react-hook-form` + `zod` + `FormField`.
3. Every destructive action uses `ConfirmDialog`. No `window.confirm()`. No `window.alert()`.
4. Loading = `Skeleton` / `Spinner`. Error = `ErrorState` with retry. Empty = `EmptyState`.
5. List pages should use `DataTable` + real server-side `Pagination` when the
   backend returns `meta.total`; otherwise client-side slice-pagination.
6. After every task: run `npm run type-check` in `apps/landing`; if clean, flip
   the matching row in `Client_Portal_Tracker.xlsx` → Status `Done` + add a
   `Shipped <YYYY-MM-DD>` note in the Notes column; commit with the task ID in
   the subject line (e.g., `fix(client): ProfilePage.form-consolidate`).
7. Touch **only** files under `apps/landing/src/` and `docs/client-portal/`.
   Backend + management-app changes → open a `TODO(api)` comment + append to
   `docs/client-portal/backlog-backend.md`, and continue.
8. One PR per page. Keep diffs reviewable.

---

## Reference snippets (use these patterns)

**Replacing a list-page loading/error/empty/table block:**

```tsx
import { DataTable, type DataTableColumn } from "@/components/ui"

const columns: DataTableColumn<T>[] = [
  { key: "name", header: "Name", cell: (r) => r.name },
  // …
]

return (
  <DataTable
    columns={columns}
    data={rows}
    getRowId={(r) => r.id}
    isLoading={q.isLoading}
    isError={q.isError}
    error={q.error}
    onRetry={() => q.refetch()}
    empty={{ icon: <Package />, title: "Nothing yet", description: "…" }}
    pagination={{ page, pageSize, total: q.data?.meta?.total ?? 0, onChange: setPage }}
  />
)
```

**Replacing a useState-driven form with RHF + FormField:**

```tsx
const schema = z.object({ email: z.string().email(), amount: z.coerce.number().positive() })
const { register, handleSubmit, formState: { errors } } =
  useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), mode: "onBlur" })

<FormField label="Email" required error={errors.email?.message}>
  {({ id, "aria-describedby": d, "aria-invalid": i, "aria-required": r }) => (
    <Input id={id} type="email" aria-describedby={d} aria-invalid={i} aria-required={r}
           error={!!errors.email} {...register("email")} />
  )}
</FormField>
```

**Replacing window.confirm():**

```tsx
const [open, setOpen] = useState(false)
<Button onClick={() => setOpen(true)}>Delete</Button>
<ConfirmDialog
  open={open}
  onCancel={() => setOpen(false)}
  onConfirm={() => void doDelete()}
  title="Delete this item?"
  description="This cannot be undone."
  confirmLabel="Delete"
  variant="danger"
  loading={mutation.isPending}
/>
```

---

## How to update the tracker after each task

```bash
# 1. Open the tracker
# docs/client-portal/Client_Portal_Tracker.xlsx
# 2. Filter All Todos by Page/Area + Task substring
# 3. Set Status = "Done", fill Notes "Shipped YYYY-MM-DD (Trae IDE — <TaskID>)"
# 4. Save. The Overview / By Page tabs recompute via formulas.
```

---

## BillingPage

_Open: 3 Enh · 3 total_

- [ ] `BillingPage.regex-per-payoneer-bd` — **[Enh]** Client-side regex per method: TRC20, Payoneer email, IBAN, BD bank.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `BillingPage.live-commission-counter` — **[Enh]** Live commission counter (claimable / on-hold releasing).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `BillingPage.csv-export-of-commission` — **[Enh]** CSV export of commission ledger.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## CartPage

_Open: 1 P1 · 1 P2 · 3 Enh · 5 total_

- [ ] `CartPage.checkout-loop-calls-mutateasync` — **[P1]** Checkout loop calls mutateAsync per item (25-31) — replace with single POST /portal/orders/batch.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `CartPage.sticky-summary-can-overlap` — **[P2]** Sticky summary can overlap content on mid-height viewports — test on iPad portrait.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `CartPage.promo-code-input-backend` — **[Enh]** Promo code input + backend redemption.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `CartPage.toggle-with-wallet-balance` — **[Enh]** Wallet-first toggle (pay with wallet balance vs invoice).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `CartPage.list-next-to` — **[Enh]** Save-for-later list next to Remove.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## DashboardOverviewPage

_Open: 3 P1 · 1 P2 · 3 Enh · 7 total_

- [ ] `DashboardOverviewPage.replace-placeholder-loading-state` — **[P1]** Replace placeholder `…` loading state with Skeleton stat cards so the grid does not jump on slow networks.
  - Replace the `Loading…` string with one of `Skeleton`, `SkeletonRow`, `SkeletonStat` or `SkeletonCard`.
  - On multi-query pages render **per-card** skeletons, not one global spinner.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `DashboardOverviewPage.add-error-fallback-ui` — **[P1]** Add error fallback UI for each of the 6 queries; currently silent failure just renders 0.
  - Wrap `q.isError` branches with `<ErrorState error={q.error} onRetry={() => q.refetch()} />`.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `DashboardOverviewPage.cap-or-paginate-the` — **[P1]** Cap or paginate the secondary queries (domains/invoices/websites) — unnecessary on the overview page.
  - Wire the shared `<Pagination>` against `data.meta.total` if the backend returns it; otherwise slice the array.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `DashboardOverviewPage.introduce-staletime-per-secondary` — **[P2]** Introduce staleTime per secondary query so returning does not refetch everything at once.
  - Pass `staleTime` to each `useQuery` on multi-query pages so returning to the page doesn't refetch everything at once.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `DashboardOverviewPage.show-welcome-back-using` — **[Enh]** Show welcome back first-name using the resolved portal profile.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `DashboardOverviewPage.surface-one-actionable-cta` — **[Enh]** Surface one actionable CTA card (Verify email / Top up wallet) based on profile completeness.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `DashboardOverviewPage.each-kpi-card-to` — **[Enh]** Deep-link each KPI card to its detail page instead of read-only cards.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## ForgotPasswordPage

_Open: 1 P2 · 2 Enh · 3 total_

- [ ] `ForgotPasswordPage.add-resend-email-button` — **[P2]** Add Resend email button after N seconds.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `ForgotPasswordPage.countdown-timer-between-resend` — **[Enh]** Countdown timer between resend attempts.
  - Track `nextAvailableAt` in state; render the remaining seconds via `setInterval`, disable the action button until then.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `ForgotPasswordPage.check-spam-folder-hint` — **[Enh]** Check spam folder hint after 30s with no click.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## HostingDomainDetailPage

_Open: 1 P1 · 1 P2 · 3 Enh · 5 total_

- [ ] `HostingDomainDetailPage.dnseditform-delegates-ttl-validation` — **[P1]** DnsEditForm (683-757) delegates TTL validation to parent; move inline with errors.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `HostingDomainDetailPage.page-is-split-into` — **[P2]** Page is ~760 lines; split into DomainSettings / DnsTable / DangerZone subcomponents.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `HostingDomainDetailPage.bulk-import-dns-records` — **[Enh]** Bulk import DNS records from BIND/zonefile paste.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `HostingDomainDetailPage.dnssec-toggle` — **[Enh]** DNSSEC toggle + status.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `HostingDomainDetailPage.domain-whois-privacy` — **[Enh]** Domain WHOIS + privacy toggle.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## HostingOverviewPage

_Open: 1 P1 · 1 P2 · 3 Enh · 5 total_

- [ ] `HostingOverviewPage.request-migration-opens-mailto` — **[P1]** Request migration opens mailto without warning; add tooltip or confirm sheet.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `HostingOverviewPage.grid-wraps-awkwardly-on` — **[P2]** Mobile: 2-col Plan/Monthly grid wraps awkwardly on iPhone SE; collapse below 360px.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `HostingOverviewPage.banner-when-any-domain` — **[Enh]** Renewal-soon banner when any domain expires <=14 days.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `HostingOverviewPage.toggle-on-each` — **[Enh]** One-click auto-renew toggle on each card.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `HostingOverviewPage.filter-by-plan` — **[Enh]** Filter by plan (starter/pro/enterprise).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## HostingRegisterPage

_Open: 3 Enh · 3 total_

- [ ] `HostingRegisterPage.live-price-quote-as` — **[Enh]** Live price quote as user types (TLD-sensitive pricing).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `HostingRegisterPage.add-to-cart-flow` — **[Enh]** Add to cart flow so user can register several domains at once.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `HostingRegisterPage.integrate-real-adapter` — **[Enh]** Integrate real Name.com adapter (lib/namecom.ts).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## InvoiceDetailPage

_Open: 2 P1 · 1 P2 · 3 Enh · 6 total_

- [ ] `InvoiceDetailPage.email-button-shows-success` — **[P1]** Email button shows success toast but no network call — either wire endpoint or hide button.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `InvoiceDetailPage.line-items-table-dereferences` — **[P1]** Line items table (204-211) dereferences inv.lineItems unguarded; guard or assert at type boundary.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `InvoiceDetailPage.test-print-css-on` — **[P2]** Test print CSS on Safari — print: Tailwind often breaks on WebKit.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `InvoiceDetailPage.for-invoice-number` — **[Enh]** Copy-to-clipboard for invoice number + total.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `InvoiceDetailPage.download-as-alternative-for` — **[Enh]** Download as .txt alternative for a11y.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `InvoiceDetailPage.embed-payment-cta-when` — **[Enh]** Embed payment CTA when invoice unpaid.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## InvoicesPage

_Open: 3 Enh · 3 total_

- [ ] `InvoicesPage.bulk-download-as` — **[Enh]** Bulk download as zip.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `InvoicesPage.status-filter-chips-mirror` — **[Enh]** Status filter chips mirror OrdersPage tab treatment.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `InvoicesPage.date-range` — **[Enh]** Date range filter.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## LoginPage

_Open: 2 P1 · 1 P2 · 3 Enh · 6 total_

- [ ] `LoginPage.no-show-password` — **[P1]** No Show password toggle.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `LoginPage.no-remember-me` — **[P1]** No Remember me option.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `LoginPage.shared-accountinputclass-utility-audit` — **[P2]** Shared accountInputClass utility — audit lib/ui.ts for a11y attributes on focus/error states.
  - Wrap `q.isError` branches with `<ErrorState error={q.error} onRetry={() => q.refetch()} />`.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `LoginPage.sso-google-apple` — **[Enh]** SSO / Google / Apple sign-in.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `LoginPage.passwordless` — **[Enh]** Magic-link passwordless option.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `LoginPage.throttle-captcha-after-n` — **[Enh]** Throttle + captcha after N failed attempts.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## NotificationsPage

_Open: 1 P2 · 3 Enh · 4 total_

- [ ] `NotificationsPage.row-buttons-cover-entire` — **[P2]** Row buttons cover entire row; add explicit marker icon for keyboard users.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `NotificationsPage.group-notifications-by-day` — **[Enh]** Group notifications by day (Today / Yesterday / Last 7 days).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `NotificationsPage.filter-by-kind` — **[Enh]** Filter by kind (orders/billing/support/system).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `NotificationsPage.push-browser-notifications-from` — **[Enh]** Push / browser notifications opt-in from here.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## OrderDetailPage

_Open: 2 P1 · 1 P2 · 3 Enh · 6 total_

- [ ] `OrderDetailPage.migrate-revision-review-forms` — **[P1]** Migrate revision + review forms to react-hook-form + Zod; kill three useState chains.
  - Migrate to `useForm` + `zodResolver` + `FormField` (see recipe above).
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `OrderDetailPage.clear-textarea-on-send` — **[P1]** Clear textarea on send via optimistic update or reset().
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `OrderDetailPage.show-awaiting-staff-reply` — **[P2]** Show awaiting staff reply indicator when the last message is from the client.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `OrderDetailPage.attachments-on-messages-needs` — **[Enh]** Attachments on messages (images, zip) — needs FileUpload primitive.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `OrderDetailPage.typing-indicator-unread-marker` — **[Enh]** Typing indicator / unread marker from WS if backend exposes.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `OrderDetailPage.quick-action-on-completed` — **[Enh]** Re-order quick action on completed orders.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## OrdersPage

_Open: 1 P2 · 1 Enh · 2 total_

- [ ] `OrdersPage.filter-row-needs-a` — **[P2]** Mobile: filter row overflow-x-auto needs a visible scroll hint chevron.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `OrdersPage.with-once-filter-is` — **[Enh]** Bulk-select with cancel/export once filter is set.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## ProfilePage

_Open: 2 P1 · 2 P2 · 3 Enh · 7 total_

- [ ] `ProfilePage.six-forms-each-with` — **[P1]** Six forms each with own Save — consolidate into single form with section headings + floating Save.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `ProfilePage.at-173-fix-underlying` — **[P1]** eslint-disable react-hooks/exhaustive-deps at 149, 173 — fix underlying missing deps.
  - Remove the `eslint-disable` directive and fix the underlying missing dependency (usually by wrapping the callback in `useCallback`).
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `ProfilePage.labels-use-html-required` — **[P2]** Labels use HTML required on optional fields (phone, telegram).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `ProfilePage.avatar-preview-flex-layout` — **[P2]** Mobile: avatar preview flex layout jumpy between breakpoints.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `ProfilePage.country-from-ip-on` — **[Enh]** Auto-detect country from IP on first visit; let user override.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `ProfilePage.phone-field-with` — **[Enh]** Phone field with country-code dropdown.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `ProfilePage.company-validation-per` — **[Enh]** Company tax-ID validation per country.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## ReferralsPage

_Open: 2 P1 · 1 P2 · 3 Enh · 6 total_

- [ ] `ReferralsPage.referral-link-truncated-in` — **[P1]** Referral link truncated in readonly input (line 66); use wider font or wrap.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `ReferralsPage.copied-badge-times-out` — **[P1]** Copied badge times out at 2s but does not animate back.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `ReferralsPage.has-no-fallback-add` — **[P2]** navigator.clipboard has no fallback — add Copy failed — select the link branch.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `ReferralsPage.share-intents` — **[Enh]** One-tap share intents (WhatsApp/Telegram/X) pre-filled.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `ReferralsPage.qr-code-generator-for` — **[Enh]** QR code generator for referral link.
  - Use a tiny dependency-free QR component (e.g., `qrcode.react`) imported lazily.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `ReferralsPage.status-chip` — **[Enh]** Per-referral status chip (active/pending/churned).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## RegisterPage

_Open: 1 P2 · 3 Enh · 4 total_

- [ ] `RegisterPage.mismatch-fires-only-on` — **[P2]** Confirm-password mismatch fires only on submit; validate on blur.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `RegisterPage.gdpr-tos-checkbox-with` — **[Enh]** GDPR / ToS checkbox with link preview.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `RegisterPage.marketing-checkbox-separated-from` — **[Enh]** Marketing opt-in checkbox separated from ToS.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `RegisterPage.capture-utm-params-from` — **[Enh]** Capture UTM params from URL, persist to member record.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## ResetPasswordPage

_Open: 1 P2 · 1 Enh · 2 total_

- [ ] `ResetPasswordPage.token-sits-in-url` — **[P2]** Token sits in URL query string, visible in browser history; move to POST body or one-time opaque ref.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `ResetPasswordPage.show-login-email-on` — **[Enh]** Show last-known login email (masked) on success panel for trust.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## ServicesPage

_Open: 1 P1 · 2 P2 · 2 Enh · 5 total_

- [ ] `ServicesPage.category-derivation-usememo-recomputes` — **[P1]** Category derivation useMemo recomputes every render; narrow dependency to data?.length or hash.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `ServicesPage.truncates-add-read-more` — **[P2]** Mobile: line-clamp-3 truncates prices/plans; add Read more affordance.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `ServicesPage.distinguish-no-results-for` — **[P2]** Distinguish no results for search vs no services configured empty states.
  - Render `<EmptyState>` with a lucide icon, title, description, and optional `action`.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `ServicesPage.render-plan-tiers-with` — **[Enh]** Render per-service plan tiers with a segmented control once ServicePlan ships.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `ServicesPage.featured-row-pinned-to` — **[Enh]** Featured row pinned to top for flagged services.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## SettingsPage

_Open: 2 P1 · 1 P2 · 3 Enh · 6 total_

- [ ] `SettingsPage.togglerow-implements-switch-from` — **[P1]** ToggleRow (79-130) implements switch from scratch; use role=switch pattern or Toggle primitive.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `SettingsPage.delete-account-lacks` — **[P1]** Danger-zone delete account lacks confirm-with-typed-email step.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `SettingsPage.lists-show-skeletons-but` — **[P2]** Active-sessions + login-history lists show skeletons but no real data path (endpoint stub).
  - Replace the `Loading…` string with one of `Skeleton`, `SkeletonRow`, `SkeletonStat` or `SkeletonCard`.
  - On multi-query pages render **per-card** skeletons, not one global spinner.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `SettingsPage.ship-2fa-recovery-backend` — **[Enh]** Ship 2FA (TOTP + recovery codes) — backend fields already on PortalMember.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `SettingsPage.session` — **[Enh]** Per-device session revoke.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `SettingsPage.button-orders-wallet-history` — **[Enh]** Export-my-data button (profile + orders + wallet history as zip — GDPR).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## SupportPage

_Open: 3 Enh · 3 total_

- [ ] `SupportPage.attachment-upload-on-ticket` — **[Enh]** Attachment upload on ticket creation.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `SupportPage.smart-similar-tickets-suggestion` — **[Enh]** Smart similar tickets suggestion from past conversations.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `SupportPage.category-chips-drive-staff` — **[Enh]** Category chips (Billing/Technical/Account) drive staff routing.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## SupportTicketPage

_Open: 1 P2 · 3 Enh · 4 total_

- [ ] `SupportTicketPage.staff-vs-client-messages` — **[P2]** Staff vs client messages only color-differentiated; add avatar + name chip for screen readers.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `SupportTicketPage.attachments-inside` — **[Enh]** Attachments inside thread.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `SupportTicketPage.reopen-button-on-closed` — **[Enh]** Reopen button on closed tickets.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `SupportTicketPage.staff-typing-indicator-via` — **[Enh]** Staff typing indicator via WS.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## VerifyEmailPage

_Open: 3 P1 · 1 P2 · 2 Enh · 6 total_

- [ ] `VerifyEmailPage.error-messages-generic-discriminate` — **[P1]** Error messages generic (41); discriminate token expired vs invalid vs already verified.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `VerifyEmailPage.attemptedref-lost-on-route` — **[P1]** attemptedRef lost on route re-mount; gate by hash of token+email.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `VerifyEmailPage.resend-button-has-no` — **[P1]** Resend button has no cooldown (160-167); 60s client + server rate limit.
  - Track `nextAvailableAt` in state; render the remaining seconds via `setInterval`, disable the action button until then.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `VerifyEmailPage.otp-input-accepts-any` — **[P2]** OTP input accepts any characters/length; enforce digits-only + auto-submit at 6 chars.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `VerifyEmailPage.to-a-different-email` — **[Enh]** Re-send to a different email flow for typo-ed registration.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `VerifyEmailPage.resume-back-to-original` — **[Enh]** Resume back to original intent (e.g., placing an order) after verification.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## WalletPage

_Open: 1 P2 · 3 Enh · 4 total_

- [ ] `WalletPage.empty-state-when-no` — **[P2]** Empty state when no transactions ever.
  - Render `<EmptyState>` with a lucide icon, title, description, and optional `action`.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `WalletPage.support-multiple-deposit-methods` — **[Enh]** Support multiple deposit methods from system config, not hardcoded.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `WalletPage.running-balance-column-in` — **[Enh]** Running balance column in transactions table.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `WalletPage.download-statement-for-selected` — **[Enh]** Download statement (PDF/CSV) for selected month.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## WebToApkPage

_Open: 1 P1 · 1 P2 · 3 Enh · 5 total_

- [ ] `WebToApkPage.jobtablerow-jobmobilecard-both-call` — **[P1]** JobTableRow + JobMobileCard both call useApkJob() to poll (48, 98); clean up on unmount via AbortController.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `WebToApkPage.download-button-placement-differs` — **[P2]** Download button placement differs between table and mobile — align.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `WebToApkPage.build-log-streaming-truncated` — **[Enh]** Build log streaming (or truncated log preview) on detail panel.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `WebToApkPage.notify-client-when-build` — **[Enh]** Webhook: notify client when build finishes (email + in-app).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `WebToApkPage.apk-versioning-show-previous` — **[Enh]** APK versioning — show previous builds for the same site.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## WebsiteDetailPage

_Open: 1 P1 · 1 P2 · 3 Enh · 5 total_

- [ ] `WebsiteDetailPage.multiple-usestate-fold-into` — **[P1]** Multiple useState (isEditing, editName, editUrl, editType, editPlatform, deleteConfirm) — fold into react-hook-form.
  - Migrate to `useForm` + `zodResolver` + `FormField` (see recipe above).
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `WebsiteDetailPage.metric-tiles-wrap-card` — **[P2]** Metric tiles (275-303) wrap card in link but link text is only numeric value; add aria-label.
  - Add `aria-label={`<verb> ${entity}`}` to every icon-only button (Delete, Edit, Download, Copy, etc.).
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `WebsiteDetailPage.historical-trend-chart-for` — **[Enh]** Historical trend chart for uptime/SEO score.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `WebsiteDetailPage.recheck-now-button-triggers` — **[Enh]** Recheck now button triggers re-scan.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `WebsiteDetailPage.attach-to-multiple-domains` — **[Enh]** Attach to multiple domains (alias list).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## WebsitesPage

_Open: 1 P1 · 1 P2 · 3 Enh · 5 total_

- [ ] `WebsitesPage.form-appears-inline-without` — **[P1]** Add-Website form appears inline without scroll lock or overlay; use useBodyScrollLock + Sheet.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `WebsitesPage.stat-grid-cramped-on` — **[P2]** 2-col stat grid cramped on small phones; collapse to 1-col under 360px.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `WebsitesPage.real-metrics-from-staff` — **[Enh]** Real uptime/SEO metrics from staff assets pipeline instead of stubs.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `WebsitesPage.attach-a-website-to` — **[Enh]** Attach a website to a domain inline.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

- [ ] `WebsitesPage.bulk-action-on-whole` — **[Enh]** Bulk re-check action on whole list.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — Enh)`.

## A11Y

_Open: 4 P1 · 4 total_

- [ ] `A11Y.on-every-button-across` — **[P1]** aria-label on every icon-only button across portal.
  - Add `aria-label={`<verb> ${entity}`}` to every icon-only button (Delete, Edit, Download, Copy, etc.).
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `A11Y.focus-trap-in-every` — **[P1]** Focus trap in every Modal/Sheet (useFocusTrap hook exists).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `A11Y.add-mirror-of-a11y` — **[P1]** Add e2e/client-a11y.spec.ts mirror of admin-panel a11y spec.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `A11Y.on-tab` — **[P1]** role=tab + aria-selected on filter-bar tab clones.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

## CODE

_Open: 2 P1 · 3 P2 · 5 total_

- [ ] `CODE.migrate-remaining-forms-to` — **[P1]** Migrate remaining useState-driven forms to react-hook-form + Zod.
  - Migrate to `useForm` + `zodResolver` + `FormField` (see recipe above).
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `CODE.introduce-formfield-wrapper-input` — **[P1]** Introduce FormField wrapper (label + input + error + help).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `CODE.theme-tokens-map-hardcoded` — **[P2]** Theme tokens (src/theme/tokens.ts) — map hardcoded Tailwind colours to semantic tokens.
  - Create `src/theme/tokens.ts` exporting semantic names (e.g., `tokens.color.success`) and swap hardcoded Tailwind colour utilities for the mapped token helper.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `CODE.extract-duplicated-helpers-into` — **[P2]** Extract duplicated helpers (orderStatusVariant, transactionColor, timeAgo) into lib/format.ts + lib/date.ts.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `CODE.document-model-in` — **[P2]** Document state-management model in docs/client-portal/STATE.md.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

## PERF

_Open: 3 P1 · 2 P2 · 5 total_

- [ ] `PERF.replace-every-fetch-with` — **[P1]** Replace every (1,100) / (1,1000) fetch with real pagination.
  - Wire the shared `<Pagination>` against `data.meta.total` if the backend returns it; otherwise slice the array.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `PERF.use-useinfinitequery-for-notificationspage` — **[P1]** Use useInfiniteQuery for NotificationsPage load-more.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `PERF.set-staletime-per-query` — **[P1]** Set staleTime per query on multi-query pages.
  - Pass `staleTime` to each `useQuery` on multi-query pages so returning to the page doesn't refetch everything at once.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `PERF.heavy-deps` — **[P2]** Lazy-load heavy deps (print CSS, charts, recharts).
  - Replace `<img>` with `<img loading="lazy" decoding="async" />` or `React.lazy()` the route/component.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `PERF.image-on-avatars-and` — **[P2]** Image lazy-loading on avatars and service icons.
  - Replace the `Loading…` string with one of `Skeleton`, `SkeletonRow`, `SkeletonStat` or `SkeletonCard`.
  - On multi-query pages render **per-card** skeletons, not one global spinner.
  - Replace `<img>` with `<img loading="lazy" decoding="async" />` or `React.lazy()` the route/component.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

## SEC

_Open: 2 P1 · 2 P2 · 4 total_

- [ ] `SEC.move-token-out-of` — **[P1]** Move reset-password token out of URL into POST body or one-time reference.
  - Ensure the mutation's `onSuccess` calls `navigate(paths.login, { replace: true })` synchronously — no `setTimeout`.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `SEC.regex-validation-per-payout` — **[P1]** Regex validation per payout method (TRC20/Payoneer/IBAN/BD bank).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `SEC.remove-or-ship-the` — **[P2]** Remove or ship the stub Email invoice button on InvoiceDetail.
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

- [ ] `SEC.60s-resend-cooldown-on` — **[P2]** 60s resend cooldown on VerifyEmail (client + server).
  - Track `nextAvailableAt` in state; render the remaining seconds via `setInterval`, disable the action button until then.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P2)`.

## UX

_Open: **1 P0** · 8 P1 · 9 total_

- [ ] `UX.audit-every-and-replace` — **[P0]** Audit every window.confirm() and replace with ConfirmDialog — OrderDetail, Cart, Wallet, Websites, SupportTicket, Settings delete-account.
  - Replace `window.confirm()` with `<ConfirmDialog variant="danger" …/>` controlled by local `useState`.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P0)`.

- [ ] `UX.add-errorstate-primitive-title` — **[P1]** Add ErrorState primitive (icon + title + description + retry + technical toggle).
  - Wrap `q.isError` branches with `<ErrorState error={q.error} onRetry={() => q.refetch()} />`.
  - Generate a random `idempotencyKey` per submit and include it in the mutation payload.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `UX.wrap-every-usequery-with` — **[P1]** Wrap every useQuery with explicit isError branch that renders ErrorState + refetch.
  - Wrap `q.isError` branches with `<ErrorState error={q.error} onRetry={() => q.refetch()} />`.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `UX.pipe-api-error-envelopes` — **[P1]** Pipe API error envelopes (error.response?.data?.error) into ErrorState message.
  - Wrap `q.isError` branches with `<ErrorState error={q.error} onRetry={() => q.refetch()} />`.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `UX.add-skeleton-primitive-stat` — **[P1]** Add Skeleton primitive (rows, cards, stat tiles).
  - Replace the `Loading…` string with one of `Skeleton`, `SkeletonRow`, `SkeletonStat` or `SkeletonCard`.
  - On multi-query pages render **per-card** skeletons, not one global spinner.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `UX.replace-every-text-with` — **[P1]** Replace every Loading… text with Skeleton of the same footprint.
  - Replace the `Loading…` string with one of `Skeleton`, `SkeletonRow`, `SkeletonStat` or `SkeletonCard`.
  - On multi-query pages render **per-card** skeletons, not one global spinner.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `UX.on-pages-render` — **[P1]** On multi-query pages (DashboardOverview/Hosting/Billing/Settings) render per-card skeletons.
  - Replace the `Loading…` string with one of `Skeleton`, `SkeletonRow`, `SkeletonStat` or `SkeletonCard`.
  - On multi-query pages render **per-card** skeletons, not one global spinner.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `UX.standardise-form-error-display` — **[P1]** Standardise form error display (inline + summary toast on submit failure).
  - Follow the page-level pattern documented in `docs/client-portal/Audit_Report.md` §Progress log for a prior, shipped sprint on the same page.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.

- [ ] `UX.add-pagination-primitive-page` — **[P1]** Add Pagination primitive (prev/next + first/last + page input).
  - Wire the shared `<Pagination>` against `data.meta.total` if the backend returns it; otherwise slice the array.
  - **Accept:** `npm run type-check` in `apps/landing` passes; tracker row flipped to Done with Notes `Shipped <date> (Trae IDE — P1)`.


---

## Acceptance for the whole handoff

- [ ] Every P0 + P1 row in `All Todos` has Status = `Done`.
- [ ] `apps/landing` passes `npm run type-check` and `npm run build` clean.
- [ ] A new `e2e/client-a11y.spec.ts` exists and reports zero serious/critical
      axe violations across every dashboard + portal route.
- [ ] Bundle budget (250 KB gz per dashboard route) holds.
- [ ] `docs/client-portal/Audit_Report.md` has a progress log entry for every
      sprint the agent completes.

## Escalation

- Backend change required → `TODO(api)` in code + row in `docs/client-portal/backlog-backend.md`. Do **not** stub backend shapes.
- Audit recommendation conflicts with current product behaviour → leave behaviour, log the conflict in `Audit_Report.md`.
- Pre-existing type errors unrelated to the migration → do not fix globally; just don't add new ones.

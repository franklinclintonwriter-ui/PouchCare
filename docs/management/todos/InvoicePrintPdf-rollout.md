# Management invoices — print, PDF, and parity checklist

Track anything we ship later or verify in QA so nothing is dropped.

## Shipped in this rollout

- [x] **Invoice detail — browser print** — Official PC-INV layout is the **primary on-screen document** (logo + masthead + ribbon + tables) inside a raised card; management cards below are `print:hidden`.
- [x] **Invoice detail — Export PDF** — `downloadInvoicePdf()` is **async**, embeds **Pouchcare logo** (PNG), masthead, ribbon, striped line table, bordered total, payment block with **primary left stripe**, footer logo + mission. Amounts in **USD**. Copy: `constants/invoiceOfficialBranding.ts`.
- [x] **Invoice list** — Masthead strip with logo + company line for visual consistency with official invoices.
- [x] **API mapping** — `finance.ts` maps `service`, `notes`, `projectReference`, `paidDate`, `amountBdt` from Prisma; builds a **line item** row from `service` + `amountUsd` for UI table + PDF until real lines exist.
- [x] **Modal print hygiene** — `Modal` accepts `overlayClassName` (invoice edit uses `no-print`); `ConfirmDialog` passes `no-print` on its overlay so dialogs do not appear in print preview.

## Follow-ups (product / backend)

- [ ] **Line items** — DB + API: store multiple `InvoiceLine` rows; management UI to edit lines; PDF/print iterate real lines + tax per line.
- [ ] **`paidAmount` in schema** — Today Prisma `Invoice` has no `paidAmount`; UI infers from status. Add field + migrations when partial payments are first-class.
- [ ] **Invoice list print** — Optional “Print current list” (filtered page or all pages) with `PrintBrandHeader` + table; decide export CSV vs PDF for bulk.
- [ ] **Email / portal link** — “Send to client” using `invoiceUrl` or portal invoice deep link; Resend template.
- [ ] **BDT column in UI** — Show `amountBdt` when present; PDF optional dual-currency footer.
- [ ] **Admin vs finance route** — `/admin/billing/invoices` and `/finance/invoices` share one component; confirm RBAC if billing gets a narrower permission later.
- [ ] **E2E** — Playwright: open invoice detail → Export PDF file exists; print dialog not assertable — smoke URL + header actions only.

## Engineering hygiene

- [ ] **`npm install`** — Root install may need `--legacy-peer-deps` until peer conflicts are resolved (document in README if still true).
- [ ] **`npm run dev:landing`** — Script filter fixed to `pouchcare.com`; verify Turbo filters in CI.

## Verification (manual)

1. Management → Finance → Invoices → open any invoice.
2. **Export PDF** — File downloads; open PDF: header, meta table, line table, totals, footer timestamp.
3. **Print** — Preview shows brand header + invoice body; sidebar chrome hidden (existing `AppLayout` / `index.css` print rules).
4. Create invoice with **Service** and **Notes** (after API exposes notes on create from UI if added later) — PDF includes text fields from API today when present on record.

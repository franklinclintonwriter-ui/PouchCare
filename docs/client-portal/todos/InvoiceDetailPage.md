# InvoiceDetailPage.tsx — TODO

- **Route:** `/dashboard/invoices/:id`
- **Approx lines:** 256
- **Source:** `apps/landing/src/pages/dashboard/InvoiceDetailPage.tsx`

**Purpose.** Printable invoice view with `print:` Tailwind variants, print/download/email buttons, company info, line items, totals.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Email button (line 101) shows `toast.success("Invoice emailed to …")` but **no network call is made**. Either wire the endpoint or hide the button until it's real.
- [ ] Line items table (204-211) dereferences `inv.lineItems` unguarded — guard or assert at the type boundary.

## P2 — Nice-to-have

- [ ] Test print CSS on Safari — `print:` Tailwind often breaks on WebKit.

## Enhancements

- [ ] Copy-to-clipboard button for the invoice number + total.
- [ ] Download as `.txt` alternative for accessibility.
- [ ] Embed a payment CTA ("Pay via wallet / card") when the invoice is unpaid.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

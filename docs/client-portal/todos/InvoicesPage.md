# InvoicesPage.tsx — TODO

- **Route:** `/dashboard/invoices`
- **Approx lines:** 275
- **Source:** `apps/landing/src/pages/dashboard/InvoicesPage.tsx`

**Purpose.** Invoice list with status filter + number search. Responsive cards/table. Download-PDF button per row.

## P0 — Blockers

_None._

## P1 — Should fix

- [ ] Double-fetch: `usePortalInvoices(page, 50)` plus `usePortalInvoices(1, 1000)` for totals (line 68). Use the paginated response's `meta.total` or a dedicated lightweight totals endpoint.
- [ ] Per-row download spinner ties to a global `download.isPending`; two concurrent clicks cause the first row spinner to vanish. Track a per-invoice `Set<string>` of pending IDs.

## P2 — Nice-to-have

- [ ] `InvoiceCard` is defined inline in the page file (line 227). Extract to `components/dashboard/InvoiceCard.tsx`.

## Enhancements

- [ ] Bulk download as a zip.
- [ ] Status filter chips mirror OrdersPage tab treatment for consistency.
- [ ] Date range filter.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

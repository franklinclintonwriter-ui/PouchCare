# HostingDomainDetailPage.tsx — TODO

- **Route:** `/dashboard/hosting/:domainId`
- **Approx lines:** 758
- **Source:** `apps/landing/src/pages/dashboard/HostingDomainDetailPage.tsx`

**Purpose.** Domain hero + usage meters, settings (auto-renew, notes, nameservers), DNS editor (add/edit/delete), certificate panel, danger zone. Largest page in the portal.

## P0 — Blockers

- [ ] DNS edit UX does not make edit-mode obvious (lines 447-530). Add a coloured border, a "Editing record" strip, and disable other row actions while one row is in edit mode.

## P1 — Should fix

- [ ] `DnsEditForm` (lines 683-757) delegates TTL validation to the parent — move validation inside the form and surface inline errors.
- [ ] Save buttons throughout the page do not disable during `isPending` — double-submit risk.
- [ ] Nameservers `<textarea>` placeholder literally contains the HTML entity `&#10;` (lines 601-607). Render newlines properly or drop the placeholder.

## P2 — Nice-to-have

- [ ] Page is ~760 lines — split into `DomainSettings`, `DnsTable`, `DangerZone` subcomponents for readability.

## Enhancements

- [ ] Bulk import DNS records from BIND/zonefile paste.
- [ ] DNSSEC toggle (+ status).
- [ ] Show domain-level WHOIS (privacy enabled?) and let the user toggle it.

## Linked cross-cutting items

- [`_Cross-Cutting.md`](./_Cross-Cutting.md) — shared error UI, loading skeletons, pagination, forms.
- [`_UI-Kit.md`](./_UI-Kit.md) — missing primitives this page depends on.

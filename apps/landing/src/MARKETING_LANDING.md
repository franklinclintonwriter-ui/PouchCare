# Marketing site (landing app, `/` routes)

Read before changing public pages. **Master index:** [`docs/UI_MASTER_INDEX.md`](../docs/UI_MASTER_INDEX.md).

## Shell

- `components/layout/MarketingLayout.tsx` — Navbar, `main` + safe-area bottom padding, Footer.
- `components/layout/Navbar.tsx` — desktop pill nav; mobile drawer; portal Login/Register links.
- `components/layout/Footer.tsx` — link grid stacks on small screens; contact strip uses large tap targets.

## Conventions

- Prefer `text-base` on marketing form inputs (Contact, etc.) to avoid iOS zoom on focus.
- Touch-friendly controls: `min-h-[44px]`–`48px` for primary icon buttons and form fields where possible.

## Auth (separate layout)

Client sign-in/up lives under `/my-accounts/*` — see `pages/portal/ACCOUNT_PORTAL.md`.

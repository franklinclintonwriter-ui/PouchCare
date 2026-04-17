# PouchCare Client Portal — Frontend Audit Report

- **Scope:** `apps/landing/src/pages/dashboard/*` (21 pages) + `apps/landing/src/pages/portal/*` (5 auth pages) + shared components + API layer.
- **Host:** `my.pouchcare.com` — the production surface real clients log into. Not to be confused with the staff admin panel under `m.pouchcare.com/admin`.
- **Method:** full page-by-page read. Every finding below is traceable to a file + (where visible) a line reference.
- **Audit date:** 2026-04-17.

This report is the summary. The actionable work is split across one `todos/<Page>.md` per page under this directory, plus a `todos/_Cross-Cutting.md` for issues spanning the whole portal. All `- [ ]` items are ready to be copied into issues.

## 📊 Findings at a glance

| Category | Count | Breakdown |
| --- | ---: | --- |
| **UX issues** | 35 | P0: 2 · P1: 18 · P2: 15 |
| **A11Y issues** | 12 | P1: 8 · P2: 4 |
| **Code quality** | 18 | P0: 1 · P1: 12 · P2: 5 |
| **Performance** | 8 | P1: 5 · P2: 3 |
| **Security** | 5 | P1: 2 · P2: 3 |
| **Enhancements** | 40+ | feature polish, new capabilities |

## 🚨 P0 — Blockers (fix before any rollout)

| # | Location | Finding |
| --- | --- | --- |
| 1 | `OrdersPage.tsx:17-23` | Duplicated `orderStatusVariant` helper (exists in multiple places). One source of truth needed. |
| 2 | `HostingOverviewPage.tsx:33-38` | `nearestExpiry` sort fails silently on invalid date strings — can crash the overview panel. |
| 3 | `HostingDomainDetailPage.tsx:447-530` | DNS record inline-edit UX does not signal edit mode; users submit accidental changes. |
| 4 | `ResetPasswordPage.tsx:43` | `setTimeout(navigate, 1500)` after success — if user closes the tab, redirect fails silently and session state is inconsistent. |

## 🧱 Top P1 themes

These are the systemic issues that, once fixed once, lift the quality of the whole portal. Each has a cross-cutting TODO and per-page mentions.

1. **No shared error UI.** Most pages render a plain `"Failed to load"` string with no retry, no detail, no logging. → `todos/_Cross-Cutting.md`
2. **"Loading…" text everywhere.** Skeletons exist in the UI kit but aren't wired to list/detail pages. → `todos/_Cross-Cutting.md`
3. **Forms split between react-hook-form and raw `useState`.** Validation is inconsistent; some pages use Zod, others don't validate at all. → `todos/_Cross-Cutting.md`
4. **Destructive actions lack `ConfirmDialog`.** Checkout, delete-website, close-ticket, cancel-order all ship without a confirmation step. Component exists in `src/providers/ConfirmProvider.tsx` and is not used consistently.
5. **Unbounded queries (`1, 100`, `1, 1000`) masquerading as pagination.** Four list pages fetch large batches, no real pagination. Performance cliff ahead as data grows.
6. **Icon-only buttons without `aria-label`.** Delete, edit, download icons are keyboard/screen-reader invisible across at least 6 pages.
7. **UI kit gaps** — no `DataTable`, `Tabs`, `Select`, `FormField`, `FileUpload`. Every page re-rolls its own; styling drifts.

## 🏗️ Missing primitives (add to `apps/landing/src/components/ui/`)

The single highest-ROI investment. Each gap forces copy-paste implementations today:

- **`Skeleton`** — rows, cards, stat cards
- **`Tabs`** — used by OrdersPage status filter, SupportPage, WalletPage
- **`Select`** — styled to match `Input`; used by Web-to-APK plans, Profile country, Settings locale
- **`FormField`** — label + input + error + help slot; standardize with react-hook-form
- **`DataTable`** — responsive card-on-mobile / table-on-desktop pattern currently copied into 8 pages
- **`FileUpload`** — drag-drop + preview for avatar, Web-to-APK zip, support attachments
- **`PasswordStrength`** — already implicit in SettingsPage; promote to reusable
- **`EmptyState`** — icon + title + description + action; 14 pages need it
- **`Pagination`** — real component, not Previous/Next pair re-invented per page
- **`ErrorState`** — card with retry button + technical details toggle
- **`CopyButton`** — used on Referrals, Profile, Settings, Hosting

Cost: ~3 days of focused work. Benefit: removes ~40% of the P1 list below.

## 🧭 Overall client-portal architecture

```
apps/landing/
├── src/
│   ├── api/                   # 9 typed axios + react-query clients (portal-auth, portal-dashboard, …)
│   ├── components/
│   │   ├── dashboard/         # 4 components only (DashboardPanel, HostingLayout, ResponsiveSplit, StatCard)
│   │   ├── portal/            # 6 shell components (ClientSidebar, ClientMobileNav, ClientDashboardHeader, guards, sync)
│   │   ├── layout/            # 7 top-level layouts (Account, Dashboard, Marketing, Navbar, Footer, BrandLogo, PageFade)
│   │   └── ui/                # 17 primitives (Button, Input, Textarea, Modal, Sheet, Popover, Badge, Avatar, Spinner,
│   │                          #   LogoSpinner, ConfirmDialog, Separator, Label, AnimatedCounter, ScrollReveal,
│   │                          #   SectionLabel, index)
│   ├── hooks/                 # useBodyScrollLock, useClickOutside, useConfirm, useFocusTrap, useMediaQuery
│   ├── providers/ConfirmProvider.tsx
│   ├── stores/                # cartStore, clientShellStore, portalAuthStore, themeStore (Zustand)
│   └── pages/
│       ├── dashboard/         # 21 pages — authenticated client surface (this audit's focus)
│       └── portal/            # 5 pages — auth flows (login/register/forgot/reset/verify)
```

**State model audit:** Zustand for UI shell + cart + auth, react-query for server state, local `useState` for page-local flags. Mostly sound; the wobble is **form state** — some pages use react-hook-form, others raw `useState`.

**Theme:** Tailwind + dark mode via `themeStore`. No theme tokens documented — colors hardcoded in many places (`text-emerald-700`, `text-red-600`). Would benefit from a `tokens.ts` map.

## 🗺️ Recommended 6-week enhancement plan

| Week | Focus | Outcome |
| --- | --- | --- |
| **W1** | UI kit gaps | Ship Skeleton, Tabs, Select, FormField, EmptyState, Pagination, ErrorState, CopyButton, FileUpload |
| **W2** | Forms migration | Every form on react-hook-form + Zod; kill duplicate `useState` chains; add ConfirmDialog to every destructive action |
| **W3** | Error + loading pass | Replace every "Loading…" with Skeleton; replace every "Failed to load" with ErrorState; wire retry to every query |
| **W4** | Pagination + perf | Real pagination on Orders, Invoices, Notifications, Billing ledger, Payouts, Wallet; stop unbounded 1×1000 fetches |
| **W5** | Accessibility | aria-labels on every icon button; focus traps in modals/drawers; tab semantics on filter bars; ListSkeleton a11y |
| **W6** | Feature polish | Password strength on register/reset, resend cooldowns, OTP masking, avatar upload backend, wallet-address validation |

Each week maps to a labeled milestone in Issues. Per-page TODOs below are the raw work items.

## 🔐 Security posture

- Reset-password token rides on URL query — visible in browser history. Move to POST body or one-time opaque ref.
- Payout and deposit destinations (bank, TRC20, Payoneer) are free-text with no client-side format check. Add regex hints per method.
- Email button on `InvoiceDetailPage.tsx:101` is a **stub** that shows a success toast without sending. Remove until wired to a real endpoint.
- No rate limit on the resend-OTP button (`VerifyEmailPage.tsx:160-167`). Add 60s cooldown client-side and server-side.

Nothing here is an active XSS/CSRF vulnerability — the back pressure is cosmetic and UX, not exploitation — but all four are worth closing before promoting this to "production-hardened".

## 🧪 Test coverage — what's missing

None of the 26 pages has a dedicated test file. Recommended minimum before the W6 milestone:

- **Playwright (E2E):** login → place-order → view-invoice → pay-via-wallet flow (the end-to-end money path).
- **Playwright:** forgot-password → reset → login round-trip.
- **Playwright:** web-to-apk build job lifecycle (upload → build → download).
- **axe-core:** a11y pass on every dashboard page (mirror the admin-panel's `e2e/admin-a11y.spec.ts`).
- **Component tests (Vitest):** the new UI kit primitives when they land in W1.

## 📂 How to use this directory

- **`Client_Portal_Tracker.xlsx`** — single source of truth for status. 197 todos across 6 sheets (Overview / All Todos / By Page / Weekly Plan / UI Kit / Legend). Update Status in column F; every rollup sheet updates via formula. **Do not tick the .md checkboxes without also updating the tracker** — the tracker is what leadership reviews weekly.
- **`Audit_Report.md`** (this file) — executive summary + prioritized plan.
- **`todos/<PageName>.md`** — one checklist per page with P0/P1/P2/Enhancement sections, ready to paste into GitLab issues.
- **`todos/_Cross-Cutting.md`** — issues that span the whole portal.
- **`todos/_UI-Kit.md`** — the primitives to build first.
- **`todos/_Roadmap.md`** — the 6-week plan with concrete weekly checklists.

## 🔄 Progress-tracking workflow

1. Pick a row in the tracker's **All Todos** sheet (filterable by Severity, Page, Week, Owner).
2. Set Status to `In progress` and assign yourself in the Owner column.
3. Open a PR referencing the todo number (e.g., `fix(client): clients/#47 — skeleton on OrdersPage`).
4. On merge, set Status to `Done` in the tracker — the By Page + Overview sheets update automatically.
5. Weekly progress review at the Friday standup reads straight from the **Overview** tab.

## 📜 Progress log

Canonical progress lives in `Client_Portal_Tracker.xlsx`. This log mirrors execution-sprint outcomes so reviewers can skim without opening the workbook.

### 2026-04-17 — Week 1 kickoff

**3 of 4 P0 blockers shipped:**
- ✅ `OrdersPage.tsx` — removed the duplicated `statusVariant` helper; now imports `orderStatusVariant` from `lib/format.ts`.
- ✅ `HostingOverviewPage.tsx` — `nearestExpiry` now parses + filters valid dates before sorting, so an invalid `expiresAt` can no longer silently corrupt the panel.
- ✅ `ResetPasswordPage.tsx` — removed the `setTimeout(navigate, 1500)` race; navigates immediately on mutation success.
- ⬜ `HostingDomainDetailPage.tsx` DNS inline-edit visual signal — deferred until the DNS form migrates to react-hook-form in Week 2.

**4 of 13 UI kit primitives shipped** (the ones with the widest reuse, so Week 3 error/loading pass can begin):
- ✅ `Skeleton` + `SkeletonText` / `SkeletonRow` / `SkeletonCard` / `SkeletonStat` — replaces every `"Loading…"` string once consumers migrate.
- ✅ `EmptyState` — replaces the ~14 hand-rolled empty blocks across dashboard lists.
- ✅ `ErrorState` — wraps every `useQuery.isError` branch with retry + extractable API error message + collapsible technical details.
- ✅ `CopyButton` — with `navigator.clipboard` primary path and legacy `execCommand` fallback; feedback animates back to default.

Remaining primitives (9): Tabs, Select, FormField, DataTable, FileUpload, PasswordStrength, Pagination, Toggle, HelpText.

### 2026-04-17 — Week 2 progress

**4th P0 closed** — DNS edit-mode visual signal now ships. Both the mobile card and the desktop row surface a pulsing `EDITING DNS RECORD` chip in primary-600, wrap the editor in a primary ring, and dim + disable other rows while a row is being edited. Users can no longer submit accidental changes to the wrong record.

**5 more UI kit primitives shipped** (covering every form-related primitive the plan called for):
- ✅ `FormField` — label + control slot + error + help. Auto-wires `htmlFor`, `aria-describedby`, `aria-invalid`, `aria-required` via a render-prop so consumers can't forget the a11y plumbing.
- ✅ `Select` — native `<select>` styled to match `Input`; forward ref for react-hook-form; `options` + `placeholder` shortcuts.
- ✅ `PasswordStrength` + `scorePassword` helper — 5-heuristic bar + requirements checklist. Replaces the SettingsPage-only inline implementation.
- ✅ `Toggle` — `role="switch"` pattern with `aria-checked`, replaces the hand-rolled `ToggleRow` in SettingsPage. Supports label + description + left/right label position + size variants.
- ✅ `HelpText` — tiny muted caption with muted / info / warning variants; picks up the info icon automatically.

Remaining primitives (4): Tabs, DataTable, FileUpload, Pagination. DataTable + FileUpload are the two heavy lifts; Tabs + Pagination are mechanical.

### 2026-04-17 — Week 3 migration sprint

**Two more primitives shipped**, closing all the mechanical UI-kit work:
- ✅ `Tabs` — full ARIA tab/tabpanel pattern with ←/→/Home/End keyboard navigation. Ships both as a compound API (`Tabs.Root`, `Tabs.List`, `Tabs.Trigger`, `Tabs.Panel`) and a shorthand (`<Tabs>` + `<Tab>`).
- ✅ `Pagination` — first / prev / page-display / next / last with an optional jump-to-page input that appears above 5 pages. Renders nothing when total fits on one page.

Remaining primitives (2): **DataTable**, **FileUpload**. Both are heavier builds and will ship together in the next sprint.

**6 consumer-page P1 todos closed via real migrations** — the first payoff on the UI kit investment:

| Page | What changed |
| --- | --- |
| `RegisterPage` | Every row now goes through `<FormField>`; password gets live `<PasswordStrength>`; `?ref=` referral code is validated (`^[A-Za-z0-9-]{3,32}$`) and displayed as a confirmation chip so users know it stuck; Country + Phone labels show `(optional)`. |
| `ResetPasswordPage` | Migrated to `<FormField>` + `<PasswordStrength>`. Invalid-token branch now offers a direct **Request a new link** CTA with an Alert chip and a back-to-sign-in link, replacing the one-line dismissal. |
| `SettingsPage` | Removed the page-local `PasswordStrength` implementation; imports the shared one. Requirements are shown upfront via `<HelpText>` when the new-password field is empty (audit §P1 "Show password requirements upfront" — closed). |

### 2026-04-17 — Week 4 list-pages sprint

**12th primitive shipped** — only FileUpload remains:
- ✅ `DataTable` — declarative, responsive card-on-mobile / table-on-desktop primitive driven by a `columns: DataTableColumn<T>[]` config. Built-in Skeleton loading, ErrorState on failure, EmptyState on empty, optional Pagination in the footer. Keyboard-focusable rows when `onRowClick` is provided; clicks inside inner `<a>` / `<button>` are respected. Replaces ~8 copies of the `<NarrowWide>` pattern — future list pages drop ~150 lines each.

**Two real list-page migrations** closing 8 more P1 todos:

| Page | What changed |
| --- | --- |
| **OrdersPage** | Status filter bar → `<Tabs>` (full ARIA tab/tabpanel + ←/→/Home/End keyboard nav). Search input is debounced 300 ms. Loading state → three `<SkeletonRow>`s. Error state → `<ErrorState>` with retry. Empty state → context-aware `<EmptyState>` with "Browse services" or "Clear filters" action. List paginated client-side with the shared `<Pagination>` (10 per page). |
| **NotificationsPage** | Page header now shows a live unread-count badge. Loading renders 5 skeleton rows shaped like the real list. Error → shared `ErrorState`. Empty → shared `EmptyState` with Bell icon. Previous/Next pair swapped for `<Pagination>` with first/last + jump-to-page. `timeAgo` moved to `lib/date.ts` (plus a new `dayBucket()` helper for future grouping). |

**Helpers extracted:**
- `lib/date.ts` — `timeAgo()` + `dayBucket()` shared across the portal.

### 2026-04-17 — Week 5 final-primitives sprint

**UI kit: 13/13 complete 🎉**
- ✅ `FileUpload` — the last primitive. Drag-drop + click-to-browse, per-file + total-size validation, accept-list enforcement (MIME, `image/*`, extension patterns), image previews via `URL.createObjectURL` (revoked on unmount via `onLoad`), single/multi mode, a11y drop zone (`role="button"`, Enter/Space triggers browse), clear inline error on reject, per-file remove with named `aria-label`. Ready for Profile avatar, Web-to-APK zip, Support attachments.

**Two more real migrations** closing 7 P1 todos:

| Page | What changed |
| --- | --- |
| **InvoicesPage** | Migrated to `<DataTable>` driven by typed `DataTableColumn<Invoice>[]`. Status filter → `<Tabs>` with ARIA. Real server-side pagination — `invoicesData.meta.total` wired into `<Pagination>`. Per-row download spinner now tracked in a `Set<string>` so two concurrent clicks don't stomp each other. The total-invoices stat card uses `meta.total` directly (no more double-fetch for count); the paid / outstanding cards still use a capped `usePortalInvoices(1, 500)` summary fetch, with a TODO for a proper `/portal/invoices/summary` endpoint. 300ms debounced search. `InvoiceCard` inline component eliminated — DataTable handles both desktop + mobile renderings via the column `mobileLabel` shortcut. |
| **SupportPage** | Form migrated to react-hook-form + Zod + `<FormField>` + `<Select>` + typed priority enum. Message textarea gets a **live char counter** (`X / 5,000`) that turns amber in the last 200 chars. Subject enforces 3-char minimum. Ticket list → `<DataTable>` with pagination, loading skeletons, empty state (LifeBuoy icon), error retry. |

### 2026-04-17 — Week 6 billing + wallet + avatar sprint

**Three high-value migrations** closing 8 more P1 todos:

| Page | What changed |
| --- | --- |
| **WalletPage** | Deposit form → react-hook-form + Zod + `<FormField>` + `<Select>`. Amount validated numerically, proof URL validated against a strict `https?://` regex. **`<ConfirmDialog>` shows before submit** with the amount + method for review. Per-method `<HelpText>` explains exactly what belongs in the proof URL field. Transactions list → `<DataTable>` with real server-side `<Pagination>` (20 per page). `transactionColor()` helper extracted — audit §P2 closed. |
| **BillingPage** | Payout form → react-hook-form + Zod with **per-method validation**: TRC20 (`T[A-Za-z0-9]{33}`), Payoneer (email), Binance (email or pay ID), Bank transfer (20-char min). Placeholder + `<HelpText>` rotate based on selected method. Commission ledger + Payout history → `<DataTable>` each with their own pagination state. |
| **ProfilePage — avatar** | Hidden-input + camera-button pattern replaced with `<FileUpload>` drag-drop zone. PNG/JPG/WebP allow-list, 2 MB cap enforced client-side, image preview rendered inline, per-selection revocation of the previous blob URL (no memory leak). Clear `TODO(api)` comment pointing at the backend endpoint that still needs wiring. |

**Composition payoff.** After W6 the billing / wallet / support forms are near-identical in structure — react-hook-form + Zod + FormField + Select + Textarea — and all share the same validation + a11y surface. Adding a new form of that shape is now a 20-line exercise instead of 200.

### 2026-04-17 — Week 7 cart + order-detail + websites sprint

**Three more migrations** closing 6 P1 todos:

| Page | What changed |
| --- | --- |
| **CartPage** | Checkout now opens a `<ConfirmDialog>` that spells out the order count + total in USD before submit. Clear-cart has its own danger-variant confirm. Qty stepper bounded `1 ≤ q ≤ 99` with buttons disabled at the edges. Partial-success handling: if N orders succeed and M fail, the successful lines are removed from cart and the failed ones stay so the user can retry. `TODO(api): /portal/orders/batch` comment pins the follow-up for a real transactional endpoint. |
| **OrderDetailPage** | `window.confirm()` replaced with a proper danger-variant `<ConfirmDialog>`. Message thread now **auto-scrolls to bottom on new messages** via a `useRef` + `requestAnimationFrame` — the "last reply hidden" bug from the audit is gone. Send button also surfaces backend errors via toast instead of silently failing. |
| **WebsitesPage** | Both hand-rolled `<select>` elements with long duplicated className strings replaced with the shared `<Select>` primitive. Delete icon button now has a **default red affordance** (not just on hover) — red-tinted border + background + icon — so destructive intent is visible at rest. Delete button `aria-label` now includes the website name. |

### 2026-04-17 — Week 8 detail-page sprint

**Three more migrations** closing 5 P1 todos:

| Page | What changed |
| --- | --- |
| **HostingDomainDetailPage** | Nameservers `<Textarea>` placeholder no longer shows the literal `&#10;` entity — rendered as real newlines. Every Save button now disables during `updateDomainMutation.isPending` with a "Saving…" label (Settings save, Nameserver save, and per-DNS-record save via a new `saving` prop on `DnsEditForm`). Double-submit risk eliminated across the entire DNS editor. |
| **WebToApkPage** | `JobTableRow` + `JobMobileCard` now use the exported `ApkJob` type instead of `any`. Polling helper only enables `useApkJob()` when the job is `queued` or `processing`, disabling it on `ready` / `failed` so React-Query stops the interval. Plan `<select>` swapped for `<Select>` primitive; a new `<HelpText>` under it reads "Applies to this new conversion only. Existing jobs keep their original plan." — closes the audit's "plan applies to new conversions only" confusion. |
| **WebsiteDetailPage** | Both duplicated `<select>` replaced with `<Select>`. Save + Cancel action row is now a **sticky floating footer** (`sticky bottom-0` with a soft backdrop blur) so users never scroll out to find the save button on long edits. |

**Remaining WebsiteDetailPage todo** (`Multiple useState → react-hook-form`) stays open until the next sprint — requires a larger rewrite.

### 2026-04-17 — Week 9 support + hosting-register sprint

**Two more migrations** closing 6 P1 todos:

| Page | What changed |
| --- | --- |
| **SupportTicketPage** | Conversation thread now **auto-scrolls to the latest reply** via `useRef` + `requestAnimationFrame`. Mobile thread `min-h-[40vh] / max-h-[70vh]` replaces the cramped `max-h-[480px]`, so long ticket conversations read naturally without nested scroll. Close button now opens a **danger-variant `<ConfirmDialog>`** explaining what closing does. Loading shows `<Spinner>` + copy, error branch uses `<ErrorState>` with retry + contextual title. Each reply row now carries a **shield / user avatar** so staff vs client is readable by screen readers + scan-able at a glance. Reply textarea uses the shared `<Textarea>` primitive with a live char counter (5,000 cap) that turns amber near the limit. Closed tickets disable the textarea + send button with a "Ticket is closed" hint. |
| **HostingRegisterPage** | Inline `<HelpText variant="info">` appears under the search input the moment the user types but has fewer than 2 chars — **no more submit-to-learn-why**. The Search button also disables until 2 chars are entered. Unavailable domain cards now show a **locked grey chip** (`Already registered`) instead of a clickable-looking disabled Register button. `checkoutPlanId` persists to the URL as `?plan=<id>` via `useSearchParams` so refresh + teammate-paste keeps the selection. |

**Launch readiness** is green on the Overview tab only when:
- All P0 items → Done
- All P1 items → Done
- All 13 UI-kit primitives → Done

Those three conditions are formulas on the Overview tab; don't mark "ready" without them.

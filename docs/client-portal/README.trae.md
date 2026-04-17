# Trae IDE — PouchCare Client Portal Handoff

This folder contains everything a Trae IDE agent needs to finish the client-portal
migration that's currently **46% of P1 complete**.

## What to open

| File | Who reads it | What it contains |
| --- | --- | --- |
| [`Completion_Brief.docx`](Completion_Brief.docx) | Humans (review) | Executive handoff doc — progress, remaining work by page, acceptance, escalation rules |
| [`trae_workflow.md`](trae_workflow.md) | The agent | Executable task list: 147 tasks across 31 pages/areas, each with a recipe + accept check |
| [`Client_Portal_Tracker.xlsx`](Client_Portal_Tracker.xlsx) | Both | **Source of truth for status.** Agent flips rows to Done after each task; summary sheets recompute via formulas |
| [`Audit_Report.md`](Audit_Report.md) | Both | Running progress log with shipped patterns the agent should crib from |
| [`todos/`](todos/) | Humans | Per-page markdown checklists (GitLab-issue friendly) — mirror the xlsx |

## Agent bring-up (5 minutes)

1. Clone `github.com/franklinclintonwriter-ui/PouchCare`, branch `develop`.
2. `npm ci` at the repo root.
3. Open the repo in Trae IDE.
4. In Trae's Agent panel, paste the **Agent preamble** section from `trae_workflow.md` (top of the file) as the system prompt.
5. Hand the agent one task group at a time (e.g., `## DashboardOverviewPage`) and tell it to complete every `- [ ]` in that group.
6. After each group: review the git diff, approve the PR, merge.

## Scope rules (baked into the workflow)

- Agent touches **only** `apps/landing/src/` + `docs/client-portal/`. Backend changes go into a `TODO(api)` + `backlog-backend.md` entry.
- Agent uses the **complete UI kit** (13 primitives, barrel-exported from `@/components/ui`) — no new primitives.
- Every form uses `react-hook-form` + `zod` + `FormField`.
- Every destructive action uses `ConfirmDialog` — no `window.confirm()`.
- Lists use `DataTable` + `Pagination`; loading = `Skeleton`; errors = `ErrorState`; empties = `EmptyState`.
- After each task: agent runs `npm run type-check` in `apps/landing` and flips the matching row in the tracker to `Done`.

## Shipped patterns to crib from

These sprints already landed — the agent should skim the resulting files to match style:

| Sprint | Pages migrated | Good reference files |
| --- | --- | --- |
| W4 | OrdersPage, NotificationsPage | `apps/landing/src/pages/dashboard/OrdersPage.tsx` |
| W5 | InvoicesPage, SupportPage | `apps/landing/src/pages/dashboard/InvoicesPage.tsx` |
| W6 | WalletPage, BillingPage, Profile avatar | `apps/landing/src/pages/dashboard/WalletPage.tsx` |
| W7 | CartPage, OrderDetailPage, WebsitesPage | `apps/landing/src/pages/dashboard/CartPage.tsx` |
| W8 | HostingDomainDetail, WebToApk, WebsiteDetail | `apps/landing/src/pages/dashboard/WebToApkPage.tsx` |
| W9 | SupportTicketPage, HostingRegisterPage | `apps/landing/src/pages/dashboard/SupportTicketPage.tsx` |

## Definition of done (handoff gate)

- [ ] Every **P0** row in the tracker → `Done`
- [ ] Every **P1** row in the tracker → `Done`
- [ ] `npm run type-check` clean in `apps/landing`
- [ ] `npm run build` clean in `apps/landing`
- [ ] `e2e/client-a11y.spec.ts` added and reports 0 serious/critical axe violations
- [ ] Bundle budget (≤250 KB gz per dashboard route) holds
- [ ] `Audit_Report.md` has a progress-log entry for every sprint the agent ran

Hand the merged repo back once all six boxes above are ticked.

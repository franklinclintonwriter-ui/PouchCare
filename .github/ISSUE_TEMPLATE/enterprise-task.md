---
name: Enterprise task (Copilot brief)
about: Fully-specified, independent chunk to hand to the GitHub Copilot coding agent
title: "[PR-x.y] <concise title>"
labels: ["enterprise", "copilot"]
---

<!-- A Copilot brief must be self-contained. Fill EVERY section. -->

## Roadmap reference
- Roadmap ID: `PR-{phase}.{n}` (see `docs/ROADMAP.md`)
- **Base branch:** `<the exact merged commit/branch to branch FROM>`
- **Target branch:** `<branch to open the PR INTO>`

## Goal
<!-- One paragraph: what to build and the acceptance outcome. -->

## Scope fence (hard limits)
- Allowed files/dirs: `<list>`
- **Do NOT touch:** `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/**`,
  auth (`apps/api/src/routes/auth`, `apps/api/src/middleware/auth.ts`), env (`apps/api/src/config/env.ts`).

## Pattern to follow
<!-- Point at an existing analog, e.g. "mirror audit() usage in apps/api/src/routes/admin/clients.ts". -->

## Verification (must pass)
- `npm run type-check` clean
- `<PR-specific verify command>`
- `npm run audit:coverage` (if touching write endpoints)

## Ledger duty (required)
- Update the PR's line in `docs/PROGRESS.md` + the RESUME block
- Append an entry to `docs/ledger/PR-INDEX.md`

## Out-of-scope
<!-- Explicitly list what NOT to do. If you hit a blocker, note it in PR-INDEX instead of expanding scope. -->

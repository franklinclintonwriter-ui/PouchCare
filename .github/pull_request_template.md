<!-- Enterprise overhaul PRs: keep this checklist honest. See docs/ROADMAP.md. -->

## What & why
<!-- One paragraph: the problem this PR solves and the intended outcome. -->

## Changes
<!-- Bullet the key changes with file paths. -->

## PR (roadmap)
- Roadmap ID: PR-<phase>.<n>
- Critical-path or Parallelizable: <CP | ||>
- Depends on (must merge first): PR-<…>

## Verification
<!-- Exact commands/steps. DB/storage PRs: prisma validate + generate + tsc here; live migrate/seed steps documented for the owner. -->
- [ ] `npm run type-check` green
- [ ] Tests pass (`npm test` / relevant e2e) where applicable
- [ ] (DB/storage) `npx prisma validate && npx prisma generate`

## Ledger duty (required)
- [ ] Flipped my line in `docs/PROGRESS.md`
- [ ] Updated the `CURRENT STATE / RESUME HERE` block
- [ ] Appended an entry to `docs/ledger/PR-INDEX.md`

## Out-of-scope / follow-ups
<!-- Anything intentionally not done; record it rather than expanding scope. -->

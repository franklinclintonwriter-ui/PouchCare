# GAP-2 — Duplicate performance API surface

**Status:** Documented (2026-04-12), no code merge yet.

## Context

Two HTTP paths expose performance ratings:

- `GET/POST /v1/performance` — primary router used by `apps/management/src/api/performance.ts` and `pages/hr/Performance.tsx`.
- `GET/POST …/v1/hr/performance` — second mount under HR router, same underlying Prisma model.

## Risk

Clients can diverge; caching, auth, and pagination may differ between mounts.

## Recommended direction

1. Pick **one** public contract (prefer `/v1/performance` if already used in management).
2. Deprecate the other with `410` + `Sunset` header, or proxy internally to the same handler.
3. Update [incomplete-gap-inventory.md](./incomplete-gap-inventory.md) when resolved.

## References

- `apps/api/src/server.ts` — router mounts
- [OPEN_ISSUES_AND_PROGRESS.md](./OPEN_ISSUES_AND_PROGRESS.md) §4 GAP-2

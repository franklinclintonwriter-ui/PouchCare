# Monitor (CCTV) — API, database, and UI

Checklist for wiring CCTV monitoring to PostgreSQL, validated assets routes, and the management app. Implementation target: `apps/api` (Prisma + `/v1/assets/cameras*`), `apps/management` (`/monitor` pages).

## Database

- [x] Prisma `CameraDevice` with `branch Branch` relation and `@@index([branchId])`
- [x] SQL migration `20260409120000_camera_devices_branch_fk` (see [MIGRATIONS.md](../../apps/api/prisma/MIGRATIONS.md))
- [ ] Apply on your environment: `npx prisma migrate deploy` (or baseline if DB was created with `db push` only)

## API

- [x] `GET /v1/assets/cameras/summary` — totals + per-branch rollups (`monitor.view`)
- [x] `GET/POST/PUT/DELETE/PATCH` cameras with Zod validation (`cameraSchemas.ts`)
- [x] `PATCH .../status` returns 400 on invalid body (via `validate(cameraStatusPatchSchema)`)
- [x] Mutations restricted to `SENIOR_ROLES`; reads require `monitor.view`

## RBAC

- [x] Permission key `monitor.view` (API + management app); default **allowed for all staff roles except `INTERN`**
- [x] Routes `/monitor` and `/monitor/:branchId` wrapped in `PermissionGuard`
- [x] Sidebar Monitor item gated by `monitor.view`

## Seed

- [x] `seedCameras()` after branches — demo cameras per branch
- [ ] Run: `cd apps/api && npx prisma db seed` (requires DB + migration/table present)

## Management UI

- [x] `MonitorDashboard` uses `useMonitorSummary()` (no mock KPIs)
- [x] `BranchCameras` uses `useCamerasByBranch` + `useBranchDetail` with fallbacks
- [x] `LiveViewerModal` uses `CameraDevice` types (`lastMotionAt`)

## Verification

- [ ] Login as non-intern staff → `/monitor` loads summary; branch card → branch cameras
- [ ] Login as intern → Monitor nav hidden; direct URL shows permission guard
- [ ] Create camera (senior role) → list invalidates

## References

- Plan (read-only): `.cursor/plans/monitor_api_db_tasks_*.plan.md` if present
- Routes: [apps/api/src/routes/assets/index.ts](../../apps/api/src/routes/assets/index.ts)
- Client: [apps/management/src/api/monitor.ts](../../apps/management/src/api/monitor.ts)

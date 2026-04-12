# Open issues & progress — master tracker

**Last updated:** 2026-04-12 (continued — task cache + `relatedProjectId` + `ProjectDetail`)  
**Purpose:** One place for **build blockers**, **verified technical debt**, **gap follow-ups**, and **checkbox progress** so work is not lost between sessions. Deep-dive evidence stays in linked files; this doc is the **action queue + context**.

---

## How to use this document

1. **Start with §2 (build / TypeScript)** — a failing `tsc -b` blocks confident releases.
2. **Then §3 (verified issues)** — ordered by impact; each item has an ID for commits/PRs (`fix(INFRA-2): …`).
3. **§4–5** — product/UX debt from gap inventory and UI audits.
4. **§6** — **Session context:** what was already completed (read before re-auditing).
5. When you close an item: check the box, add **one line** under §6 or a dated note in the linked file.

**Refresh typecheck:** `cd apps/management && npx tsc -b --pretty false`

---

## 1. Executive snapshot

| Bucket | Count (approx.) | Notes |
|--------|------------------|--------|
| TS / build blockers | **0** (last `tsc -b` OK) | Re-run before each release; see §2 history |
| Infra / data (verified) | 9 | From [ISSUE_VERIFICATION_2026-04-12](./ISSUE_VERIFICATION_2026-04-12.md) |
| Gap inventory follow-ups | 5+ | [incomplete-gap-inventory](./incomplete-gap-inventory.md) |
| UI audit — deferred / product | varies | Client orders list, prefs backend, etc. |
| **Recently improved (context)** | — | Task reports: print + PDF + signatures (§6) |

---

## 2. Build & TypeScript blockers (`apps/management`)

*Run `npx tsc -b` in `apps/management` and reconcile; IDs below match common failures.*

| ID | Area | Problem (summary) | Status |
|----|------|-------------------|--------|
| **TS-1** | `api/projects.ts` | `startDate` / `dueDate` were `null` vs `Project` requiring `string` | **Done** — map uses fallbacks to `''` / `createdAt` (2026-04-12) |
| **TS-2** | `api/staff.ts` | `joinDate` was `null` vs `string` | **Done** — `joinDate: raw.joinDate ?? ''` (2026-04-12) |
| **TS-3** | `api/plugins.ts` | `mapPlugin` missing | **Done** — `mapPlugin` added (2026-04-12) |
| **TS-4** | `api/attendance.ts` | `checkIn` optional vs required `string` | **Done** — `checkIn: raw.checkInTime ?? ''` (2026-04-12); optional deeper normalize: [verification #8](./ISSUE_VERIFICATION_2026-04-12.md) |
| **TS-5** | `pages/projects/ProjectList.tsx` | Create used `budget` / `dueDate` / `description` vs API `price` / `deadline` / `notes` | **Done** — payload + `useCreateProject` type aligned (2026-04-12) |

### Progress — build

- [x] **TS-1** — Project date mapping vs `Project` type
- [x] **TS-2** — Staff `joinDate` typing
- [x] **TS-3** — `mapPlugin` implemented
- [x] **TS-4** — Attendance `checkIn` required string
- [x] **TS-5** — Project create payload vs API schema
- [x] CI: `npx tsc -b` green on `apps/management` (verify with `npm run build` before release)

---

## 3. Verified technical debt (issue verification audit)

Source: [ISSUE_VERIFICATION_2026-04-12](./ISSUE_VERIFICATION_2026-04-12.md). Full evidence and file paths are in that document.

### Fix soon (correctness / stale data)

- [x] **INFRA-1** — `ProjectDetail`: use `projectId = routeId?.trim() ?? ''`, early return when missing, no `id!` (2026-04-12)
- [x] **INFRA-2** — `useDeleteProject`: already removes `projectKeys.detail(id)` + invalidates list (2026-04-12 verified)
- [x] **INFRA-3** — Tasks: `POST /tasks` + `PUT /tasks/:id` now persist **`relatedProjectId`**; list filter by `projectId` already used `relatedProjectId` (2026-04-12). Legacy `relatedProject` string kept for display name.

### Fix next (data quality)

- [ ] **DATA-1** — Projects API client: replace synthetic `teamMembers` with real join data when backend supports it
- [ ] **DATA-2** — Stop defaulting missing project dates to “now”; use `null` + honest UI ([verification #7](./ISSUE_VERIFICATION_2026-04-12.md))
- [ ] **DATA-3** — Attendance: normalize `checkIn` / `checkOut` empty vs undefined ([verification #8](./ISSUE_VERIFICATION_2026-04-12.md))

### React Query / API hygiene

- [x] **RQ-1** — `useDeleteTask`: `removeQueries` detail + invalidate `my`; submit/approve/reject/verify/rate: invalidate `taskKeys.my` (2026-04-12)
- [x] **RQ-2** — `projectKeys` already in `constants/queryKeys.ts` and used by `projects.ts` (2026-04-12 verified)
- [ ] **API-1** — Typed mutation inputs (`CreateProjectInput`, …) instead of only `Record<string, unknown>` ([verification #15](./ISSUE_VERIFICATION_2026-04-12.md))

### Architecture (ongoing)

- [ ] **ARCH-1** — Single API response contract across modules (paginated vs not) ([verification #14](./ISSUE_VERIFICATION_2026-04-12.md))

---

## 4. Gap inventory — follow-ups

Source: [incomplete-gap-inventory.md](./incomplete-gap-inventory.md)

- [ ] **GAP-1** — Analytics page: align nav promise with `/v1/analytics` usage (or rename nav) — parity with dashboard widgets
- [ ] **GAP-2** — HR: document or merge duplicate performance routes — see [GAP2_HR_PERFORMANCE_ROUTES.md](./GAP2_HR_PERFORMANCE_ROUTES.md)
- [ ] **GAP-3** — Preferences: document localStorage-only or add backend sync
- [ ] **GAP-4** — Optional `recruiterRating` in schema if product needs real application scores
- [ ] **GAP-5** — Remove or wire `apps/management/src/mocks/**` to avoid confusion

### Progress — gaps

- [ ] GAP-1
- [ ] GAP-2
- [ ] GAP-3
- [ ] GAP-4
- [ ] GAP-5

---

## 5. UI / product audit — remaining items

Cross-check [management-ui-audit-2026-04-12](./management-ui-audit-2026-04-12.md) — many HIGH/MEDIUM items were marked fixed in that report. Treat rows below as **still relevant** until verified in code:

- [ ] **UI-1** — `ClientDetail`: orders list still needs client-scoped orders API (deferred in audit)
- [ ] **UI-2** — Email validation: optional JS-level checks on create modals (LOW)
- [ ] **UI-3** — `BranchManagement`: optional in-page permission gates beyond route guard (LOW)

Re-verify in code before implementing (forms may already have been expanded: TaskList, ProjectList, TaskDetail, StaffDetail — see §6).

---

## 6. Session context — recently completed (do not duplicate work)

*Use this to orient new sessions; it is not a substitute for git history.*

| Topic | What was done (summary) | Where |
|-------|-------------------------|--------|
| **Task reports** | Browser print: hide chrome, `PrintBrandHeader` + logo, tab panels visible in print | `PrintBrandHeader.tsx`, `TaskDetail.tsx`, `index.css`, `AppLayout.tsx` |
| **Task PDF** | Async logo load, `drawHeaderBandWithLogo`, sign-off section with dynamic height | `taskPdf.ts`, `pdfCommon.ts`, `pouchcare-logo.png` |
| **Signatures** | `TaskSignatureBlock` + `taskApprovalCopy.ts`; API fields mapped (`managerApprovedDate`, `ceoVerifiedDate`, …) | `TaskSignatureBlock.tsx`, `api/tasks.ts`, `types/models.ts` |
| **Projects** | Print header/actions on `ProjectDetail` | `ProjectDetail.tsx` |
| **Env / API** | Management client aligned with Vite proxy / API `PORT` | `apps/management` `.env`, `api/client.ts` |
| **TS hygiene (mgmt)** | `tsc -b` unblocked: `mapPlugin`, project date strings, staff `joinDate`, attendance `checkIn`, create project field names vs API | `plugins.ts`, `projects.ts`, `staff.ts`, `attendance.ts`, `ProjectList.tsx` (2026-04-12) |
| **Tasks + projects** | API stores `relatedProjectId` on create/update; task mutations invalidate **My Tasks**; delete removes task detail cache; `ProjectDetail` validates route id | `apps/api/.../tasks/index.ts`, `apps/management/src/api/tasks.ts`, `ProjectDetail.tsx` (2026-04-12) |

If you **re-audit** a page, remove or update rows here when superseded.

---

## 7. Master checklist index (quick copy)

**Build:** TS-1 … TS-5 (§2)  
**Infra:** INFRA-1 … INFRA-3  
**Data:** DATA-1 … DATA-3  
**RQ:** RQ-1, RQ-2  
**API:** API-1  
**ARCH:** ARCH-1  
**Gap:** GAP-1 … GAP-5  
**UI:** UI-1 … UI-3  

---

## 8. Related documents (read order)

| Order | File |
|-------|------|
| 1 | [README.md](./README.md) — audit pack index |
| 2 | **[OPEN_ISSUES_AND_PROGRESS.md](./OPEN_ISSUES_AND_PROGRESS.md)** (this file) |
| 3 | [TASKS.md](./TASKS.md) — P01–P75 + API rows |
| 4 | [ISSUE_VERIFICATION_2026-04-12.md](./ISSUE_VERIFICATION_2026-04-12.md) — evidence-heavy |
| 5 | [incomplete-gap-inventory.md](./incomplete-gap-inventory.md) |
| 6 | [PHASED-AUDIT.md](./PHASED-AUDIT.md) |
| 7 | [management-ui-audit-2026-04-12.md](./management-ui-audit-2026-04-12.md) |
| 8 | [MANAGEMENT_REMEDIATION_TASKS_2026-04-12.md](./MANAGEMENT_REMEDIATION_TASKS_2026-04-12.md) (if present) |

---

*Maintainers: when this file grows, split §6 into `docs/audit/archive/SESSION_CONTEXT_YYYY-MM-DD.md` and keep a short pointer here.*

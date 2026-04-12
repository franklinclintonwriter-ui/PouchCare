# Issue Verification Audit (Truth Check) — 2026-04-12

This document verifies the reported issues against the current repository state and records evidence (file + line ranges) plus recommended fixes.

## 🔴 CRITICAL ISSUES (Will break / cause bugs)

### 1) “RTSP URL mixed inside code (invalid TS syntax)”
- **Status:** Not found as described (no `rtsp://...import ...` corruption in the referenced client-portal Support page).
- **Evidence:** [SupportPage.tsx](file:///w:/PouchCare/PouchCare/apps/client-portal/src/pages/support/SupportPage.tsx#L1-L20) starts with valid imports.
- **Reality check:** RTSP strings exist in the backend (expected for CCTV integration) but **not** as a compilation-breaking paste.
  - [vigiRtsp.ts](file:///w:/PouchCare/PouchCare/apps/api/src/lib/vigiRtsp.ts)
- **Risk:** Exposing RTSP URLs to the UI may be a security/product policy concern, but it is not a syntax/compile error in the current code.
- **Recommended fix (if policy requires hiding RTSP):** Return opaque stream tokens and proxy/translate streams server-side (HLS/WebRTC), rather than returning raw RTSP URLs.

### 2) “Duplicate auth.ts file (pasted twice)”
- **Status:** Not found (no literal duplicate file in this checkout).
- **Evidence:** Only these `auth.ts` files exist, and they serve different purposes:
  - [middleware/auth.ts](file:///w:/PouchCare/PouchCare/apps/api/src/middleware/auth.ts)
  - [routes/portal/auth.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/portal/auth.ts)
  - [management/api/auth.ts](file:///w:/PouchCare/PouchCare/apps/management/src/api/auth.ts)
  - [management/types/auth.ts](file:///w:/PouchCare/PouchCare/apps/management/src/types/auth.ts)
- **Recommendation:** No action required for “duplicate auth.ts” specifically.

### 3) “ProjectDetail unsafe `id!`”
- **Status:** Confirmed (type-safety issue; runtime impact depends on route stability).
- **Evidence:** [ProjectDetail.tsx:L64-L77](file:///w:/PouchCare/PouchCare/apps/management/src/pages/projects/ProjectDetail.tsx#L64-L77)
  - `const { id } = useParams<{ id: string }>();`
  - `useProject(id!)`
- **Impact:** If the route param is missing, `id!` becomes `undefined` at runtime; `useProject` currently has `enabled: !!id` (so the fetch won’t run), but the callsite is still unsafe and can cause inconsistent query keys and brittle behavior.
- **Recommended fix:**
  - Use `useParams<{ id?: string }>()` and pass `id ?? ''` (or pass `id` and rely on `enabled: !!id` in the hook).

### 4) “Related tasks logic is weak (search by project name)”
- **Status:** Mixed
  - **Frontend (ProjectDetail):** Not an issue (already uses `projectId` with `enabled`).
    - Evidence: [ProjectDetail.tsx:L70-L76](file:///w:/PouchCare/PouchCare/apps/management/src/pages/projects/ProjectDetail.tsx#L70-L76) uses `useTasks({ projectId: id, ... }, { enabled: !!id })`
  - **Backend (tasks filtering):** Weak data model still exists.
    - Evidence: [tasks/index.ts:L61-L82](file:///w:/PouchCare/PouchCare/apps/api/src/routes/tasks/index.ts#L61-L82) matches `relatedProject` against **either** project `name` or `id`.
- **Impact:** Projects renamed → tasks association becomes unreliable if stored by name; duplicates → ambiguous.
- **Recommended fix (backend):** Add `relatedProjectId` (UUID) to `Task` and query by it only.

### 5) “useDeleteProject does NOT invalidate detail cache”
- **Status:** Confirmed
- **Evidence:** [projects.ts:L79-L84](file:///w:/PouchCare/PouchCare/apps/management/src/api/projects.ts#L79-L84) invalidates only `['projects']`.
- **Impact:** After deletion, `['project', id]` may stay cached; navigation back to detail can show stale data.
- **Recommended fix:** In `onSuccess: (_, id) => { invalidate projects; remove project detail }`.

## 🟠 LOGIC / DATA MAPPING ISSUES

### 6) “Fake teamMembers in project”
- **Status:** Confirmed
- **Evidence:** [projects.ts:L21-L38](file:///w:/PouchCare/PouchCare/apps/management/src/api/projects.ts#L21-L38) creates a synthetic member:
  - `[{ id: \`assigned:${raw.id}\`, name: assignee }]`
- **Impact:** Breaks avatars, permissions, team features, and any future “real team” UX.
- **Recommended fix:** Backend should return `teamMembers: [{ id, name, avatarUrl? }]` and a stable relationship (`projectMembers` table or join).

### 7) “Defaulting dates to NOW silently”
- **Status:** Confirmed
- **Evidence:** [projects.ts:L35-L38](file:///w:/PouchCare/PouchCare/apps/management/src/api/projects.ts#L35-L38) defaults to `new Date().toISOString()` for missing dates.
- **Impact:** UI shows “fake valid” timelines; analytics and filtering become misleading.
- **Recommended fix:** Use `null` when missing; UI displays “Not set”.

### 8) “Attendance mapping inconsistency (\"\" vs undefined)”
- **Status:** Confirmed
- **Evidence:** [attendance.ts:L37-L48](file:///w:/PouchCare/PouchCare/apps/management/src/api/attendance.ts#L37-L48)
  - `checkIn: raw.checkInTime ?? ""`
  - `checkOut: raw.checkOutTime ?? undefined`
- **Impact:** Components must handle two different “not set” representations → subtle UI bugs.
- **Recommended fix:** Normalize both to `undefined` (or both `null`) consistently.

### 9) “useMyAttendance response inconsistency handling”
- **Status:** Confirmed (frontend is compensating for inconsistent shapes)
- **Evidence:** [attendance.ts:L51-L58](file:///w:/PouchCare/PouchCare/apps/management/src/api/attendance.ts#L51-L58) implements `rowsFromResponse()` to accept either `{ data: [] }` or raw arrays.
- **Impact:** Backend response format is not consistently enforced, and frontend hooks become harder to maintain.
- **Recommended fix:** Standardize backend to always return `{ success, data, meta? }`, and ensure the management interceptor contract is followed everywhere.

### 10) “Staff isActive logic fragile”
- **Status:** Confirmed
- **Evidence:** [staff.ts:L59-L72](file:///w:/PouchCare/PouchCare/apps/management/src/api/staff.ts#L59-L72)
  - `isActive: (raw.status ?? '').toLowerCase() === 'active'`
- **Impact:** If backend returns `ACTIVE`, `enabled`, etc., the UI mislabels users.
- **Recommended fix:** Map via allowed set: `['active','enabled']`.

## 🟡 REACT QUERY / CACHE ISSUES

### 11) “createProject invalidation too narrow”
- **Status:** Partially confirmed (pattern could be made clearer/safer)
- **Evidence:** [projects.ts:L63-L69](file:///w:/PouchCare/PouchCare/apps/management/src/api/projects.ts#L63-L69) uses `invalidateQueries({ queryKey: ['projects'] })`.
- **Note:** In TanStack Query this typically invalidates all queries starting with the key prefix (unless `exact: true`), but being explicit (`exact: false`) prevents future confusion.

### 12) “Task mutations don’t invalidate myTasks consistently”
- **Status:** Confirmed for delete/most mutations (myTasks isn’t invalidated consistently)
- **Evidence:** [tasks.ts:L88-L116](file:///w:/PouchCare/PouchCare/apps/management/src/api/tasks.ts#L88-L116)
  - `useCreateTask` invalidates `taskKeys.my` ✅
  - `useDeleteTask` invalidates only `taskKeys.root` ❌
- **Recommended fix:** Use a consistent invalidation pattern for all mutations affecting lists:
  - invalidate `taskKeys.root`
  - invalidate `taskKeys.my`
  - invalidate detail key when applicable

### 13) “Over-invalidation (performance)”
- **Status:** Mixed (intentional but potentially heavy)
- **Evidence:** [queryKeys.ts:L22-L39](file:///w:/PouchCare/PouchCare/apps/management/src/constants/queryKeys.ts#L22-L39) invalidates multiple attendance key families after mutations.
- **Impact:** Can refetch many pages; may be OK for small datasets but will degrade at scale.
- **Recommended fix:** Keep the centralized helper, but scope invalidation where possible (invalidate only affected keys + active filters).

## 🔵 ARCHITECTURE ISSUES

### 14) “API layer leaking backend structure”
- **Status:** Confirmed
- **Evidence:** Management interceptor unwraps envelopes:
  - [client.ts:L39-L48](file:///w:/PouchCare/PouchCare/apps/management/src/api/client.ts#L39-L48)
- **But:** Several API modules still consume `res.data.data` or mix shapes, implying uncertainty about the contract (e.g. plugins/services).
- **Recommendation:** Enforce one contract across all API modules:
  - Non-paginated: `res.data` is the payload
  - Paginated: `res.data` is `{ data, meta }`

### 15) “No strict typing in mutations”
- **Status:** Confirmed
- **Evidence:** e.g. [projects.ts:L63-L76](file:///w:/PouchCare/PouchCare/apps/management/src/api/projects.ts#L63-L76) uses `Record<string, unknown>` for bodies.
- **Impact:** Easy to ship wrong payloads; weak editor help.
- **Recommendation:** Introduce typed input DTOs per mutation (e.g. `CreateProjectInput`, `UpdateProjectInput`).

### 16) “Query key inconsistency”
- **Status:** Partially confirmed (some areas are standardized, others are not)
- **Evidence:**
  - Standardized: [queryKeys.ts](file:///w:/PouchCare/PouchCare/apps/management/src/constants/queryKeys.ts) (tasks + attendance)
  - Not standardized: projects uses raw string arrays [projects.ts](file:///w:/PouchCare/PouchCare/apps/management/src/api/projects.ts)
- **Recommendation:** Add `projectKeys` in the same style as `taskKeys`, migrate gradually.

## Summary (Priority Fix List)

### Fix immediately
- Project detail route param safety + query enabling ([ProjectDetail.tsx](file:///w:/PouchCare/PouchCare/apps/management/src/pages/projects/ProjectDetail.tsx#L64-L77))
- Project delete invalidation should remove detail cache ([projects.ts](file:///w:/PouchCare/PouchCare/apps/management/src/api/projects.ts#L79-L84))
- Stop backend task-project matching by name ([tasks/index.ts](file:///w:/PouchCare/PouchCare/apps/api/src/routes/tasks/index.ts#L61-L82))

### Fix next
- Replace fake project team model ([projects.ts](file:///w:/PouchCare/PouchCare/apps/management/src/api/projects.ts#L21-L38))
- Normalize date defaults to `null` (projects + staff) ([projects.ts](file:///w:/PouchCare/PouchCare/apps/management/src/api/projects.ts#L35-L38), [staff.ts](file:///w:/PouchCare/PouchCare/apps/management/src/api/staff.ts#L59-L72))
- Align attendance “not set” fields ([attendance.ts](file:///w:/PouchCare/PouchCare/apps/management/src/api/attendance.ts#L37-L48))

### Improve architecture
- Standardize API client contract usage across all API modules ([client.ts](file:///w:/PouchCare/PouchCare/apps/management/src/api/client.ts#L39-L48))
- Introduce typed mutation inputs and consistent query keys


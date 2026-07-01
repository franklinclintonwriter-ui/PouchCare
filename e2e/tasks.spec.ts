import { test, expect } from '@playwright/test';
import { apiLogin, authed } from './helpers/staffAuth';

test.describe.configure({ mode: 'serial' });

// ─── helpers ────────────────────────────────────────────────────────────────

async function createTask(
  api: ReturnType<typeof authed>,
  overrides: Record<string, unknown> = {},
) {
  const res = await api.post('/tasks', {
    title: `E2E task ${Date.now()}`,
    priority: 'MEDIUM',
    ...overrides,
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return (body.data ?? body) as { id: string; title: string; status: string; approvalStatus: string };
}

async function getOutsideBranchMember(
  branchApi: ReturnType<typeof authed>,
  ceoApi: ReturnType<typeof authed>,
) {
  const branchRes = await branchApi.get('/staff/members', { limit: 200 });
  expect(branchRes.ok()).toBe(true);
  const branchMembers = (await branchRes.json()).data ?? [];
  const branchIds = new Set(branchMembers.map((m: { id: string }) => m.id));
  const branchNames = new Set(
    branchMembers
      .map((m: { branch?: string | null }) => m.branch)
      .filter((name): name is string => !!name),
  );

  const allRes = await ceoApi.get('/staff/members', { limit: 500 });
  expect(allRes.ok()).toBe(true);
  const allMembers = (await allRes.json()).data ?? [];

  const outside = allMembers.find(
    (m: { id: string; email?: string; branch?: string | null }) => {
      if (!m.email || !m.branch) return false;
      if (branchNames.has(m.branch)) return false;
      return !branchIds.has(m.id);
    },
  );
  expect(outside).toBeTruthy();
  return outside as { id: string; email: string; branch?: string | null };
}

async function isBranchManagerSeed(
  branchApi: ReturnType<typeof authed>,
  memberId: string,
): Promise<boolean> {
  const meRes = await branchApi.get(`/staff/members/${memberId}`);
  if (!meRes.ok()) return false;
  const me = (await meRes.json()).data ?? {};
  return me.systemRole === 'BRANCH_MANAGER';
}

async function getAnotherOwnBranchMember(
  branchApi: ReturnType<typeof authed>,
  currentUserId: string,
) {
  const membersRes = await branchApi.get('/staff/members', { limit: 200 });
  expect(membersRes.ok()).toBe(true);
  const members = (await membersRes.json()).data ?? [];
  const candidate = members.find(
    (m: { id: string; systemRole?: string }) => m.id !== currentUserId && m.systemRole !== 'BRANCH_MANAGER',
  );
  expect(candidate).toBeTruthy();
  return candidate as { id: string; email?: string | null; branch?: string | null };
}

// ─── Task CRUD ───────────────────────────────────────────────────────────────

test.describe('Task CRUD', () => {
  test('manager can create, read and update a task', async ({ request }) => {
    test.setTimeout(60_000);
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const api = authed(request, ops.accessToken);

    // CREATE
    const task = await createTask(api, {
      notes: 'e2e note',
      assignedMemberId: ops.user.id,
    });
    expect(task.id).toBeTruthy();
    expect(task.status).toBe('NOT_STARTED');
    expect(task.approvalStatus).toBe('WAITING');

    // READ single
    const getRes = await api.get(`/tasks/${task.id}`);
    expect(getRes.ok()).toBe(true);
    const fetched = (await getRes.json()).data ?? {};
    expect(fetched.id).toBe(task.id);

    // UPDATE via PUT
    const putRes = await api.put(`/tasks/${task.id}`, { notes: 'updated note' });
    expect(putRes.ok()).toBe(true);
    const updated = (await putRes.json()).data ?? {};
    expect(updated.notes).toBe('updated note');

    // LIST endpoint remains reachable for manager role.
    const listRes = await api.get('/tasks', { limit: 100 });
    expect(listRes.ok()).toBe(true);
  });

  test('CEO can delete a task', async ({ request }) => {
    test.setTimeout(60_000);
    const ceo = await apiLogin(request, 'ceo@pouchcare.com');
    const api = authed(request, ceo.accessToken);

    const task = await createTask(api);
    const delRes = await api.delete(`/tasks/${task.id}`);
    expect(delRes.ok()).toBe(true);

    const getAfter = await api.get(`/tasks/${task.id}`);
    expect(getAfter.status()).toBe(404);
  });

  test('non-CEO manager cannot delete a task', async ({ request }) => {
    test.setTimeout(60_000);
    const ceo = await apiLogin(request, 'ceo@pouchcare.com');
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const ceoApi = authed(request, ceo.accessToken);
    const opsApi = authed(request, ops.accessToken);

    const task = await createTask(ceoApi);
    const delRes = await opsApi.delete(`/tasks/${task.id}`);
    expect([401, 403]).toContain(delRes.status());
  });
});

// ─── My Tasks ────────────────────────────────────────────────────────────────

test.describe('My Tasks', () => {
  test('mine=true returns only the caller\'s assigned tasks', async ({ request }) => {
    test.setTimeout(60_000);
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const dev = await apiLogin(request, 'dev1@pouchcare.com');
    const opsApi = authed(request, ops.accessToken);
    const devApi = authed(request, dev.accessToken);

    const marker = `Mine-dev ${Date.now()}`;
    const devTask = await createTask(opsApi, {
      title: marker,
      assignedMemberId: dev.user.id,
    });

    // dev's mine=true includes their task
    const devMineRes = await devApi.get('/tasks', { mine: 'true', q: marker, limit: 100 });
    expect(devMineRes.ok()).toBe(true);
    const devTasks = (await devMineRes.json()).data ?? [];
    expect(devTasks.map((t: { id: string }) => t.id)).toContain(devTask.id);

    // ops' mine=true list does NOT contain dev's task
    const opsMineRes = await opsApi.get('/tasks', { mine: 'true', q: marker, limit: 100 });
    expect(opsMineRes.ok()).toBe(true);
    const opsTasks = (await opsMineRes.json()).data ?? [];
    expect(opsTasks.map((t: { id: string }) => t.id)).not.toContain(devTask.id);
  });

  test('STAFF role auto-scope: sees only own tasks, never another staff member\'s', async ({ request }) => {
    test.setTimeout(60_000);
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const dev = await apiLogin(request, 'dev1@pouchcare.com');
    const content = await apiLogin(request, 'content1@pouchcare.com');
    const opsApi = authed(request, ops.accessToken);
    const devApi = authed(request, dev.accessToken);
    const contentApi = authed(request, content.accessToken);

    const marker = `Staff-filter ${Date.now()}`;
    const devTask = await createTask(opsApi, {
      title: marker,
      assignedMemberId: dev.user.id,
    });

    // dev sees own task in list
    const devList = await devApi.get('/tasks', { q: marker, limit: 100 });
    expect(devList.ok()).toBe(true);
    expect((await devList.json()).data.map((t: { id: string }) => t.id)).toContain(devTask.id);

    // content does NOT see dev's task in list
    const contentList = await contentApi.get('/tasks', { q: marker, limit: 100 });
    expect(contentList.ok()).toBe(true);
    expect((await contentList.json()).data.map((t: { id: string }) => t.id)).not.toContain(devTask.id);
  });

  test('staff cannot read a task detail not assigned to them', async ({ request }) => {
    test.setTimeout(60_000);
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const dev = await apiLogin(request, 'dev1@pouchcare.com');
    const content = await apiLogin(request, 'content1@pouchcare.com');
    const opsApi = authed(request, ops.accessToken);
    const contentApi = authed(request, content.accessToken);

    const task = await createTask(opsApi, { assignedMemberId: dev.user.id });
    const res = await contentApi.get(`/tasks/${task.id}`);
    expect(res.status()).toBe(404);
  });

  test('/tasks/mine supports priority + approval filters together', async ({ request }) => {
    test.setTimeout(90_000);
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const dev = await apiLogin(request, 'dev1@pouchcare.com');
    const opsApi = authed(request, ops.accessToken);
    const devApi = authed(request, dev.accessToken);

    const marker = `Mine-filters ${Date.now()}`;
    const waitingHigh = await createTask(opsApi, {
      title: `${marker} waiting-high`,
      priority: 'HIGH',
      assignedMemberId: dev.user.id,
    });
    const submittedHigh = await createTask(opsApi, {
      title: `${marker} submitted-high`,
      priority: 'HIGH',
      assignedMemberId: dev.user.id,
    });
    const submittedLow = await createTask(opsApi, {
      title: `${marker} submitted-low`,
      priority: 'LOW',
      assignedMemberId: dev.user.id,
    });

    const submitA = await devApi.post(`/tasks/${submittedHigh.id}/submit`, { staffSubmissionNote: 'submitted high' });
    expect(submitA.ok()).toBe(true);
    const submitB = await devApi.post(`/tasks/${submittedLow.id}/submit`, { staffSubmissionNote: 'submitted low' });
    expect(submitB.ok()).toBe(true);

    const mineRes = await devApi.get('/tasks/mine', {
      q: marker,
      approvalStatus: 'SUBMITTED',
      priority: 'HIGH',
      limit: 100,
    });
    expect(mineRes.ok()).toBe(true);
    const rows = (await mineRes.json()).data ?? [];
    const ids = rows.map((row: { id: string }) => row.id);

    expect(ids).toContain(submittedHigh.id);
    expect(ids).not.toContain(waitingHigh.id);
    expect(ids).not.toContain(submittedLow.id);
  });
});

// ─── Task lifecycle ──────────────────────────────────────────────────────────

test.describe('Task lifecycle: submit → approve → verify', () => {
  test('full happy path', async ({ request }) => {
    test.setTimeout(90_000);
    const ceo = await apiLogin(request, 'ceo@pouchcare.com');
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const dev = await apiLogin(request, 'dev1@pouchcare.com');
    const ceoApi = authed(request, ceo.accessToken);
    const opsApi = authed(request, ops.accessToken);
    const devApi = authed(request, dev.accessToken);

    const task = await createTask(opsApi, { assignedMemberId: dev.user.id });
    expect(task.approvalStatus).toBe('WAITING');

    // Staff submits
    const submitRes = await devApi.post(`/tasks/${task.id}/submit`, { staffSubmissionNote: 'Done!' });
    expect(submitRes.ok()).toBe(true);
    expect(((await submitRes.json()).data ?? {}).approvalStatus).toBe('SUBMITTED');

    // Manager approves
    const approveRes = await opsApi.post(`/tasks/${task.id}/approve`, { note: 'LGTM' });
    expect(approveRes.ok()).toBe(true);
    expect(((await approveRes.json()).data ?? {}).approvalStatus).toBe('APPROVED_MGR');

    // CEO verifies
    const verifyRes = await ceoApi.post(`/tasks/${task.id}/verify`, { ceoWorkRating: 4.5 });
    expect(verifyRes.ok()).toBe(true);
    const verified = (await verifyRes.json()).data ?? {};
    expect(verified.approvalStatus).toBe('VERIFIED');
    expect(verified.ceoVerified).toBe(true);
  });

  test('manager rejects a submitted task', async ({ request }) => {
    test.setTimeout(60_000);
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const dev = await apiLogin(request, 'dev1@pouchcare.com');
    const opsApi = authed(request, ops.accessToken);
    const devApi = authed(request, dev.accessToken);

    const task = await createTask(opsApi, { assignedMemberId: dev.user.id });
    await devApi.post(`/tasks/${task.id}/submit`, { staffSubmissionNote: 'Draft' });

    const rejectRes = await opsApi.post(`/tasks/${task.id}/reject`, { note: 'Needs rework' });
    expect(rejectRes.ok()).toBe(true);
    expect(((await rejectRes.json()).data ?? {}).approvalStatus).toBe('REJECTED_MGR');
  });

  test('manager escalates a submitted task to CEO', async ({ request }) => {
    test.setTimeout(60_000);
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const dev = await apiLogin(request, 'dev1@pouchcare.com');
    const opsApi = authed(request, ops.accessToken);
    const devApi = authed(request, dev.accessToken);

    const task = await createTask(opsApi, { assignedMemberId: dev.user.id });
    await devApi.post(`/tasks/${task.id}/submit`, { staffSubmissionNote: 'Done' });

    const escalateRes = await opsApi.post(`/tasks/${task.id}/escalate`, {});
    expect(escalateRes.ok()).toBe(true);
    expect(((await escalateRes.json()).data ?? {}).approvalStatus).toBe('ESCALATED');
  });

  test('staff cannot submit a task not assigned to them', async ({ request }) => {
    test.setTimeout(60_000);
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const dev = await apiLogin(request, 'dev1@pouchcare.com');
    const content = await apiLogin(request, 'content1@pouchcare.com');
    const opsApi = authed(request, ops.accessToken);
    const contentApi = authed(request, content.accessToken);

    const task = await createTask(opsApi, { assignedMemberId: dev.user.id });
    const res = await contentApi.post(`/tasks/${task.id}/submit`, { staffSubmissionNote: 'nope' });
    expect([403, 404]).toContain(res.status());
  });
});

// ─── Task RBAC ───────────────────────────────────────────────────────────────

test.describe('Task RBAC', () => {
  test('STAFF role cannot create a task', async ({ request }) => {
    test.setTimeout(30_000);
    const dev = await apiLogin(request, 'dev1@pouchcare.com');
    const res = await authed(request, dev.accessToken).post('/tasks', {
      title: 'Sneaky task',
      priority: 'LOW',
    });
    expect([401, 403]).toContain(res.status());
  });

  test('staff cannot update another staff member\'s task', async ({ request }) => {
    test.setTimeout(60_000);
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const dev = await apiLogin(request, 'dev1@pouchcare.com');
    const content = await apiLogin(request, 'content1@pouchcare.com');
    const opsApi = authed(request, ops.accessToken);
    const contentApi = authed(request, content.accessToken);

    const task = await createTask(opsApi, { assignedMemberId: dev.user.id });
    const badRes = await contentApi.put(`/tasks/${task.id}`, { notes: 'hijack' });
    expect([403, 404]).toContain(badRes.status());
  });

  test('CEO can rate a completed and verified task', async ({ request }) => {
    test.setTimeout(90_000);
    const ceo = await apiLogin(request, 'ceo@pouchcare.com');
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const dev = await apiLogin(request, 'dev1@pouchcare.com');
    const ceoApi = authed(request, ceo.accessToken);
    const opsApi = authed(request, ops.accessToken);
    const devApi = authed(request, dev.accessToken);

    const task = await createTask(opsApi, { assignedMemberId: dev.user.id });
    await devApi.post(`/tasks/${task.id}/submit`, { staffSubmissionNote: 'Ready' });
    await opsApi.post(`/tasks/${task.id}/approve`, { note: 'OK' });
    await ceoApi.post(`/tasks/${task.id}/verify`, {});

    const rateRes = await ceoApi.post(`/tasks/${task.id}/rate`, { rating: 5, note: 'Excellent' });
    expect(rateRes.ok()).toBe(true);
    expect(((await rateRes.json()).data ?? {}).ceoWorkRating).toBe(5);
  });
});

// ─── Task bulk assignment ───────────────────────────────────────────────────

test.describe('Task bulk assignment', () => {
  test('ops manager can bulk reassign tasks to another staff member', async ({ request }) => {
    test.setTimeout(90_000);
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const dev = await apiLogin(request, 'dev1@pouchcare.com');
    const content = await apiLogin(request, 'content1@pouchcare.com');
    const opsApi = authed(request, ops.accessToken);
    const contentApi = authed(request, content.accessToken);

    const marker = `Bulk-reassign ${Date.now()}`;
    const taskA = await createTask(opsApi, { title: `${marker} A`, assignedMemberId: dev.user.id });
    const taskB = await createTask(opsApi, { title: `${marker} B`, assignedMemberId: dev.user.id });

    const bulkRes = await opsApi.post('/tasks/bulk/assign', {
      ids: [taskA.id, taskB.id],
      assignedMemberId: content.user.id,
    });
    expect(bulkRes.ok()).toBe(true);
    const payload = (await bulkRes.json()).data ?? {};
    expect(payload.okCount).toBe(2);

    const contentMine = await contentApi.get('/tasks/mine', { q: marker, limit: 100 });
    expect(contentMine.ok()).toBe(true);
    const contentTaskIds = ((await contentMine.json()).data ?? []).map((task: { id: string }) => task.id);
    expect(contentTaskIds).toContain(taskA.id);
    expect(contentTaskIds).toContain(taskB.id);
  });

  test('branch manager bulk reassign skips tasks outside their branch', async ({ request }) => {
    test.setTimeout(90_000);
    const ceo = await apiLogin(request, 'ceo@pouchcare.com');
    const branch = await apiLogin(request, 'branch@pouchcare.com');
    const ceoApi = authed(request, ceo.accessToken);
    const branchApi = authed(request, branch.accessToken);
    test.skip(!(await isBranchManagerSeed(branchApi, branch.user.id)), 'Seed account is not BRANCH_MANAGER');

    const outsider = await getOutsideBranchMember(branchApi, ceoApi);
    const task = await createTask(ceoApi, {
      title: `Bulk-cross-branch ${Date.now()}`,
      assignedMemberId: outsider.id,
    });

    const bulkRes = await branchApi.post('/tasks/bulk/assign', {
      ids: [task.id],
      assignedMemberId: branch.user.id,
    });
    expect(bulkRes.ok()).toBe(true);
    const payload = (await bulkRes.json()).data ?? {};
    expect(payload.okCount).toBe(0);
    expect(payload.total).toBe(1);
    expect(payload.results?.[0]?.error).toBe('forbidden');

    const detailRes = await ceoApi.get(`/tasks/${task.id}`);
    expect(detailRes.ok()).toBe(true);
    const detail = (await detailRes.json()).data ?? {};
    expect(detail.assignedMemberId).toBe(outsider.id);
  });

  test('branch manager can bulk reassign between own branch members', async ({ request }) => {
    test.setTimeout(90_000);
    const ceo = await apiLogin(request, 'ceo@pouchcare.com');
    const branch = await apiLogin(request, 'branch@pouchcare.com');
    const ceoApi = authed(request, ceo.accessToken);
    const branchApi = authed(request, branch.accessToken);
    test.skip(!(await isBranchManagerSeed(branchApi, branch.user.id)), 'Seed account is not BRANCH_MANAGER');

    const member = await getAnotherOwnBranchMember(branchApi, branch.user.id);
    const marker = `Bulk-own-branch ${Date.now()}`;
    const task = await createTask(ceoApi, {
      title: marker,
      assignedMemberId: branch.user.id,
    });

    const bulkRes = await branchApi.post('/tasks/bulk/assign', {
      ids: [task.id],
      assignedMemberId: member.id,
    });
    expect(bulkRes.ok()).toBe(true);
    const payload = (await bulkRes.json()).data ?? {};
    expect(payload.okCount).toBe(1);

    const detailRes = await ceoApi.get(`/tasks/${task.id}`);
    expect(detailRes.ok()).toBe(true);
    const detail = (await detailRes.json()).data ?? {};
    expect(detail.assignedMemberId).toBe(member.id);
  });
});

// ─── Branch manager scope ───────────────────────────────────────────────────

test.describe('Branch manager scope on tasks', () => {
  test('branch manager can create task for own branch member', async ({ request }) => {
    test.setTimeout(60_000);
    const branch = await apiLogin(request, 'branch@pouchcare.com');
    const branchApi = authed(request, branch.accessToken);
    test.skip(!(await isBranchManagerSeed(branchApi, branch.user.id)), 'Seed account is not BRANCH_MANAGER');

    const membersRes = await branchApi.get('/staff/members', { limit: 100 });
    expect(membersRes.ok()).toBe(true);
    const members = (await membersRes.json()).data ?? [];
    expect(members.length).toBeGreaterThan(0);

    // Prefer a non-manager branch member if present, fallback to manager self.
    const target =
      members.find((m: { id: string; systemRole?: string }) => m.id !== branch.user.id && m.systemRole !== 'BRANCH_MANAGER') ??
      members[0];

    const createRes = await branchApi.post('/tasks', {
      title: `Branch-scope-create ${Date.now()}`,
      priority: 'MEDIUM',
      assignedMemberId: target.id,
    });
    expect(createRes.status()).toBe(201);
  });

  test('branch manager cannot create task for another branch member', async ({ request }) => {
    test.setTimeout(60_000);
    const ceo = await apiLogin(request, 'ceo@pouchcare.com');
    const branch = await apiLogin(request, 'branch@pouchcare.com');
    const ceoApi = authed(request, ceo.accessToken);
    const branchApi = authed(request, branch.accessToken);
    test.skip(!(await isBranchManagerSeed(branchApi, branch.user.id)), 'Seed account is not BRANCH_MANAGER');
    const outsider = await getOutsideBranchMember(branchApi, ceoApi);

    const createRes = await branchApi.post('/tasks', {
      title: `Cross-branch-create-blocked ${Date.now()}`,
      priority: 'HIGH',
      assignedMemberId: outsider.id,
    });
    expect(createRes.status()).toBe(403);
  });

  test('branch manager cannot approve/reject/escalate cross-branch tasks', async ({ request }) => {
    test.setTimeout(90_000);
    const ceo = await apiLogin(request, 'ceo@pouchcare.com');
    const branch = await apiLogin(request, 'branch@pouchcare.com');
    const ceoApi = authed(request, ceo.accessToken);
    const branchApi = authed(request, branch.accessToken);
    test.skip(!(await isBranchManagerSeed(branchApi, branch.user.id)), 'Seed account is not BRANCH_MANAGER');
    const outsider = await getOutsideBranchMember(branchApi, ceoApi);
    const outsiderLogin = await apiLogin(request, outsider.email);
    const outsiderApi = authed(request, outsiderLogin.accessToken);

    // Create task assigned to known out-of-branch member, then submit.
    const task = await createTask(ceoApi, {
      title: `Cross-branch-review-blocked ${Date.now()}`,
      assignedMemberId: outsider.id,
    });
    const submitRes = await outsiderApi.post(`/tasks/${task.id}/submit`, { staffSubmissionNote: 'submitted by outsider' });
    expect(submitRes.ok()).toBe(true);

    const approveRes = await branchApi.post(`/tasks/${task.id}/approve`, { note: 'not allowed' });
    expect(approveRes.status()).toBe(403);

    const rejectRes = await branchApi.post(`/tasks/${task.id}/reject`, { note: 'not allowed' });
    expect(rejectRes.status()).toBe(403);

    const escalateRes = await branchApi.post(`/tasks/${task.id}/escalate`, {});
    expect(escalateRes.status()).toBe(403);
  });

  test('branch manager actions are audit-logged for own-branch task', async ({ request }) => {
    test.setTimeout(90_000);
    const ceo = await apiLogin(request, 'ceo@pouchcare.com');
    const branch = await apiLogin(request, 'branch@pouchcare.com');
    const ceoApi = authed(request, ceo.accessToken);
    const branchApi = authed(request, branch.accessToken);
    test.skip(!(await isBranchManagerSeed(branchApi, branch.user.id)), 'Seed account is not BRANCH_MANAGER');

    const membersRes = await branchApi.get('/staff/members', { limit: 100 });
    expect(membersRes.ok()).toBe(true);
    const members = (await membersRes.json()).data ?? [];
    expect(members.length).toBeGreaterThan(0);
    const target =
      members.find((m: { id: string; systemRole?: string }) => m.id !== branch.user.id && m.systemRole !== 'BRANCH_MANAGER') ??
      members[0];

    const createRes = await branchApi.post('/tasks', {
      title: `Branch-audit-create ${Date.now()}`,
      priority: 'MEDIUM',
      assignedMemberId: target.id,
    });
    expect(createRes.status()).toBe(201);
    const task = (await createRes.json()).data ?? {};

    const updateRes = await branchApi.put(`/tasks/${task.id}`, { notes: 'branch manager updated note' });
    expect(updateRes.ok()).toBe(true);

    const auditRes = await ceoApi.get('/admin/audit', { resourceKind: 'Task', limit: 100 });
    expect(auditRes.ok()).toBe(true);
    const entries: { resourceId: string; action: string }[] = (await auditRes.json()).data ?? [];
    const actions = entries.filter((e) => e.resourceId === task.id).map((e) => e.action);

    expect(actions).toContain('task.create');
    expect(actions).toContain('task.update');
  });

  test('branch manager list includes own-branch member tasks and excludes cross-branch tasks', async ({ request }) => {
    test.setTimeout(90_000);
    const ceo = await apiLogin(request, 'ceo@pouchcare.com');
    const branch = await apiLogin(request, 'branch@pouchcare.com');
    const ceoApi = authed(request, ceo.accessToken);
    const branchApi = authed(request, branch.accessToken);
    test.skip(!(await isBranchManagerSeed(branchApi, branch.user.id)), 'Seed account is not BRANCH_MANAGER');

    const ownMember = await getAnotherOwnBranchMember(branchApi, branch.user.id);
    const outsider = await getOutsideBranchMember(branchApi, ceoApi);
    const marker = `Branch-list-scope ${Date.now()}`;

    const ownTask = await createTask(ceoApi, {
      title: `${marker} own`,
      assignedMemberId: ownMember.id,
    });
    const outsiderTask = await createTask(ceoApi, {
      title: `${marker} outside`,
      assignedMemberId: outsider.id,
    });

    const listRes = await branchApi.get('/tasks', { q: marker, limit: 200 });
    expect(listRes.ok()).toBe(true);
    const ids = ((await listRes.json()).data ?? []).map((t: { id: string }) => t.id);

    expect(ids).toContain(ownTask.id);
    expect(ids).not.toContain(outsiderTask.id);
  });

  test('branch manager cannot read or update cross-branch task detail endpoints', async ({ request }) => {
    test.setTimeout(90_000);
    const ceo = await apiLogin(request, 'ceo@pouchcare.com');
    const branch = await apiLogin(request, 'branch@pouchcare.com');
    const ceoApi = authed(request, ceo.accessToken);
    const branchApi = authed(request, branch.accessToken);
    test.skip(!(await isBranchManagerSeed(branchApi, branch.user.id)), 'Seed account is not BRANCH_MANAGER');

    const outsider = await getOutsideBranchMember(branchApi, ceoApi);
    const task = await createTask(ceoApi, {
      title: `Cross-branch-detail-blocked ${Date.now()}`,
      assignedMemberId: outsider.id,
    });

    const detailRes = await branchApi.get(`/tasks/${task.id}`);
    expect(detailRes.status()).toBe(404);

    const updateRes = await branchApi.put(`/tasks/${task.id}`, { notes: 'not allowed from another branch' });
    expect(updateRes.status()).toBe(403);
  });

  test('branch manager cannot access cross-branch task comments endpoints', async ({ request }) => {
    test.setTimeout(90_000);
    const ceo = await apiLogin(request, 'ceo@pouchcare.com');
    const branch = await apiLogin(request, 'branch@pouchcare.com');
    const ceoApi = authed(request, ceo.accessToken);
    const branchApi = authed(request, branch.accessToken);
    test.skip(!(await isBranchManagerSeed(branchApi, branch.user.id)), 'Seed account is not BRANCH_MANAGER');

    const outsider = await getOutsideBranchMember(branchApi, ceoApi);
    const task = await createTask(ceoApi, {
      title: `Cross-branch-comments-blocked ${Date.now()}`,
      assignedMemberId: outsider.id,
    });

    const listCommentsRes = await branchApi.get(`/tasks/${task.id}/comments`);
    expect(listCommentsRes.status()).toBe(404);

    const createCommentRes = await branchApi.post(`/tasks/${task.id}/comments`, { content: 'not allowed' });
    expect(createCommentRes.status()).toBe(404);
  });
});

// ─── Task comments ───────────────────────────────────────────────────────────

test.describe('Task comments', () => {
  test('assigned staff can post a comment and it appears in task detail', async ({ request }) => {
    test.setTimeout(60_000);
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const dev = await apiLogin(request, 'dev1@pouchcare.com');
    const opsApi = authed(request, ops.accessToken);
    const devApi = authed(request, dev.accessToken);

    const task = await createTask(opsApi, { assignedMemberId: dev.user.id });

    const commentRes = await devApi.post(`/tasks/${task.id}/comments`, {
      content: 'Working on it',
    });
    expect(commentRes.status()).toBe(201);
    const comment = (await commentRes.json()).data ?? {};
    expect(comment.content).toBe('Working on it');

    // Verify comment appears in task detail
    const detailRes = await devApi.get(`/tasks/${task.id}`);
    const detail = (await detailRes.json()).data ?? {};
    const found = (detail.comments ?? []).some((c: { content: string }) => c.content === 'Working on it');
    expect(found).toBe(true);
  });
});

// ─── Audit trail ─────────────────────────────────────────────────────────────

test.describe('Task audit trail', () => {
  test('create / submit / approve / verify all produce audit rows', async ({ request }) => {
    test.setTimeout(90_000);
    const ceo = await apiLogin(request, 'ceo@pouchcare.com');
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const dev = await apiLogin(request, 'dev1@pouchcare.com');
    const ceoApi = authed(request, ceo.accessToken);
    const opsApi = authed(request, ops.accessToken);
    const devApi = authed(request, dev.accessToken);

    const task = await createTask(opsApi, { assignedMemberId: dev.user.id });
    await devApi.post(`/tasks/${task.id}/submit`, { staffSubmissionNote: 'Done' });
    await opsApi.post(`/tasks/${task.id}/approve`, { note: 'LGTM' });
    await ceoApi.post(`/tasks/${task.id}/verify`, {});

    // CEO reads audit log filtered to Task entries
    const auditRes = await ceoApi.get('/admin/audit', { resourceKind: 'Task', limit: 100 });
    expect(auditRes.ok()).toBe(true);
    const entries: { resourceId: string; action: string }[] = (await auditRes.json()).data ?? [];
    const actions = entries
      .filter((e) => e.resourceId === task.id)
      .map((e) => e.action);

    expect(actions).toContain('task.create');
    expect(actions).toContain('task.submit');
    expect(actions).toContain('task.approve');
    expect(actions).toContain('task.verify');
  });
});

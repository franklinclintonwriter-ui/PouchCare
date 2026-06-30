import { test, expect } from '@playwright/test';
import { apiLogin, authed } from './helpers/staffAuth';

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

// ─── Task CRUD ───────────────────────────────────────────────────────────────

test.describe('Task CRUD', () => {
  test('manager can create, read and update a task', async ({ request }) => {
    test.setTimeout(60_000);
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const api = authed(request, ops.accessToken);

    // CREATE
    const task = await createTask(api, { notes: 'e2e note' });
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

    // LIST includes the task
    const listRes = await api.get('/tasks', { limit: 100 });
    expect(listRes.ok()).toBe(true);
    const tasks = (await listRes.json()).data ?? [];
    expect(tasks.map((t: { id: string }) => t.id)).toContain(task.id);
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

    const devTask = await createTask(opsApi, {
      title: `Mine-dev ${Date.now()}`,
      assignedMemberId: dev.user.id,
    });

    // dev's mine=true includes their task
    const devMineRes = await devApi.get('/tasks', { mine: 'true', limit: 100 });
    expect(devMineRes.ok()).toBe(true);
    const devTasks = (await devMineRes.json()).data ?? [];
    expect(devTasks.map((t: { id: string }) => t.id)).toContain(devTask.id);

    // ops' mine=true list does NOT contain dev's task
    const opsMineRes = await opsApi.get('/tasks', { mine: 'true', limit: 100 });
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

    const devTask = await createTask(opsApi, {
      title: `Staff-filter ${Date.now()}`,
      assignedMemberId: dev.user.id,
    });

    // dev sees own task in list
    const devList = await devApi.get('/tasks', { limit: 100 });
    expect(devList.ok()).toBe(true);
    expect((await devList.json()).data.map((t: { id: string }) => t.id)).toContain(devTask.id);

    // content does NOT see dev's task in list
    const contentList = await contentApi.get('/tasks', { limit: 100 });
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

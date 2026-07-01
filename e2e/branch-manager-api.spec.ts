import { test, expect } from '@playwright/test';
import { apiLogin, authed } from './helpers/staffAuth';

test.describe.configure({ mode: 'serial' });

async function getOutsideBranchMember(
  branchApi: ReturnType<typeof authed>,
  ceoApi: ReturnType<typeof authed>,
) {
  const branchRes = await branchApi.get('/staff/members', { limit: 200 });
  expect(branchRes.ok()).toBe(true);
  const branchMembers = (await branchRes.json()).data ?? [];
  const branchIds = new Set(branchMembers.map((m: { id: string }) => m.id));

  const allRes = await ceoApi.get('/staff/members', { limit: 500 });
  expect(allRes.ok()).toBe(true);
  const allMembers = (await allRes.json()).data ?? [];

  const outsider = allMembers.find(
    (m: { id: string; email?: string; branch?: string | null }) =>
      Boolean(m.email) && !branchIds.has(m.id),
  );

  expect(outsider).toBeTruthy();
  return outsider as { id: string; email: string };
}

async function getOwnBranchMember(
  branchApi: ReturnType<typeof authed>,
  branchUserId: string,
) {
  const membersRes = await branchApi.get('/staff/members', { limit: 200 });
  expect(membersRes.ok()).toBe(true);
  const members = (await membersRes.json()).data ?? [];

  const own = members.find(
    (m: { id: string; systemRole?: string }) => m.id !== branchUserId && m.systemRole !== 'BRANCH_MANAGER',
  );
  expect(own).toBeTruthy();
  return own as { id: string };
}

async function createTask(
  api: ReturnType<typeof authed>,
  title: string,
  assignedMemberId: string,
) {
  const res = await api.post('/tasks', {
    title,
    priority: 'MEDIUM',
    assignedMemberId,
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return (body.data ?? body) as { id: string };
}

test.describe('Branch manager API endpoint coverage', () => {
  test('staff and HR-style branch-scoped endpoints are enforced', async ({ request }) => {
    test.setTimeout(90_000);

    const branch = await apiLogin(request, 'branch@pouchcare.com');
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const branchApi = authed(request, branch.accessToken);
    const opsApi = authed(request, ops.accessToken);

    const membersRes = await branchApi.get('/staff/members', { limit: 100 });
    expect(membersRes.ok()).toBe(true);
    const members = (await membersRes.json()).data ?? [];
    expect(members.length).toBeGreaterThan(0);
    expect(members.map((m: { id: string }) => m.id)).not.toContain(ops.user.id);

    const memberDetailRes = await branchApi.get(`/staff/members/${ops.user.id}`);
    expect(memberDetailRes.status()).toBe(404);

    const attendanceRes = await branchApi.get('/attendance', { memberId: ops.user.id });
    expect(attendanceRes.status()).toBe(403);

    const leaveCreateRes = await opsApi.post('/leave/apply', {
      leaveType: 'ANNUAL',
      startDate: '2026-12-01',
      endDate: '2026-12-01',
      reason: 'Branch scope endpoint test',
    });
    expect(leaveCreateRes.status()).toBe(201);
    const leaveId = ((await leaveCreateRes.json()).data ?? {}).id;
    expect(typeof leaveId).toBe('string');

    const leaveDetailRes = await branchApi.get(`/leave/${leaveId}`);
    expect(leaveDetailRes.status()).toBe(404);

    const payrollRes = await branchApi.get('/payroll', { staffMemberId: ops.user.id });
    expect(payrollRes.status()).toBe(403);
  });

  test('task endpoints enforce branch scope for branch manager', async ({ request }) => {
    test.setTimeout(90_000);

    const ceo = await apiLogin(request, 'ceo@pouchcare.com');
    const branch = await apiLogin(request, 'branch@pouchcare.com');
    const ceoApi = authed(request, ceo.accessToken);
    const branchApi = authed(request, branch.accessToken);

    const metaRes = await branchApi.get('/tasks/meta');
    expect(metaRes.ok()).toBe(true);

    const ownMember = await getOwnBranchMember(branchApi, branch.user.id);
    const outsider = await getOutsideBranchMember(branchApi, ceoApi);

    const ownTask = await createTask(
      ceoApi,
      `Branch-endpoint-own ${Date.now()}`,
      ownMember.id,
    );
    const crossTask = await createTask(
      ceoApi,
      `Branch-endpoint-cross ${Date.now()}`,
      outsider.id,
    );

    const listRes = await branchApi.get('/tasks', { limit: 200, q: 'Branch-endpoint' });
    expect(listRes.ok()).toBe(true);
    const listIds = ((await listRes.json()).data ?? []).map((t: { id: string }) => t.id);
    expect(listIds).toContain(ownTask.id);
    expect(listIds).not.toContain(crossTask.id);

    const detailOwnRes = await branchApi.get(`/tasks/${ownTask.id}`);
    expect(detailOwnRes.ok()).toBe(true);

    const detailCrossRes = await branchApi.get(`/tasks/${crossTask.id}`);
    expect(detailCrossRes.status()).toBe(404);

    const updateCrossRes = await branchApi.put(`/tasks/${crossTask.id}`, { notes: 'deny cross branch update' });
    expect(updateCrossRes.status()).toBe(403);

    const commentsCrossRes = await branchApi.get(`/tasks/${crossTask.id}/comments`);
    expect(commentsCrossRes.status()).toBe(404);
  });
});

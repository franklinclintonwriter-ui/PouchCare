import { test, expect } from '@playwright/test';
import { apiLogin, authed, staffLogin } from './helpers/staffAuth';

test.describe('Management RBAC', () => {
  test('CEO can open role permissions', async ({ page }) => {
    test.setTimeout(60_000);
    await staffLogin(page, 'ceo@pouchcare.com', 'Password123!');
    await page.goto('/settings/role-permissions');
    await expect(page.getByRole('heading', { name: /management role access/i })).toBeVisible();
  });

  test('Staff user sees access denied on payroll when not allowed', async ({ page }) => {
    test.setTimeout(60_000);
    await staffLogin(page, 'dev1@pouchcare.com', 'Password123!');
    await page.goto('/payroll');
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible({ timeout: 15_000 });
  });

  test('Ops user can open payroll', async ({ page }) => {
    test.setTimeout(60_000);
    await staffLogin(page, 'ops@pouchcare.com', 'Password123!');
    await page.goto('/payroll');
    await expect(page).toHaveURL(/\/payroll$/);
    await expect(page.getByRole('heading', { name: /access denied/i })).toHaveCount(0);
    await expect(page.getByText('Total Payroll')).toBeVisible({ timeout: 20_000 });
  });

  test('Branch manager cannot read another branch or global staff records', async ({ request }) => {
    test.setTimeout(60_000);

    const branch = await apiLogin(request, 'branch@pouchcare.com');
    const ops = await apiLogin(request, 'ops@pouchcare.com');
    const branchApi = authed(request, branch.accessToken);
    const opsApi = authed(request, ops.accessToken);

    const membersRes = await branchApi.get('/staff/members', { limit: 100 });
    expect(membersRes.ok()).toBe(true);
    const membersBody = await membersRes.json();
    const members = membersBody.data ?? [];
    expect(members.length).toBeGreaterThan(0);
    expect(members.map((member: { id: string }) => member.id)).not.toContain(ops.user.id);
    expect(members.map((member: { branch?: string | null }) => member.branch)).not.toContain('Company — Global');

    const memberDetailRes = await branchApi.get(`/staff/members/${ops.user.id}`);
    expect(memberDetailRes.status()).toBe(404);

    const attendanceRes = await branchApi.get('/attendance', { memberId: ops.user.id });
    expect(attendanceRes.status()).toBe(403);

    const leaveCreateRes = await opsApi.post('/leave/apply', {
      leaveType: 'ANNUAL',
      startDate: '2026-12-01',
      endDate: '2026-12-01',
      reason: 'Phase-2 branch-scope regression test',
    });
    expect(leaveCreateRes.status()).toBe(201);
    const leaveBody = await leaveCreateRes.json();
    const leaveId = leaveBody.data?.id;
    expect(typeof leaveId).toBe('string');

    const leaveDetailRes = await branchApi.get(`/leave/${leaveId}`);
    expect(leaveDetailRes.status()).toBe(404);

    const payrollRes = await branchApi.get('/payroll', { staffMemberId: ops.user.id });
    expect(payrollRes.status()).toBe(403);
  });
});

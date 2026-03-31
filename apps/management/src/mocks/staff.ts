import type { StaffMember, Task, Project, AttendanceRecord, LeaveRequest, PayrollEntry, PerformanceReview, DailyReport } from '@/types/models';
import type { SystemRole, TaskStatus, Priority, AttendanceStatus, WorkType, LeaveType, LeaveStatus, ProjectStatus, ApprovalStatus } from '@/types/enums';
import { fakeId, fakeName, fakeEmail, fakePhone, randomFrom, randomInt, randomFloat, fakeDateRecent, fakeDateFuture, fakeDatePast, fakeTime, departments, branches } from './generators';

const roles: SystemRole[] = ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER', 'BRANCH_MANAGER', 'STAFF', 'STAFF', 'STAFF', 'STAFF', 'INTERN'];

export const mockStaff: StaffMember[] = Array.from({ length: 18 }, () => {
  const name = fakeName();
  return {
    id: fakeId(), memberId: `PC-${randomInt(1000, 9999)}`, name, email: fakeEmail(name),
    systemRole: randomFrom(roles), branch: randomFrom(branches), phone: fakePhone(),
    department: randomFrom(departments), joinDate: fakeDatePast(24),
    salary: randomInt(3, 15) * 10000, isActive: Math.random() > 0.1,
  };
});

const taskStatuses: TaskStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE'];
const priorities: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const approvalStatuses: ApprovalStatus[] = ['WAITING', 'SUBMITTED', 'APPROVED_MGR', 'REJECTED_MGR', 'ESCALATED', 'VERIFIED'];
const taskTitles = [
  'Fix responsive layout on dashboard', 'Update API documentation', 'Implement payment gateway',
  'Design email templates', 'Setup CI/CD pipeline', 'Optimize database queries',
  'Create user onboarding flow', 'Build notification system', 'Refactor auth module',
  'Add export to CSV feature', 'Implement search functionality', 'Setup monitoring alerts',
  'Create analytics dashboard', 'Fix login page bugs', 'Update security policies',
  'Design landing page', 'Build reporting module', 'Implement file upload',
  'Add multi-language support', 'Create admin panel', 'Setup backup system',
  'Optimize image loading', 'Build chat feature', 'Implement caching layer',
  'Create invoice generator', 'Design mobile app UI', 'Build REST API endpoints',
  'Setup load balancer', 'Implement rate limiting', 'Create email service',
  'Build project templates', 'Add dark mode support', 'Fix broken links',
  'Update SSL certificates', 'Build referral system', 'Create payment reports',
  'Implement 2FA', 'Design error pages', 'Build sitemap generator',
  'Optimize SEO meta tags', 'Create automated tests', 'Setup staging environment',
];

export const mockTasks: Task[] = Array.from({ length: 42 }, (_, i) => {
  const assignee = randomFrom(mockStaff);
  return {
    id: fakeId(), title: taskTitles[i % taskTitles.length],
    description: 'Implementation details and requirements for this task.',
    projectId: `proj_${randomInt(1, 10)}`, projectName: `Project ${randomFrom(['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega'])}`,
    assigneeId: assignee.id, assigneeName: assignee.name, assigneeAvatar: assignee.avatarUrl,
    status: randomFrom(taskStatuses), approvalStatus: randomFrom(approvalStatuses),
    priority: randomFrom(priorities), dueDate: Math.random() > 0.5 ? fakeDateFuture(30) : fakeDateRecent(10),
    rating: Math.random() > 0.5 ? randomInt(1, 5) : undefined,
    tags: [randomFrom(['frontend', 'backend', 'design', 'devops', 'security'])],
    createdAt: fakeDatePast(3),
  };
});

const projectStatuses: ProjectStatus[] = ['PENDING', 'IN_PROGRESS', 'REVIEW', 'DELIVERED', 'ON_HOLD', 'CANCELLED'];
const projectNames = [
  'PouchCare Redesign', 'Client Portal V2', 'Mobile App Launch', 'API Gateway Migration',
  'SEO Dashboard', 'CRM Integration', 'E-commerce Platform', 'Analytics Engine',
  'Payment System Upgrade', 'Marketing Automation', 'Support Ticketing V3', 'Data Pipeline',
];

export const mockProjects: Project[] = projectNames.map((name) => {
  const team = Array.from({ length: randomInt(2, 5) }, () => randomFrom(mockStaff));
  const budget = randomInt(5, 50) * 1000;
  return {
    id: fakeId(), name, clientName: randomFrom(['TechVista', 'CloudNine', 'DataPeak', 'WebForge', 'PixelCraft']),
    description: `Full development and delivery of ${name}.`,
    status: randomFrom(projectStatuses), progress: randomInt(0, 100),
    budget, spent: randomInt(0, budget),
    teamIds: team.map(t => t.id),
    teamMembers: team.map(t => ({ id: t.id, name: t.name, avatarUrl: t.avatarUrl })),
    startDate: fakeDatePast(6), dueDate: fakeDateFuture(90), createdAt: fakeDatePast(6),
  };
});

const attStatuses: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'REMOTE'];
const workTypes: WorkType[] = ['OFFICE', 'REMOTE', 'FIELD', 'LEAVE', 'HOLIDAY'];

export const mockAttendance: AttendanceRecord[] = mockStaff.slice(0, 12).flatMap((s) =>
  Array.from({ length: 22 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    const st = randomFrom(attStatuses);
    return {
      id: fakeId(), staffId: s.id, staffName: s.name, avatarUrl: s.avatarUrl,
      date: d.toISOString().split('T')[0],
      checkIn: st !== 'ABSENT' ? fakeTime() : '', checkOut: st !== 'ABSENT' ? fakeTime() : '',
      status: st, workType: st === 'ABSENT' ? 'LEAVE' as WorkType : randomFrom(workTypes.slice(0, 3)),
      hours: st === 'ABSENT' ? 0 : st === 'HALF_DAY' ? 4 : randomFloat(6, 9, 1),
    };
  })
);

const leaveTypes: LeaveType[] = ['ANNUAL', 'SICK', 'EMERGENCY', 'MATERNITY', 'PATERNITY', 'UNPAID'];
const leaveStatuses: LeaveStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export const mockLeave: LeaveRequest[] = Array.from({ length: 18 }, () => {
  const s = randomFrom(mockStaff);
  const days = randomInt(1, 10);
  return {
    id: fakeId(), staffId: s.id, staffName: s.name, avatarUrl: s.avatarUrl,
    type: randomFrom(leaveTypes), status: randomFrom(leaveStatuses),
    startDate: fakeDateRecent(30), endDate: fakeDateFuture(10), days,
    reason: 'Personal/medical reasons.', approvedBy: randomFrom(mockStaff).name,
    createdAt: fakeDateRecent(30),
  };
});

export const mockPayroll: PayrollEntry[] = mockStaff.map((s) => {
  const base = s.salary / 12;
  const bonus = randomInt(0, 5) * 1000;
  const deductions = randomInt(500, 3000);
  return {
    id: fakeId(), staffId: s.id, staffName: s.name, role: s.systemRole,
    branch: s.branch, month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    baseSalary: Math.round(base), bonus, deductions,
    netPay: Math.round(base + bonus - deductions),
    status: randomFrom(['UNPAID', 'PAID', 'PAID', 'PAID'] as const),
  };
});

export const mockPerformance: PerformanceReview[] = mockStaff.slice(0, 14).map((s) => {
  const scores = { tasks: randomInt(50, 100), attendance: randomInt(60, 100), quality: randomInt(50, 100), initiative: randomInt(40, 100) };
  return {
    id: fakeId(), staffId: s.id, staffName: s.name, avatarUrl: s.avatarUrl,
    period: `Q${randomInt(1, 4)} ${new Date().getFullYear()}`,
    scores, overallScore: Math.round((scores.tasks + scores.attendance + scores.quality + scores.initiative) / 4),
    trend: randomFloat(-10, 15, 1), comments: 'Consistent performance across all metrics.',
  };
});

const moods: ('great' | 'good' | 'okay' | 'bad')[] = ['great', 'good', 'okay', 'bad'];
export const mockDailyReports: DailyReport[] = Array.from({ length: 25 }, () => {
  const s = randomFrom(mockStaff);
  return {
    id: fakeId(), staffId: s.id, staffName: s.name, avatarUrl: s.avatarUrl,
    date: fakeDateRecent(14), tasksCompleted: randomInt(1, 8), hoursWorked: randomFloat(4, 9, 1),
    notes: randomFrom(['Completed all assigned tasks.', 'Worked on API integration.', 'Bug fixes and testing.', 'Client meetings and planning.', 'Code review and deployment.']),
    mood: randomFrom(moods), status: randomFrom(approvalStatuses),
  };
});

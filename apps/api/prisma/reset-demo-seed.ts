/**
 * Wipes all application data from the public schema (keeps _prisma_migrations),
 * then seeds branches, staff accounts, and ~5 days of demo activity:
 * attendance, daily reports, tasks, performance ratings, tool runs, exchange rate, role permissions.
 *
 * Run: npx tsx prisma/reset-demo-seed.ts
 * Or:  npm run db:reset-demo
 */
import "dotenv/config";
import {
  PrismaClient,
  SystemRole,
  TaskStatus,
  ApprovalStatus,
  Priority,
  AttendanceStatus,
  WorkType,
  ProjectStatus,
  PaymentStatus,
  ToolRunType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const HASH = bcrypt.hashSync("Password123!", 10);

const DEMO_DAYS = 5;

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randf = (min: number, max: number) => min + Math.random() * (max - min);
const randint = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/** Local calendar day at midday (stable for @db.Date) */
function calendarDay(daysAgoFromToday: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgoFromToday);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function truncatePublicTables(): Promise<void> {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`,
  )) as { tablename: string }[];
  if (!rows.length) {
    console.log("ℹ️ No public tables to truncate");
    return;
  }
  const list = rows
    .map((r) => `"${String(r.tablename).replace(/"/g, '""')}"`)
    .join(", ");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`,
  );
  console.log(`✅ Truncated ${rows.length} public tables`);
}

async function seedBranches(): Promise<void> {
  const data = [
    {
      name: "Dubai HQ",
      country: "UAE",
      city: "Dubai",
      type: "HQ",
      status: "Active",
      branchManager: "Abdullah Al Mamun",
      staffCount: 2,
    },
    {
      name: "Bangladesh HQ",
      country: "Bangladesh",
      city: "Chittagong",
      type: "HQ",
      status: "Active",
      branchManager: "Md. Habibullah",
      staffCount: 4,
    },
    {
      name: "Dhaka",
      country: "Bangladesh",
      city: "Dhaka",
      type: "Regional",
      status: "Active",
      branchManager: "Zihadduzzaman",
      staffCount: 8,
    },
    {
      name: "London",
      country: "UK",
      city: "London",
      type: "Sales",
      status: "Active",
      branchManager: "",
      staffCount: 1,
    },
  ];
  for (const b of data) {
    await prisma.branch.create({ data: b });
  }
  console.log("✅ Branches seeded");
}

const MEMBERS: Array<{
  email: string;
  name: string;
  role: SystemRole;
  branch: string;
  jobRole: string;
  skill: string;
  level: string;
  exp: number;
  salary: number | null;
  join: Date;
}> = [
  /** CEO — Prisma role CEO */
  {
    email: "ceo@pouchcare.com",
    name: "Abdullah Al Mamun",
    role: SystemRole.CEO,
    branch: "Dubai HQ",
    jobRole: "Chief Executive Officer",
    skill: "Strategy & Growth",
    level: "Expert",
    exp: 10,
    salary: null,
    join: new Date("2016-01-01"),
  },
  /** Managing Director — Co-MD in schema */
  {
    email: "comd@pouchcare.com",
    name: "Md Oliullah",
    role: SystemRole.CO_MD,
    branch: "Bangladesh HQ",
    jobRole: "Managing Director",
    skill: "On-Page SEO",
    level: "Expert",
    exp: 10,
    salary: null,
    join: new Date("2016-01-01"),
  },
  {
    email: "ops@pouchcare.com",
    name: "Md. Habibullah",
    role: SystemRole.OP_MANAGER,
    branch: "Bangladesh HQ",
    jobRole: "Operations Manager",
    skill: "Operations & Delivery",
    level: "Expert",
    exp: 6,
    salary: 2500,
    join: new Date("2019-03-01"),
  },
  /** Branch manager — Dhaka; future staff under this branch sit here */
  {
    email: "branch@pouchcare.com",
    name: "Zihadduzzaman",
    role: SystemRole.BRANCH_MANAGER,
    branch: "Dhaka",
    jobRole: "Branch Manager — Dhaka",
    skill: "Client Management",
    level: "Advanced",
    exp: 4,
    salary: 2000,
    join: new Date("2020-07-01"),
  },
];

async function seedStaff(): Promise<Record<string, string>> {
  const created: Record<string, string> = {};
  for (const m of MEMBERS) {
    const sm = await prisma.staffMember.create({
      data: {
        name: m.name,
        email: m.email,
        passwordHash: HASH,
        systemRole: m.role,
        branch: m.branch,
        jobRole: m.jobRole,
        primarySkill: m.skill,
        skillLevel: m.level,
        yearsExperience: m.exp,
        employmentType: "Full-Time",
        salary: m.salary ?? undefined,
        status: "Active",
        joinDate: m.join,
        phone: "+880-1700-000000",
        preferredCurrency: "BDT",
        performanceScore: randf(3.6, 4.7),
        ceoPerformanceRating: randf(3.8, 4.9),
        tasksAssigned: 0,
        tasksCompleted: 0,
        totalTasksRated: 0,
        averageTaskRating: randf(3.9, 4.8),
      },
    });
    created[m.email] = sm.id;
  }
  console.log("✅ Staff members seeded");
  return created;
}

async function seedExchangeRate(): Promise<void> {
  await prisma.exchangeRate.create({
    data: {
      usdToBdt: 124,
      usdToAed: 3.67,
      bdtToAed: 0.0296,
      effectiveDate: calendarDay(1),
    },
  });
  console.log("✅ Exchange rate seeded");
}

async function seedRolePermissions(): Promise<void> {
  const keys = [
    "dashboard.view",
    "staff.manage",
    "finance.access",
    "crm.manage",
    "assets.manage",
    "tools.run",
    "plugins.manage",
    "portal.manage",
    "hr.performance",
  ];
  const roles = [
    SystemRole.CEO,
    SystemRole.CO_MD,
    SystemRole.OP_MANAGER,
    SystemRole.HR_MANAGER,
    SystemRole.BRANCH_MANAGER,
  ];
  for (const role of roles) {
    for (const key of keys) {
      const allowed = role === SystemRole.CEO ? true : Math.random() < 0.75;
      await prisma.rolePermission.create({
        data: { role, key, allowed },
      });
    }
  }
  console.log("✅ Role permissions seeded");
}

async function seedProjects(
  staffIds: Record<string, string>,
): Promise<string[]> {
  const p1 = await prisma.project.create({
    data: {
      name: "Demo Client — SEO Retainer Q2",
      status: ProjectStatus.IN_PROGRESS,
      approvalStatus: ApprovalStatus.APPROVED_MGR,
      priority: Priority.HIGH,
      projectType: "Retainer",
      serviceType: "SEO",
      paymentStatus: PaymentStatus.PARTIAL,
      clientName: "Demo Commerce Ltd",
      clientEmail: "ops@demo-client.test",
      assignedTo: staffIds["ops@pouchcare.com"],
      assignedBranch: "Bangladesh HQ",
      startDate: calendarDay(14),
      deadline: calendarDay(-30),
      price: 4500,
      priceBdt: 558000,
      paidAmount: 2000,
      progress: 55,
      estimatedHours: 120,
      actualHours: 48,
    },
  });
  const p2 = await prisma.project.create({
    data: {
      name: "Landing refresh — Brand X",
      status: ProjectStatus.REVIEW,
      approvalStatus: ApprovalStatus.SUBMITTED,
      priority: Priority.MEDIUM,
      projectType: "One-Time",
      serviceType: "Web",
      paymentStatus: PaymentStatus.UNPAID,
      clientName: "Brand X GmbH",
      assignedTo: staffIds["branch@pouchcare.com"],
      assignedBranch: "Dhaka",
      startDate: calendarDay(7),
      deadline: calendarDay(-7),
      price: 2200,
      progress: 80,
      estimatedHours: 40,
      actualHours: 32,
    },
  });
  console.log("✅ Demo projects seeded");
  return [p1.id, p2.id];
}

const TASK_TITLE_POOL = [
  "Backlink outreach batch — week",
  "On-page fixes for priority URLs",
  "Content outline + brief for client blog",
  "Technical crawl review (staging)",
  "Design social asset set (×4)",
  "WP deploy checklist & smoke test",
  "Keyword gap analysis export",
  "Internal linking recommendations",
  "Client status email + Loom recap",
  "Sprint planning notes & estimates",
];

const STATUSES: TaskStatus[] = [
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.DONE,
  TaskStatus.NOT_STARTED,
];

/** Manager line: CEO ↔ MD (Co-MD); Ops reports to CEO; BM reports to Ops */
function taskManagerId(
  m: (typeof MEMBERS)[number],
  staffIds: Record<string, string>,
): string {
  switch (m.role) {
    case SystemRole.CEO:
      return staffIds["comd@pouchcare.com"];
    case SystemRole.CO_MD:
      return staffIds["ceo@pouchcare.com"];
    case SystemRole.OP_MANAGER:
      return staffIds["ceo@pouchcare.com"];
    case SystemRole.BRANCH_MANAGER:
      return staffIds["ops@pouchcare.com"];
    default:
      return staffIds["ops@pouchcare.com"];
  }
}

async function seedTasksForAllStaff(
  staffIds: Record<string, string>,
  projectIds: string[],
): Promise<void> {
  const opsId = staffIds["ops@pouchcare.com"];
  const ceoId = staffIds["ceo@pouchcare.com"];
  let t = 0;
  for (const m of MEMBERS) {
    const id = staffIds[m.email];
    const mgr = taskManagerId(m, staffIds);
    for (let k = 0; k < 2; k++) {
      const title = `${pick(TASK_TITLE_POOL)} [${m.name.split(" ")[0]}]`;
      const status = pick(STATUSES);
      const progress =
        status === TaskStatus.DONE
          ? 100
          : status === TaskStatus.REVIEW
            ? 90
            : randint(25, 75);
      await prisma.task.create({
        data: {
          title,
          status,
          approvalStatus:
            status === TaskStatus.DONE
              ? ApprovalStatus.VERIFIED
              : ApprovalStatus.WAITING,
          priority: pick([
            Priority.MEDIUM,
            Priority.HIGH,
            Priority.LOW,
          ]),
          category: pick(["SEO", "Content", "Design", "Dev", "Ops"]),
          createdByRole: pick(["CEO", "OP_MANAGER", "BRANCH_MANAGER"]),
          assignedMemberId: id,
          assignedManagerId: mgr,
          assignedBranch: m.branch,
          relatedProjectId: pick(projectIds),
          estimatedHours: randf(2, 16),
          actualHours:
            status === TaskStatus.DONE || status === TaskStatus.REVIEW
              ? randf(2, 12)
              : null,
          deadline: calendarDay(-randint(0, 10)),
          progress,
          startDate: calendarDay(randint(2, 8)),
          completedDate:
            status === TaskStatus.DONE ? calendarDay(randint(1, 4)) : null,
          ceoWorkRating:
            status === TaskStatus.DONE ? randf(4.0, 5.0) : null,
          ceoVerified: status === TaskStatus.DONE && Math.random() > 0.4,
        },
      });
      t++;
    }
  }
  // Extra ops task
  await prisma.task.create({
    data: {
      title: "Weekly operations sync — demo week",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      category: "Ops",
      createdByRole: "CEO",
      assignedMemberId: opsId,
      assignedManagerId: ceoId,
      assignedBranch: "Bangladesh HQ",
      relatedProjectId: projectIds[0],
      estimatedHours: 4,
      progress: 60,
      deadline: calendarDay(-3),
    },
  });
  console.log(`✅ Tasks seeded (${t + 1} total)`);
}

async function refreshStaffTaskStats(): Promise<void> {
  const staffList = await prisma.staffMember.findMany({
    select: { id: true },
  });
  for (const s of staffList) {
    const assigned = await prisma.task.count({
      where: { assignedMemberId: s.id },
    });
    const done = await prisma.task.count({
      where: { assignedMemberId: s.id, status: TaskStatus.DONE },
    });
    const rated = await prisma.task.findMany({
      where: {
        assignedMemberId: s.id,
        ceoWorkRating: { not: null },
      },
      select: { ceoWorkRating: true },
    });
    const avg =
      rated.length > 0
        ? rated.reduce((a, x) => a + (x.ceoWorkRating ?? 0), 0) /
          rated.length
        : null;
    await prisma.staffMember.update({
      where: { id: s.id },
      data: {
        tasksAssigned: assigned,
        tasksCompleted: done,
        totalTasksRated: rated.length,
        averageTaskRating: avg ?? undefined,
        performanceScore: randf(3.7, 4.8),
      },
    });
  }
  console.log("✅ Staff task aggregates updated");
}

async function seedAttendanceDailyReports(
  staffIds: Record<string, string>,
): Promise<void> {
  const moodPool = ["Great", "Good", "Neutral", "Focused"];
  let ar = 0;
  let dr = 0;
  for (const m of MEMBERS) {
    const sid = staffIds[m.email];
    for (let day = 0; day < DEMO_DAYS; day++) {
      const d = calendarDay(day);
      const hours = randf(7.5, 9.25);
      const checkIn = new Date(d);
      checkIn.setHours(8 + randint(0, 1), randint(0, 45), 0, 0);
      const checkOut = new Date(d);
      checkOut.setHours(17 + randint(0, 2), randint(0, 45), 0, 0);

      await prisma.attendance.upsert({
        where: {
          staffMemberId_date: { staffMemberId: sid, date: d },
        },
        update: {},
        create: {
          staffMemberId: sid,
          name: m.name,
          branch: m.branch,
          date: d,
          status: AttendanceStatus.PRESENT,
          workType: pick([WorkType.OFFICE, WorkType.REMOTE]),
          staffSystemRole: m.role,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          hoursWorked: hours,
          overtimeHours: Math.random() > 0.85 ? randf(0.5, 2) : 0,
        },
      });
      ar++;

      await prisma.dailyReport.upsert({
        where: {
          staffMemberId_reportDate: { staffMemberId: sid, reportDate: d },
        },
        update: {},
        create: {
          staffMemberId: sid,
          submitterName: m.name,
          submitterRole: m.jobRole,
          branch: m.branch,
          reportDate: d,
          hoursWorked: hours,
          overtimeHours: 0,
          tasksCompleted: `Demo: completed ${randint(2, 5)} task items; client follow-ups; team sync.`,
          plannedTomorrow: `Demo: continue sprint work; ${pick(["review", "QA", "outreach", "design iteration"])}.`,
          blockers: Math.random() > 0.75 ? "Waiting on client asset" : undefined,
          mood: pick(moodPool),
          status: "Submitted",
        },
      });
      dr++;
    }
  }
  console.log(
    `✅ Attendance (${ar} rows) & daily reports (${dr} rows) — last ${DEMO_DAYS} days`,
  );
}

async function seedPerformanceRatings(
  staffIds: Record<string, string>,
): Promise<void> {
  for (const m of MEMBERS) {
    const overall = randf(3.7, 4.85);
    await prisma.performanceRating.create({
      data: {
        staffMemberId: staffIds[m.email],
        staffName: m.name,
        systemRole: m.role,
        branch: m.branch,
        ratedBy: "Md Oliullah",
        reviewPeriod: "Apr 2026 (demo week)",
        reviewQuarter: "Q2",
        reviewYear: 2026,
        overallRating: overall,
        taskQuality: randf(overall - 0.3, overall + 0.1),
        communication: randf(overall - 0.4, overall + 0.15),
        punctuality: randf(overall - 0.35, overall + 0.1),
        teamwork: randf(overall - 0.3, overall + 0.15),
        notes:
          overall >= 4.5
            ? "Strong week — demo data snapshot."
            : "Solid progress — demo data snapshot.",
      },
    });
  }
  console.log("✅ Performance ratings seeded (all staff)");
}

async function seedToolRuns(staffIds: Record<string, string>): Promise<void> {
  const types = [
    ToolRunType.SERP_TOP_100,
    ToolRunType.DOMAIN_METRICS,
    ToolRunType.KEYWORDS,
  ];
  const emails = MEMBERS.map((m) => m.email);
  for (let i = 0; i < 12; i++) {
    const email = pick(emails);
    const sid = staffIds[email];
    if (!sid) continue;
    const createdAt = calendarDay(randint(0, DEMO_DAYS - 1));
    createdAt.setHours(randint(10, 17), randint(0, 59), 0, 0);
    await prisma.toolRun.create({
      data: {
        staffId: sid,
        toolType: pick(types),
        queryLabel: pick([
          "demo seo agency dubai",
          "pouchcare brand check",
          "client.com backlinks",
        ]),
        meta: { demoSeed: true, dayOffset: randint(0, DEMO_DAYS) },
        createdAt,
      },
    });
  }
  console.log("✅ Tool runs seeded");
}

async function main(): Promise<void> {
  console.log("\n🧨 PouchCare — reset DB + demo seed (last 5 days)\n");
  await truncatePublicTables();
  await seedBranches();
  const staffIds = await seedStaff();
  await seedExchangeRate();
  await seedRolePermissions();
  const projectIds = await seedProjects(staffIds);
  await seedTasksForAllStaff(staffIds, projectIds);
  await refreshStaffTaskStats();
  await seedAttendanceDailyReports(staffIds);
  await seedPerformanceRatings(staffIds);
  await seedToolRuns(staffIds);

  console.log("\n🎉 Demo seed complete.\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  All accounts: Password123!");
  console.log("  ceo@ → Abdullah Al Mamun (CEO) | comd@ → Md Oliullah (MD / Co-MD)");
  console.log("  ops@ → Md. Habibullah (Ops) | branch@ → Zihadduzzaman (Dhaka BM)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

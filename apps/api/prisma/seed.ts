import "dotenv/config";

import {
  PrismaClient,
  SystemRole,
  TaskStatus,
  ApprovalStatus,
  Priority,
  AttendanceStatus,
  WorkType,
  LeaveType,
  LeaveStatus,
  ProjectStatus,
  PaymentStatus,
  LeadStage,
  PortalMemberStatus,
  OrderStatus,
  WalletTxType,
  CommissionStatus,
  PayoutStatus,
  PaymentMethod,
  ToolRunType,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

/** Full client-area test account (see seed footer + portal orders/wallet below). */
const TEST_PORTAL_EMAIL = "Test@pouchcare.com";

const HASH = bcrypt.hashSync("Password123!", 10);
const HASH_TEST_PORTAL = bcrypt.hashSync("Test@123", 10);

function portalPasswordHashForEmail(email: string): string {
  return email === TEST_PORTAL_EMAIL ? HASH_TEST_PORTAL : HASH;
}
const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
const daysFrom = (d: number) => new Date(now.getTime() + d * 86_400_000);
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randint = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (p: number) => Math.random() < p;

/** Core team only — demo/test staff accounts removed */
const STAFF_EMAILS = [
  "ceo@pouchcare.com",
  "comd@pouchcare.com",
  "ops@pouchcare.com",
  "branch@pouchcare.com",
];

const PORTAL_EMAILS = [
  "john@example.com",
  "alice@example.com",
  "michael@example.com",
  "omar@example.com",
  "sofia@example.com",
  TEST_PORTAL_EMAIL,
  "referred.demo@pouchcare.com",
];

// ─────────────────────────────────────────────────────────────────────────────

async function seedBranches() {
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
      staffCount: 2,
    },
  ];
  for (const b of data) {
    await prisma.branch.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    });
  }
  console.log("✅ Branches seeded");
}

async function seedCameras() {
  await prisma.vigiNvrIntegration.deleteMany({});
  await prisma.cameraDevice.deleteMany({});

  const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });
  const locations = [
    "Main Entrance",
    "Reception",
    "Server Room",
    "Office Floor",
    "Parking Lot",
    "Meeting Room A",
    "Warehouse",
    "Fire Exit",
  ];
  const nvrs = [
    "Hikvision DS-9632NI-I8",
    "Dahua NVR5216-4KS2",
    "Axis S3016",
    "Synology NVR1218",
  ];
  const angles = ["Wide 140°", "Standard 90°", "Narrow 60°", "PTZ 360°"];

  let idx = 0;
  for (const b of branches) {
    const count = b.name === "London" ? 2 : b.name === "Dhaka" ? 5 : 4;
    for (let i = 0; i < count; i++) {
      idx++;
      const mod = idx % 5;
      const status =
        mod === 0 ? "offline" : mod === 1 || mod === 2 ? "recording" : "online";
      const lastMotion = status !== "offline" ? daysAgo((idx * 7) % 48) : null;
      await prisma.cameraDevice.create({
        data: {
          branchId: b.id,
          branchName: b.name,
          label: `CAM-${String(i + 1).padStart(2, "0")}`,
          location: locations[(i + idx) % locations.length],
          status,
          resolution: i % 2 === 0 ? "1080p" : "4K",
          fps: [15, 25, 30][idx % 3],
          angle: angles[idx % angles.length],
          hasAudio: idx % 3 === 0,
          hasMotionDetect: true,
          nvrDevice: nvrs[(i + idx) % nvrs.length],
          rtspUrl: `rtsp://nvr.local/${b.id}/stream/${i + 1}`,
          lastMotionAt: lastMotion,
          lastPingAt: status !== "offline" ? now : daysAgo(3),
        },
      });
    }
  }
  console.log("✅ Camera devices seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedStaff() {
  const members = [
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

  const created: Record<string, string> = {};
  for (const m of members) {
    const pwdHash = HASH;
    const sm = await prisma.staffMember.upsert({
      where: { email: m.email },
      update: {
        passwordHash: pwdHash,
      },
      create: {
        name: m.name,
        email: m.email,
        passwordHash: pwdHash,
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
        ceoPerformanceRating: parseFloat(
          (3.5 + Math.random() * 1.5).toFixed(1),
        ),
      },
    });
    created[m.email] = sm.id;
  }
  console.log("✅ Staff members seeded");
  return created;
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedManagedDevices(staffIds: Record<string, string>) {
  const rows = [
    {
      email: "ceo@pouchcare.com",
      deviceName: "CEO-MacBook",
      deviceType: "Laptop",
      os: "macOS",
      ipAddress: "10.10.0.10",
      status: "Active",
      systemRole: "CEO",
      branch: "Dubai HQ",
    },
    {
      email: "comd@pouchcare.com",
      deviceName: "CoMD-ThinkPad",
      deviceType: "Laptop",
      os: "Windows 11",
      ipAddress: "10.10.0.11",
      status: "Active",
      systemRole: "CO_MD",
      branch: "Bangladesh HQ",
    },
    {
      email: "ops@pouchcare.com",
      deviceName: "Ops-MacBook-Pro",
      deviceType: "Laptop",
      os: "macOS",
      ipAddress: "10.10.0.15",
      status: "Active",
      systemRole: "OP_MANAGER",
      branch: "Bangladesh HQ",
    },
    {
      email: "branch@pouchcare.com",
      deviceName: "Dhaka-Desk-01",
      deviceType: "Desktop",
      os: "Windows 11",
      ipAddress: "10.10.2.21",
      status: "Active",
      systemRole: "BRANCH_MANAGER",
      branch: "Dhaka",
    },
  ];

  for (const r of rows) {
    const staffMemberId = staffIds[r.email];
    if (!staffMemberId) continue;

    const exists = await prisma.device.findFirst({
      where: { staffMemberId, deviceName: r.deviceName },
      select: { id: true },
    });

    if (exists) continue;

    await prisma.device.create({
      data: {
        staffMemberId,
        deviceName: r.deviceName,
        deviceType: r.deviceType,
        os: r.os,
        ipAddress: r.ipAddress,
        status: r.status,
        systemRole: r.systemRole,
        branch: r.branch,
        macAddress: `AA:BB:CC:${randint(10, 99)}:${randint(10, 99)}:${randint(10, 99)}`,
        registeredDate: daysAgo(randint(30, 540)),
        lastActive: daysAgo(randint(0, 3)),
        notes: "Seeded managed device",
      },
    });
  }

  console.log("✅ Managed devices seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedServices() {
  const data = [
    {
      name: "On-Page SEO",
      category: "SEO",
      price: 200,
      slug: "on-page-seo",
      icon: "🔍",
      featured: true,
      days: 7,
    },
    {
      name: "Link Building",
      category: "SEO",
      price: 15,
      slug: "link-building",
      icon: "🔗",
      featured: true,
      days: 14,
    },
    {
      name: "Technical SEO",
      category: "SEO",
      price: 300,
      slug: "technical-seo",
      icon: "⚙️",
      featured: false,
      days: 10,
    },
    {
      name: "Local SEO",
      category: "SEO",
      price: 150,
      slug: "local-seo",
      icon: "📍",
      featured: false,
      days: 7,
    },
    {
      name: "E-commerce SEO",
      category: "SEO",
      price: 350,
      slug: "ecommerce-seo",
      icon: "🛒",
      featured: true,
      days: 14,
    },
    {
      name: "Web Development",
      category: "Dev",
      price: 299,
      slug: "web-development",
      icon: "💻",
      featured: true,
      days: 21,
    },
    {
      name: "App Development",
      category: "Dev",
      price: 999,
      slug: "app-development",
      icon: "📱",
      featured: false,
      days: 30,
    },
    {
      name: "Graphic Design",
      category: "Design",
      price: 49,
      slug: "graphic-design",
      icon: "🎨",
      featured: false,
      days: 3,
    },
    {
      name: "Content Writing",
      category: "Content",
      price: 25,
      slug: "content-writing",
      icon: "📝",
      featured: false,
      days: 3,
    },
    {
      name: "Social Media",
      category: "Marketing",
      price: 180,
      slug: "social-media",
      icon: "📲",
      featured: true,
      days: 30,
    },
  ];
  for (const [i, s] of data.entries()) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        name: s.name,
        category: s.category,
        basePriceUsd: s.price,
        slug: s.slug,
        icon: s.icon,
        featured: s.featured,
        turnaroundDays: s.days,
        shortDescription: `Professional ${s.name} service`,
        fullDescription: `We provide top-quality ${s.name} services to help grow your business.`,
        status: "Active",
        displayOrder: i,
      },
    });
  }
  console.log("✅ Services seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedBacklinkPackages() {
  const data = [
    {
      name: "Starter Guest Post",
      type: "Guest Post",
      da: "DA 20-30",
      ppl: 15,
      x10: 130,
      x50: 600,
      x100: 1100,
      x1000: 9500,
    },
    {
      name: "Standard Guest Post",
      type: "Guest Post",
      da: "DA 30-40",
      ppl: 30,
      x10: 265,
      x50: 1300,
      x100: 2400,
      x1000: 22000,
      featured: true,
    },
    {
      name: "Premium Guest Post",
      type: "Guest Post",
      da: "DA 50+",
      ppl: 80,
      x10: 720,
      x50: 3600,
      x100: 6800,
      x1000: 65000,
    },
    {
      name: "Niche Edit Starter",
      type: "Niche Edit",
      da: "DA 20-30",
      ppl: 18,
      x10: 160,
      x50: 750,
      x100: 1400,
      x1000: 12000,
    },
    {
      name: "Niche Edit Standard",
      type: "Niche Edit",
      da: "DA 30-40",
      ppl: 25,
      x10: 220,
      x50: 1050,
      x100: 1950,
      x1000: 18000,
    },
    {
      name: "Bulk Mixed",
      type: "Mixed",
      da: "Mixed",
      ppl: 10,
      x10: 88,
      x50: 420,
      x100: 800,
      x1000: 7500,
    },
  ];
  for (const p of data) {
    const exists = await prisma.backlinkPackage.findFirst({
      where: { name: p.name },
    });
    if (!exists) {
      await prisma.backlinkPackage.create({
        data: {
          name: p.name,
          type: p.type,
          daRange: p.da,
          pricePerLink: p.ppl,
          priceX10: p.x10,
          priceX50: p.x50,
          priceX100: p.x100,
          priceX1000: p.x1000,
          turnaroundDays: 14,
          featured: (p as any).featured ?? false,
        },
      });
    }
  }
  console.log("✅ Backlink packages seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedProjects(staffIds: Record<string, string>) {
  const projects = [
    {
      name: "TechFlow Website Revamp",
      status: ProjectStatus.DELIVERED,
      approvalStatus: ApprovalStatus.VERIFIED,
      priority: Priority.HIGH,
      projectType: "Website",
      serviceType: "Web Development",
      paymentStatus: PaymentStatus.PAID,
      clientName: "James Martin",
      clientEmail: "james@techflow.io",
      projectManager: "Md. Habibullah",
      assignedTo: staffIds["branch@pouchcare.com"],
      startDate: daysAgo(60),
      deadline: daysAgo(30),
      price: 1200,
      priceBdt: 148800,
      paidAmount: 1200,
      estimatedHours: 80,
      actualHours: 75,
      progress: 100,
      ceoVerified: true,
      ceoWorkRating: 4.8,
      repeatClient: true,
      invoiceNumber: "INV-2026-001",
    },
    {
      name: "GlobalMart SEO Campaign Q1",
      status: ProjectStatus.IN_PROGRESS,
      approvalStatus: ApprovalStatus.APPROVED_MGR,
      priority: Priority.CRITICAL,
      projectType: "Retainer",
      serviceType: "On-Page SEO",
      paymentStatus: PaymentStatus.PARTIAL,
      clientName: "Sarah Chen",
      clientEmail: "sarah@globalmart.com",
      projectManager: "Abdullah Al Mamun",
      assignedTo: staffIds["branch@pouchcare.com"],
      startDate: daysAgo(30),
      deadline: daysFrom(60),
      price: 2400,
      priceBdt: 297600,
      paidAmount: 1200,
      estimatedHours: 120,
      actualHours: 55,
      progress: 45,
      ceoVerified: false,
      invoiceNumber: "INV-2026-002",
    },
    {
      name: "Bloom Beauty Blog Content",
      status: ProjectStatus.IN_PROGRESS,
      approvalStatus: ApprovalStatus.SUBMITTED,
      priority: Priority.MEDIUM,
      projectType: "One-Time",
      serviceType: "Content Writing",
      paymentStatus: PaymentStatus.PAID,
      clientName: "Emma Wilson",
      clientEmail: "emma@bloombeauty.co",
      projectManager: "Md. Habibullah",
      assignedTo: staffIds["ops@pouchcare.com"],
      startDate: daysAgo(14),
      deadline: daysFrom(14),
      price: 500,
      priceBdt: 62000,
      paidAmount: 500,
      estimatedHours: 40,
      actualHours: 20,
      progress: 50,
    },
    {
      name: "NexaShop Link Building Package",
      status: ProjectStatus.PENDING,
      approvalStatus: ApprovalStatus.WAITING,
      priority: Priority.MEDIUM,
      projectType: "One-Time",
      serviceType: "Link Building",
      paymentStatus: PaymentStatus.UNPAID,
      clientName: "Carlos Rivera",
      clientEmail: "carlos@nexashop.mx",
      assignedTo: staffIds["branch@pouchcare.com"],
      startDate: daysFrom(2),
      deadline: daysFrom(20),
      price: 750,
      priceBdt: 93000,
      estimatedHours: 30,
    },
    {
      name: "ProFit Gym Technical SEO Audit",
      status: ProjectStatus.REVIEW,
      approvalStatus: ApprovalStatus.SUBMITTED,
      priority: Priority.HIGH,
      projectType: "One-Time",
      serviceType: "Technical SEO",
      paymentStatus: PaymentStatus.PAID,
      clientName: "David Kim",
      clientEmail: "david@profitgym.com",
      projectManager: "Md. Habibullah",
      assignedTo: staffIds["branch@pouchcare.com"],
      startDate: daysAgo(10),
      deadline: daysFrom(5),
      price: 350,
      priceBdt: 43400,
      paidAmount: 350,
      estimatedHours: 25,
      actualHours: 22,
      progress: 90,
    },
    {
      name: "StartupXYZ Brand Identity",
      status: ProjectStatus.ON_HOLD,
      approvalStatus: ApprovalStatus.WAITING,
      priority: Priority.LOW,
      projectType: "One-Time",
      serviceType: "Graphic Design",
      paymentStatus: PaymentStatus.PARTIAL,
      clientName: "Priya Sharma",
      clientEmail: "priya@startupxyz.in",
      assignedTo: staffIds["ops@pouchcare.com"],
      startDate: daysAgo(20),
      deadline: daysFrom(10),
      price: 300,
      priceBdt: 37200,
      paidAmount: 150,
      estimatedHours: 20,
      actualHours: 8,
      progress: 40,
    },
  ];

  for (const p of projects) {
    await prisma.project.create({ data: p as any }).catch(() => null);
  }
  console.log("✅ Projects seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedTasks(staffIds: Record<string, string>) {
  const tasks = [
    {
      title: "Build 50 DA30+ backlinks for GlobalMart",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
      category: "SEO",
      createdByRole: "CEO",
      assignedMemberId: staffIds["branch@pouchcare.com"],
      assignedManagerId: staffIds["ops@pouchcare.com"],
      assignedBranch: "Bangladesh HQ",
      estimatedHours: 20,
      deadline: daysFrom(14),
      progress: 40,
      relatedClient: "GlobalMart",
      relatedProject: "GlobalMart SEO Campaign Q1",
    },
    {
      title: "Write 10 blog articles for Bloom Beauty",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      category: "Content",
      createdByRole: "OP_MANAGER",
      assignedMemberId: staffIds["ops@pouchcare.com"],
      assignedManagerId: staffIds["ops@pouchcare.com"],
      assignedBranch: "Dhaka",
      estimatedHours: 15,
      deadline: daysFrom(7),
      progress: 50,
      relatedClient: "Bloom Beauty",
    },
    {
      title: "Technical SEO audit for ProFit Gym",
      status: TaskStatus.REVIEW,
      approvalStatus: ApprovalStatus.SUBMITTED,
      priority: Priority.HIGH,
      category: "SEO",
      assignedMemberId: staffIds["branch@pouchcare.com"],
      assignedManagerId: staffIds["ops@pouchcare.com"],
      assignedBranch: "Bangladesh HQ",
      estimatedHours: 25,
      actualHours: 22,
      deadline: daysFrom(5),
      progress: 90,
      staffSubmissionNote: "Audit complete. Full report attached.",
    },
    {
      title: "Design logo variants for StartupXYZ",
      status: TaskStatus.BLOCKED,
      priority: Priority.LOW,
      category: "Design",
      assignedMemberId: staffIds["ops@pouchcare.com"],
      assignedManagerId: staffIds["branch@pouchcare.com"],
      assignedBranch: "Dhaka",
      estimatedHours: 8,
      deadline: daysFrom(10),
      progress: 40,
      notes: "Waiting for brand guidelines from client",
    },
    {
      title: "Deploy NexaShop WordPress site",
      status: TaskStatus.NOT_STARTED,
      priority: Priority.MEDIUM,
      category: "Dev",
      assignedMemberId: staffIds["branch@pouchcare.com"],
      assignedManagerId: staffIds["ops@pouchcare.com"],
      assignedBranch: "Bangladesh HQ",
      estimatedHours: 12,
      deadline: daysFrom(5),
    },
    {
      title: "Monthly performance report – March 2026",
      status: TaskStatus.DONE,
      approvalStatus: ApprovalStatus.VERIFIED,
      priority: Priority.HIGH,
      category: "Reporting",
      createdByRole: "CEO",
      assignedMemberId: staffIds["ops@pouchcare.com"],
      assignedManagerId: staffIds["ceo@pouchcare.com"],
      assignedBranch: "Bangladesh HQ",
      estimatedHours: 5,
      actualHours: 4,
      startDate: daysAgo(10),
      deadline: daysAgo(3),
      completedDate: daysAgo(3),
      progress: 100,
      ceoVerified: true,
      ceoWorkRating: 4.5,
    },
    {
      title: "Keyword research for E-commerce SEO client",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      category: "SEO",
      assignedMemberId: staffIds["branch@pouchcare.com"],
      assignedManagerId: staffIds["ops@pouchcare.com"],
      assignedBranch: "Bangladesh HQ",
      estimatedHours: 6,
      deadline: daysFrom(3),
      progress: 65,
    },
    {
      title: "Social media content calendar – April",
      status: TaskStatus.NOT_STARTED,
      priority: Priority.LOW,
      category: "Social Media",
      assignedMemberId: staffIds["ops@pouchcare.com"],
      assignedManagerId: staffIds["branch@pouchcare.com"],
      assignedBranch: "Dhaka",
      estimatedHours: 4,
      deadline: daysFrom(7),
    },
  ];

  for (const t of tasks) {
    await prisma.task.create({ data: t as any }).catch(() => null);
  }
  console.log("✅ Tasks seeded");
}

async function seedTaskComments(staffIds: Record<string, string>) {
  const tasks = await prisma.task.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
  });
  if (!tasks.length) {
    console.log("ℹ️ Task comments skipped (no tasks)");
    return;
  }

  const comments = [
    "Started working on this and shared first draft.",
    "Need client confirmation before final submission.",
    "Progress updated with latest findings.",
    "Blocked due to missing access credentials.",
    "Completed and waiting for manager review.",
    "Attached links in task notes for verification.",
  ];

  for (const t of tasks) {
    const count = randint(1, 4);
    for (let i = 0; i < count; i++) {
      const email = pick(STAFF_EMAILS);
      const authorId = staffIds[email];
      if (!authorId) continue;
      await prisma.taskComment
        .create({
          data: {
            taskId: t.id,
            authorId,
            authorName: email.split("@")[0],
            content: pick(comments),
          },
        })
        .catch(() => null);
    }
  }
  console.log("✅ Task comments seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedAttendance(staffIds: Record<string, string>) {
  const staffEmails = [
    "ceo@pouchcare.com",
    "comd@pouchcare.com",
    "ops@pouchcare.com",
    "branch@pouchcare.com",
  ];

  const statuses: AttendanceStatus[] = [
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
    AttendanceStatus.REMOTE,
  ];

  const records = [];
  for (const email of staffEmails) {
    const id = staffIds[email];
    for (let d = 1; d <= 30; d++) {
      const date = daysAgo(d);
      // Skip weekends (Sat=6, Sun=0)
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const checkIn = new Date(date);
      checkIn.setHours(9, Math.floor(Math.random() * 30), 0);
      const checkOut = new Date(date);
      checkOut.setHours(18, Math.floor(Math.random() * 30), 0);
      records.push({
        staffMemberId: id,
        name: email.split("@")[0],
        date: new Date(date.toISOString().split("T")[0]),
        status,
        workType: WorkType.OFFICE,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        hoursWorked: parseFloat((8 + Math.random() * 2).toFixed(1)),
        approvedBy: "Md. Habibullah",
      });
    }
  }

  for (const r of records) {
    await prisma.attendance
      .upsert({
        where: {
          staffMemberId_date: { staffMemberId: r.staffMemberId, date: r.date },
        },
        update: {},
        create: r,
      })
      .catch(() => null);
  }
  console.log(`✅ Attendance seeded (${records.length} records)`);
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedLeaveRequests(staffIds: Record<string, string>) {
  const requests = [
    {
      staffMemberId: staffIds["branch@pouchcare.com"],
      staffName: "Zihadduzzaman",
      leaveType: LeaveType.ANNUAL,
      status: LeaveStatus.APPROVED,
      startDate: daysFrom(10),
      endDate: daysFrom(14),
      totalDays: 5,
      reason: "Family vacation",
      approvedBy: "Md. Habibullah",
    },
    {
      staffMemberId: staffIds["branch@pouchcare.com"],
      staffName: "Zihadduzzaman",
      leaveType: LeaveType.SICK,
      status: LeaveStatus.APPROVED,
      startDate: daysAgo(5),
      endDate: daysAgo(4),
      totalDays: 2,
      reason: "Fever and cold",
      approvedBy: "Md. Habibullah",
    },
    {
      staffMemberId: staffIds["comd@pouchcare.com"],
      staffName: "Md Oliullah",
      leaveType: LeaveType.EMERGENCY,
      status: LeaveStatus.PENDING,
      startDate: daysFrom(2),
      endDate: daysFrom(3),
      totalDays: 2,
      reason: "Family emergency",
    },
    {
      staffMemberId: staffIds["ops@pouchcare.com"],
      staffName: "Md. Habibullah",
      leaveType: LeaveType.ANNUAL,
      status: LeaveStatus.REJECTED,
      startDate: daysFrom(5),
      endDate: daysFrom(7),
      totalDays: 3,
      reason: "Personal travel",
      approvedBy: "Zihadduzzaman",
      notes: "Overlaps with project deadline",
    },
  ];

  for (const r of requests) {
    await prisma.leaveRequest.create({ data: r as any }).catch(() => null);
  }
  console.log("✅ Leave requests seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedDailyReports(staffIds: Record<string, string>) {
  const reports = [
    {
      staffMemberId: staffIds["branch@pouchcare.com"],
      submitterName: "Zihadduzzaman",
      submitterRole: "Branch Manager — Dhaka",
      branch: "Dhaka",
      reportDate: daysAgo(1),
      hoursWorked: 8.5,
      tasksCompleted:
        "Built 8 backlinks for GlobalMart; completed 2 outreach emails",
      plannedTomorrow:
        "Continue link building campaign; review anchor text strategy",
      mood: "Good",
    },
    {
      staffMemberId: staffIds["ops@pouchcare.com"],
      submitterName: "Md. Habibullah",
      submitterRole: "Operations Manager",
      branch: "Bangladesh HQ",
      reportDate: daysAgo(1),
      hoursWorked: 8,
      tasksCompleted:
        "Wrote 2 blog articles for Bloom Beauty; edited 3 previous drafts",
      plannedTomorrow: "Write 2 more articles; keyword research for next batch",
      mood: "Great",
    },
    {
      staffMemberId: staffIds["comd@pouchcare.com"],
      submitterName: "Md Oliullah",
      submitterRole: "Managing Director",
      branch: "Bangladesh HQ",
      reportDate: daysAgo(1),
      hoursWorked: 9,
      tasksCompleted:
        "Completed crawl analysis for ProFit Gym; identified 47 technical issues",
      plannedTomorrow: "Prepare final audit report and recommendations",
      blockers: "Waiting for client to provide Google Search Console access",
      mood: "Neutral",
    },
    {
      staffMemberId: staffIds["branch@pouchcare.com"],
      submitterName: "Zihadduzzaman",
      submitterRole: "Branch Manager — Dhaka",
      branch: "Dhaka",
      reportDate: daysAgo(2),
      hoursWorked: 8,
      tasksCompleted: "Completed outreach to 15 sites; 3 confirmed placements",
      plannedTomorrow:
        "Follow up on pending outreach; start NexaShop keyword research",
      mood: "Good",
    },
  ];

  for (const r of reports) {
    await prisma.dailyReport
      .upsert({
        where: {
          staffMemberId_reportDate: {
            staffMemberId: r.staffMemberId,
            reportDate: r.reportDate,
          },
        },
        update: {},
        create: r as any,
      })
      .catch(() => null);
  }
  console.log("✅ Daily reports seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedPayroll(staffIds: Record<string, string>) {
  const payrollData = [
    {
      email: "ceo@pouchcare.com",
      name: "Abdullah Al Mamun",
      role: "CEO",
      branch: "Dubai HQ",
      base: 0,
    },
    {
      email: "comd@pouchcare.com",
      name: "Md Oliullah",
      role: "CO_MD",
      branch: "Bangladesh HQ",
      base: 0,
    },
    {
      email: "ops@pouchcare.com",
      name: "Md. Habibullah",
      role: "OP_MANAGER",
      branch: "Bangladesh HQ",
      base: 2500,
    },
    {
      email: "branch@pouchcare.com",
      name: "Zihadduzzaman",
      role: "BRANCH_MANAGER",
      branch: "Dhaka",
      base: 2000,
    },
  ];

  const months = [
    { month: "January", year: 2026 },
    { month: "February", year: 2026 },
    { month: "March", year: 2026 },
  ];

  for (const m of months) {
    for (const p of payrollData) {
      const bonus =
        Math.random() > 0.7 ? parseFloat((p.base * 0.1).toFixed(0)) : 0;
      const deductions = Math.random() > 0.8 ? 50 : 0;
      await prisma.payroll
        .upsert({
          where: {
            staffMemberId_month_year: {
              staffMemberId: staffIds[p.email],
              month: m.month,
              year: m.year,
            },
          },
          update: {},
          create: {
            staffMemberId: staffIds[p.email],
            staffName: p.name,
            systemRole: p.role,
            branch: p.branch,
            month: m.month,
            year: m.year,
            baseSalary: p.base,
            bonus,
            deductions,
            netSalary: p.base + bonus - deductions,
            paymentMethod: "Bank Transfer",
            paymentStatus: m.month === "March" ? "Pending" : "Paid",
            paymentDate:
              m.month !== "March"
                ? new Date(
                    `${m.year}-${m.month === "January" ? "01" : "02"}-28`,
                  )
                : undefined,
          },
        })
        .catch(() => null);
    }
  }
  console.log("✅ Payroll seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedPerformanceRatings(staffIds: Record<string, string>) {
  const ratings = [
    {
      email: "ceo@pouchcare.com",
      name: "Abdullah Al Mamun",
      overall: 4.9,
      quality: 4.8,
      comms: 4.9,
      punct: 4.8,
      team: 4.9,
    },
    {
      email: "comd@pouchcare.com",
      name: "Md Oliullah",
      overall: 4.8,
      quality: 4.9,
      comms: 4.7,
      punct: 4.8,
      team: 4.8,
    },
    {
      email: "ops@pouchcare.com",
      name: "Md. Habibullah",
      overall: 4.6,
      quality: 4.7,
      comms: 4.5,
      punct: 4.6,
      team: 4.6,
    },
    {
      email: "branch@pouchcare.com",
      name: "Zihadduzzaman",
      overall: 4.4,
      quality: 4.3,
      comms: 4.5,
      punct: 4.4,
      team: 4.3,
    },
  ];

  for (const r of ratings) {
    await prisma.performanceRating
      .create({
        data: {
          staffMemberId: staffIds[r.email],
          staffName: r.name,
          systemRole: r.email.includes("ceo")
            ? "CEO"
            : r.email.includes("comd")
              ? "CO_MD"
              : r.email.includes("ops")
                ? "OP_MANAGER"
                : "BRANCH_MANAGER",
          ratedBy: "Md Oliullah",
          reviewPeriod: "Q1 2026",
          reviewQuarter: "Q1",
          reviewYear: 2026,
          overallRating: r.overall,
          taskQuality: r.quality,
          communication: r.comms,
          punctuality: r.punct,
          teamwork: r.team,
          notes: `Performance review for Q1 2026. ${r.overall >= 4.5 ? "Excellent performance." : r.overall >= 4.0 ? "Good performance." : "Meets expectations."}`,
        },
      })
      .catch(() => null);
  }
  console.log("✅ Performance ratings seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedCrm(staffIds: Record<string, string>) {
  const leads = [
    {
      company: "TechFlow Agency",
      contactName: "James Martin",
      email: "james@techflow.io",
      stage: LeadStage.WON,
      source: "Referral",
      serviceInterested: "Web Development",
      budgetUsd: 1500,
      estimatedValue: 12000,
      leadScore: 92,
      country: "United Kingdom",
      owner: staffIds["ops@pouchcare.com"],
      convertedToClient: true,
    },
    {
      company: "GlobalMart Inc.",
      contactName: "Sarah Chen",
      email: "sarah@globalmart.com",
      stage: LeadStage.NEGOTIATION,
      source: "LinkedIn",
      serviceInterested: "SEO Retainer",
      budgetUsd: 3000,
      estimatedValue: 36000,
      leadScore: 88,
      country: "United States",
      owner: staffIds["ceo@pouchcare.com"],
    },
    {
      company: "Bloom Beauty",
      contactName: "Emma Wilson",
      email: "emma@bloombeauty.co",
      stage: LeadStage.WON,
      source: "Website",
      serviceInterested: "Content Writing",
      budgetUsd: 500,
      estimatedValue: 6000,
      leadScore: 80,
      country: "Australia",
      convertedToClient: true,
      owner: staffIds["ops@pouchcare.com"],
    },
    {
      company: "NexaShop México",
      contactName: "Carlos Rivera",
      email: "carlos@nexashop.mx",
      stage: LeadStage.QUALIFIED,
      source: "Cold Outreach",
      serviceInterested: "E-commerce SEO",
      budgetUsd: 800,
      estimatedValue: 9600,
      leadScore: 65,
      country: "Mexico",
      owner: staffIds["ops@pouchcare.com"],
    },
    {
      company: "ProFit Gym",
      contactName: "David Kim",
      email: "david@profitgym.com",
      stage: LeadStage.PROPOSAL,
      source: "Google Ads",
      serviceInterested: "Local SEO",
      budgetUsd: 400,
      estimatedValue: 4800,
      leadScore: 70,
      country: "South Korea",
      owner: staffIds["ops@pouchcare.com"],
    },
    {
      company: "StartupXYZ",
      contactName: "Priya Sharma",
      email: "priya@startupxyz.in",
      stage: LeadStage.NEW,
      source: "Facebook",
      serviceInterested: "Graphic Design",
      budgetUsd: 300,
      estimatedValue: 300,
      leadScore: 40,
      country: "India",
      owner: staffIds["branch@pouchcare.com"],
    },
    {
      company: "BrightMind Academy",
      contactName: "Tom Baker",
      email: "tom@brightmind.edu",
      stage: LeadStage.LOST,
      source: "Upwork",
      serviceInterested: "Web Development",
      budgetUsd: 500,
      estimatedValue: 500,
      leadScore: 30,
      country: "Canada",
      lostReason: "Chose a competitor with lower pricing",
      owner: staffIds["ops@pouchcare.com"],
    },
  ];

  for (const l of leads) {
    await prisma.crmLead.create({ data: l as any }).catch(() => null);
  }
  console.log("✅ CRM leads seeded");
}

async function seedSalesOrders() {
  const rows = [
    {
      clientName: "GlobalMart Inc.",
      service: "SEO Retainer",
      status: "Processing",
      paymentStatus: PaymentStatus.PARTIAL,
      amountUsd: 2400,
      assignedTo: "Md. Habibullah",
      branch: "Bangladesh HQ",
      orderDate: daysAgo(28),
      deadline: daysFrom(32),
    },
    {
      clientName: "TechFlow Agency",
      service: "Web Development",
      status: "Delivered",
      paymentStatus: PaymentStatus.PAID,
      amountUsd: 1200,
      assignedTo: "Md. Habibullah",
      branch: "Bangladesh HQ",
      orderDate: daysAgo(58),
      deliveryDate: daysAgo(30),
      deliveryLink: "https://example.com/delivery/techflow",
    },
    {
      clientName: "Bloom Beauty",
      service: "Content Writing",
      status: "In Progress",
      paymentStatus: PaymentStatus.PAID,
      amountUsd: 500,
      assignedTo: "Zihadduzzaman",
      branch: "Dhaka",
      orderDate: daysAgo(14),
      deadline: daysFrom(10),
    },
    {
      clientName: "NexaShop México",
      service: "Link Building",
      status: "New",
      paymentStatus: PaymentStatus.UNPAID,
      amountUsd: 750,
      assignedTo: "Zihadduzzaman",
      branch: "Bangladesh HQ",
      orderDate: daysAgo(2),
      deadline: daysFrom(16),
    },
  ];

  for (const r of rows) {
    await prisma.salesOrder.create({ data: r as any }).catch(() => null);
  }
  console.log("✅ Sales orders seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedFinance() {
  // Invoices
  const invoices = [
    {
      invoiceNumber: "INV-2026-001",
      clientName: "James Martin",
      clientEmail: "james@techflow.io",
      service: "Web Development",
      status: "Paid",
      paymentMethod: "Bank Transfer",
      amountUsd: 1200,
      issueDate: daysAgo(40),
      paidDate: daysAgo(38),
    },
    {
      invoiceNumber: "INV-2026-002",
      clientName: "Sarah Chen",
      clientEmail: "sarah@globalmart.com",
      service: "SEO Retainer",
      status: "Partial",
      paymentMethod: "Payoneer",
      amountUsd: 2400,
      issueDate: daysAgo(30),
      dueDate: daysFrom(30),
    },
    {
      invoiceNumber: "INV-2026-003",
      clientName: "Emma Wilson",
      clientEmail: "emma@bloombeauty.co",
      service: "Content Writing",
      status: "Paid",
      paymentMethod: "PayPal",
      amountUsd: 500,
      issueDate: daysAgo(14),
      paidDate: daysAgo(12),
    },
    {
      invoiceNumber: "INV-2026-004",
      clientName: "David Kim",
      clientEmail: "david@profitgym.com",
      service: "Technical SEO",
      status: "Paid",
      paymentMethod: "Wise",
      amountUsd: 350,
      issueDate: daysAgo(10),
      paidDate: daysAgo(8),
    },
    {
      invoiceNumber: "INV-2026-005",
      clientName: "Carlos Rivera",
      clientEmail: "carlos@nexashop.mx",
      service: "Link Building",
      status: "Draft",
      paymentMethod: undefined,
      amountUsd: 750,
      issueDate: daysAgo(2),
      dueDate: daysFrom(14),
    },
    {
      invoiceNumber: "INV-2025-050",
      clientName: "Various",
      clientEmail: "accounts@pouchcare.com",
      service: "Multiple",
      status: "Paid",
      paymentMethod: "Payoneer",
      amountUsd: 3800,
      issueDate: daysAgo(90),
      paidDate: daysAgo(88),
    },
  ];
  for (const inv of invoices) {
    await prisma.invoice
      .upsert({
        where: { invoiceNumber: inv.invoiceNumber },
        update: {},
        create: { ...inv, amountBdt: inv.amountUsd * 124 } as any,
      })
      .catch(() => null);
  }

  // Expenses
  const expenses = [
    {
      title: "Ahrefs Annual Subscription",
      category: "Software",
      amountUsd: 199,
      paidBy: "Abdullah Al Mamun",
      branch: "Dubai HQ",
      paymentMethod: "Credit Card",
      status: "Approved",
      expenseDate: daysAgo(5),
    },
    {
      title: "Office Rent – Bangladesh HQ",
      category: "Rent",
      amountUsd: 300,
      paidBy: "Md. Habibullah",
      branch: "Bangladesh HQ",
      paymentMethod: "Bank Transfer",
      status: "Approved",
      expenseDate: daysAgo(3),
    },
    {
      title: "Freelancer Content Writers",
      category: "Freelance",
      amountUsd: 120,
      paidBy: "Md. Habibullah",
      branch: "Bangladesh HQ",
      paymentMethod: "Payoneer",
      status: "Approved",
      expenseDate: daysAgo(7),
    },
    {
      title: "Team Dinner – March 2026",
      category: "Team",
      amountUsd: 85,
      paidBy: "Zihadduzzaman",
      branch: "Dhaka",
      paymentMethod: "Cash",
      status: "Approved",
      expenseDate: daysAgo(10),
    },
    {
      title: "Semrush Monthly",
      category: "Software",
      amountUsd: 99,
      paidBy: "Md. Habibullah",
      branch: "Bangladesh HQ",
      paymentMethod: "Credit Card",
      status: "Pending",
      expenseDate: daysAgo(1),
    },
    {
      title: "Laptop Repair – Staff3",
      category: "Equipment",
      amountUsd: 65,
      paidBy: "Md. Habibullah",
      branch: "Bangladesh HQ",
      paymentMethod: "Cash",
      status: "Approved",
      expenseDate: daysAgo(15),
    },
  ];
  for (const e of expenses) {
    await prisma.expense
      .create({ data: { ...e, amountBdt: e.amountUsd * 124 } as any })
      .catch(() => null);
  }

  // Monthly Revenue
  const revenueData = [
    { month: "October", year: 2025, revUsd: 4200, expUsd: 980 },
    { month: "November", year: 2025, revUsd: 5100, expUsd: 1050 },
    { month: "December", year: 2025, revUsd: 6300, expUsd: 1200 },
    { month: "January", year: 2026, revUsd: 5800, expUsd: 1100 },
    { month: "February", year: 2026, revUsd: 7200, expUsd: 1350 },
    { month: "March", year: 2026, revUsd: 6100, expUsd: 1180 },
  ];
  for (const r of revenueData) {
    await prisma.monthlyRevenue
      .upsert({
        where: { month_year: { month: r.month, year: r.year } },
        update: {},
        create: {
          month: r.month,
          year: r.year,
          totalRevenueUsd: r.revUsd,
          totalRevenueBdt: r.revUsd * 124,
          totalExpensesUsd: r.expUsd,
          netProfitUsd: r.revUsd - r.expUsd,
          clientCount: Math.floor(r.revUsd / 500),
          newClients: Math.floor(Math.random() * 4) + 1,
        },
      })
      .catch(() => null);
  }

  // Exchange Rates
  await prisma.exchangeRate
    .create({
      data: {
        usdToBdt: 124,
        usdToAed: 3.67,
        bdtToAed: 0.0296,
        effectiveDate: daysAgo(1),
      },
    })
    .catch(() => null);

  console.log("✅ Finance data seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedAssets() {
  // Domains
  const domains = [
    {
      domainName: "pouchcare.com",
      status: "Active",
      registrar: "Cloudflare",
      expiryDate: daysFrom(365),
      daScore: 32,
      drScore: 28,
      niche: "Agency",
      hostingServer: "Cloudflare",
    },
    {
      domainName: "bloomblog.net",
      status: "Active",
      registrar: "Namecheap",
      expiryDate: daysFrom(180),
      daScore: 18,
      drScore: 15,
      niche: "Beauty",
      hostingServer: "Server-01",
    },
    {
      domainName: "techreviewhub.com",
      status: "Active",
      registrar: "GoDaddy",
      expiryDate: daysFrom(90),
      daScore: 24,
      drScore: 20,
      niche: "Tech",
      hostingServer: "Server-01",
    },
    {
      domainName: "fitnessguide.io",
      status: "Active",
      registrar: "Cloudflare",
      expiryDate: daysFrom(270),
      daScore: 14,
      drScore: 12,
      niche: "Fitness",
      hostingServer: "Server-02",
    },
    {
      domainName: "expiredpbn001.com",
      status: "Expiring Soon",
      registrar: "Namecheap",
      expiryDate: daysFrom(15),
      daScore: 22,
      drScore: 19,
      niche: "General",
      hostingServer: "Server-02",
    },
  ];
  for (const d of domains) {
    await prisma.domain
      .create({
        data: {
          ...d,
          registrationDate: daysAgo(365),
          annualRenewalCost: 12,
        } as any,
      })
      .catch(() => null);
  }

  // Servers
  await prisma.server.upsert({
    where: { name: "Server-01" },
    update: {},
    create: {
      name: "Server-01",
      provider: "Hetzner",
      type: "VPS",
      status: "Active",
      ipAddress: "65.108.0.1",
      location: "Germany",
      os: "Ubuntu 22.04",
      ramGb: 8,
      storageGb: 160,
      monthlyCostUsd: 18,
      renewalDate: daysFrom(15),
    },
  });
  await prisma.server.upsert({
    where: { name: "Server-02" },
    update: {},
    create: {
      name: "Server-02",
      provider: "DigitalOcean",
      type: "VPS",
      status: "Active",
      ipAddress: "159.223.0.1",
      location: "Singapore",
      os: "Ubuntu 22.04",
      ramGb: 4,
      storageGb: 80,
      monthlyCostUsd: 12,
      renewalDate: daysFrom(22),
    },
  });
  await prisma.server.upsert({
    where: { name: "Cloudflare-CDN" },
    update: {},
    create: {
      name: "Cloudflare-CDN",
      provider: "Cloudflare",
      type: "CDN",
      status: "Active",
      location: "Global",
      monthlyCostUsd: 25,
    },
  });

  // Websites
  const websites = [
    {
      name: "PouchCare Main",
      url: "https://pouchcare.com",
      type: "Company",
      platform: "Next.js",
      hostedOn: "Cloudflare",
      domainLinked: "pouchcare.com",
      monthlyTraffic: 1200,
      daScore: 32,
    },
    {
      name: "BloomBlog",
      url: "https://bloomblog.net",
      type: "PBN",
      platform: "WordPress",
      hostedOn: "Server-01",
      domainLinked: "bloomblog.net",
      monthlyTraffic: 850,
      daScore: 18,
    },
    {
      name: "TechReview Hub",
      url: "https://techreviewhub.com",
      type: "PBN",
      platform: "WordPress",
      hostedOn: "Server-01",
      domainLinked: "techreviewhub.com",
      monthlyTraffic: 640,
      daScore: 24,
    },
    {
      name: "FitnessGuide",
      url: "https://fitnessguide.io",
      type: "PBN",
      platform: "WordPress",
      hostedOn: "Server-02",
      domainLinked: "fitnessguide.io",
      monthlyTraffic: 420,
      daScore: 14,
    },
  ];
  for (const w of websites) {
    await prisma.website
      .upsert({
        where: { name: w.name },
        update: {},
        create: {
          ...w,
          status: "Live",
          sslStatus: "Valid",
          lastUpdated: daysAgo(7),
        } as any,
      })
      .catch(() => null);
  }

  console.log("✅ Assets (domains/servers/websites) seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedHR() {
  // Job Positions
  const positions = [
    {
      title: "Senior SEO Specialist",
      department: "SEO",
      branch: "Bangladesh HQ",
      employmentType: "Full-Time",
      salaryMin: 900,
      salaryMax: 1400,
      openings: 2,
      postedDate: daysAgo(14),
      deadline: daysFrom(30),
      jobDescription:
        "Looking for an experienced SEO specialist with 3+ years in link building.",
    },
    {
      title: "Content Writer",
      department: "Content",
      branch: "Dhaka",
      employmentType: "Full-Time",
      salaryMin: 500,
      salaryMax: 800,
      openings: 1,
      postedDate: daysAgo(7),
      deadline: daysFrom(21),
      jobDescription:
        "We need an experienced content writer fluent in English.",
    },
    {
      title: "Web Developer",
      department: "Dev",
      branch: "Bangladesh HQ",
      employmentType: "Full-Time",
      salaryMin: 1000,
      salaryMax: 1800,
      openings: 1,
      postedDate: daysAgo(21),
      deadline: daysFrom(14),
      jobDescription: "Full-stack developer with React and Node.js experience.",
    },
    {
      title: "Graphic Designer",
      department: "Design",
      branch: "Dhaka",
      employmentType: "Part-Time",
      salaryMin: 300,
      salaryMax: 600,
      openings: 1,
      postedDate: daysAgo(5),
      deadline: daysFrom(25),
      jobDescription: "Creative graphic designer with strong portfolio.",
    },
  ];

  const posIds: string[] = [];
  for (const p of positions) {
    const pos = await prisma.jobPosition
      .create({ data: p as any })
      .catch(() => null);
    if (pos) posIds.push(pos.id);
  }

  // Job Applications
  if (posIds.length > 0) {
    const apps = [
      {
        positionId: posIds[0],
        applicantName: "Tariq Hossain",
        email: "tariq.h@gmail.com",
        phone: "+880171",
        status: "Shortlisted",
        source: "LinkedIn",
        experienceYears: 4,
        expectedSalary: 1100,
        appliedDate: daysAgo(10),
      },
      {
        positionId: posIds[0],
        applicantName: "Sumaiya Rahman",
        email: "sumaiya@gmail.com",
        phone: "+880172",
        status: "New",
        source: "Indeed",
        experienceYears: 3,
        expectedSalary: 950,
        appliedDate: daysAgo(5),
      },
      {
        positionId: posIds[1],
        applicantName: "Rina Das",
        email: "rina.d@gmail.com",
        phone: "+880173",
        status: "Interview",
        source: "Website",
        experienceYears: 2,
        expectedSalary: 650,
        appliedDate: daysAgo(4),
        interviewDate: daysFrom(3),
      },
      {
        positionId: posIds[2],
        applicantName: "Jakir Hossain",
        email: "jakir.dev@gmail.com",
        phone: "+880174",
        status: "New",
        source: "LinkedIn",
        experienceYears: 5,
        expectedSalary: 1500,
        appliedDate: daysAgo(3),
      },
    ];
    for (const a of apps) {
      await prisma.jobApplication.create({ data: a as any }).catch(() => null);
    }
  }

  // Client Accounts
  const clients = [
    {
      clientName: "James Martin",
      email: "james@techflow.io",
      country: "UK",
      status: "Active",
      totalSpentUsd: 2400,
      totalOrders: 3,
      firstOrderDate: daysAgo(120),
      lastOrderDate: daysAgo(20),
      assignedManager: "Abdullah Al Mamun",
    },
    {
      clientName: "Sarah Chen",
      email: "sarah@globalmart.com",
      country: "US",
      status: "Active",
      totalSpentUsd: 1200,
      totalOrders: 1,
      firstOrderDate: daysAgo(30),
      lastOrderDate: daysAgo(30),
      assignedManager: "Md. Habibullah",
    },
    {
      clientName: "Emma Wilson",
      email: "emma@bloombeauty.co",
      country: "AU",
      status: "Active",
      totalSpentUsd: 500,
      totalOrders: 1,
      firstOrderDate: daysAgo(14),
      lastOrderDate: daysAgo(14),
      assignedManager: "Md. Habibullah",
    },
    {
      clientName: "David Kim",
      email: "david@profitgym.com",
      country: "KR",
      status: "Active",
      totalSpentUsd: 350,
      totalOrders: 1,
      firstOrderDate: daysAgo(10),
      lastOrderDate: daysAgo(10),
      assignedManager: "Md. Habibullah",
    },
    {
      clientName: "Carlos Rivera",
      email: "carlos@nexashop.mx",
      country: "MX",
      status: "Prospect",
      totalSpentUsd: 0,
      totalOrders: 0,
    },
  ];
  for (const c of clients) {
    await prisma.clientAccount
      .upsert({
        where: { email: c.email },
        update: {},
        create: c as any,
      })
      .catch(() => null);
  }

  console.log("✅ HR, job positions, client accounts seeded");
}

async function seedStaffDocuments(staffIds: Record<string, string>) {
  const docs = [
    {
      category: "identity",
      documentType: "passport",
      title: "Passport Copy",
      mimeType: "application/pdf",
    },
    {
      category: "employment",
      documentType: "contract",
      title: "Employment Contract",
      mimeType: "application/pdf",
    },
    {
      category: "education",
      documentType: "certificate",
      title: "SEO Certification",
      mimeType: "application/pdf",
    },
    {
      category: "other",
      documentType: "profile_photo",
      title: "Profile Photo",
      mimeType: "image/jpeg",
    },
  ];

  for (const email of STAFF_EMAILS) {
    const staffMemberId = staffIds[email];
    if (!staffMemberId) continue;
    const pickDocs = docs.slice(0, randint(2, 4));
    for (const d of pickDocs) {
      const ext = d.mimeType === "image/jpeg" ? "jpg" : "pdf";
      await prisma.staffDocument
        .create({
          data: {
            staffMemberId,
            category: d.category,
            documentType: d.documentType,
            title: d.title,
            description: `${d.title} uploaded for onboarding compliance`,
            fileName: `${d.documentType}-${staffMemberId.slice(0, 8)}.${ext}`,
            fileSize: randint(60_000, 350_000),
            mimeType: d.mimeType,
            fileUrl: `https://files.pouchcare.test/staff/${staffMemberId}/${d.documentType}.${ext}`,
            issueDate: daysAgo(randint(60, 1000)),
            expiryDate: chance(0.4) ? daysFrom(randint(60, 720)) : null,
            isVerified: chance(0.7),
            verifiedBy: chance(0.7) ? "Md. Habibullah" : null,
            verifiedAt: chance(0.7) ? daysAgo(randint(1, 40)) : null,
            uploadedBy: "System Seeder",
          },
        })
        .catch(() => null);
    }
  }
  console.log("✅ Staff documents seeded");
}

async function seedRolePermissions() {
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
      const allowed = role === SystemRole.CEO ? true : chance(0.7);
      await prisma.rolePermission
        .upsert({
          where: { role_key: { role, key } },
          update: { allowed },
          create: { role, key, allowed },
        })
        .catch(() => null);
    }
  }
  console.log("✅ Role permissions seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedPortal() {
  // Portal Members
  const members = [
    {
      fullName: "John Smith",
      email: "john@example.com",
      referralCode: "REF-JOHN001",
      country: "US",
      status: PortalMemberStatus.ACTIVE,
      walletBalance: 850,
      totalDeposited: 1200,
      totalSpent: 750,
      totalOrders: 4,
      emailVerified: true,
      totalReferrals: 3,
      totalCommissionEarned: 156,
    },
    {
      fullName: "Alice Nguyen",
      email: "alice@example.com",
      referralCode: "REF-ALCE002",
      country: "CA",
      status: PortalMemberStatus.ACTIVE,
      walletBalance: 240,
      totalDeposited: 500,
      totalSpent: 380,
      totalOrders: 2,
      emailVerified: true,
      totalReferrals: 1,
      totalCommissionEarned: 48,
    },
    {
      fullName: "Michael Tan",
      email: "michael@example.com",
      referralCode: "REF-MICH003",
      country: "SG",
      status: PortalMemberStatus.ACTIVE,
      walletBalance: 1500,
      totalDeposited: 2000,
      totalSpent: 1200,
      totalOrders: 6,
      emailVerified: true,
      totalReferrals: 5,
      totalCommissionEarned: 320,
    },
    {
      fullName: "Sofia Rossi",
      email: "sofia@example.com",
      referralCode: "REF-SOFI004",
      country: "IT",
      status: PortalMemberStatus.PENDING_VERIFICATION,
      walletBalance: 0,
      totalDeposited: 0,
      totalSpent: 0,
      totalOrders: 0,
      emailVerified: false,
    },
    {
      fullName: "Omar Hassan",
      email: "omar@example.com",
      referralCode: "REF-OMAR005",
      country: "AE",
      status: PortalMemberStatus.ACTIVE,
      walletBalance: 300,
      totalDeposited: 600,
      totalSpent: 450,
      totalOrders: 2,
      emailVerified: true,
    },
    {
      fullName: "PouchCare Test Client",
      email: TEST_PORTAL_EMAIL,
      referralCode: "REF-TEST001",
      country: "BD",
      status: PortalMemberStatus.ACTIVE,
      walletBalance: 972,
      totalDeposited: 1800,
      totalSpent: 828,
      totalOrders: 5,
      emailVerified: true,
      totalReferrals: 1,
      totalCommissionEarned: 76,
    },
    {
      fullName: "Demo Referred Client",
      email: "referred.demo@pouchcare.com",
      referralCode: "REF-DEMO998",
      country: "US",
      status: PortalMemberStatus.ACTIVE,
      walletBalance: 50,
      totalDeposited: 100,
      totalSpent: 50,
      totalOrders: 1,
      emailVerified: true,
      totalReferrals: 0,
      totalCommissionEarned: 0,
    },
  ];

  const portalIds: Record<string, string> = {};
  for (const m of members) {
    const pm = await prisma.portalMember.upsert({
      where: { email: m.email },
      update: { passwordHash: portalPasswordHashForEmail(m.email) },
      create: {
        ...m,
        passwordHash: portalPasswordHashForEmail(m.email),
        registrationDate: daysAgo(Math.floor(Math.random() * 180)),
      } as any,
    });
    portalIds[m.email] = pm.id;
  }

  // Set referral chain: alice referred by john, michael referred by john
  await prisma.portalMember
    .update({
      where: { email: "alice@example.com" },
      data: { referredById: portalIds["john@example.com"] },
    })
    .catch(() => null);
  await prisma.portalMember
    .update({
      where: { email: "michael@example.com" },
      data: { referredById: portalIds["john@example.com"] },
    })
    .catch(() => null);
  await prisma.portalMember
    .update({
      where: { email: "referred.demo@pouchcare.com" },
      data: { referredById: portalIds[TEST_PORTAL_EMAIL] },
    })
    .catch(() => null);

  // Portal Orders
  const orders = [
    {
      memberId: portalIds["john@example.com"],
      memberEmail: "john@example.com",
      service: "Link Building",
      status: OrderStatus.COMPLETED,
      amountUsd: 150,
      quantity: 10,
      orderDate: daysAgo(30),
      deliveryDate: daysAgo(16),
      rating: 4.8,
    },
    {
      memberId: portalIds["john@example.com"],
      memberEmail: "john@example.com",
      service: "On-Page SEO",
      status: OrderStatus.DELIVERED,
      amountUsd: 200,
      quantity: 1,
      orderDate: daysAgo(20),
      deadline: daysAgo(13),
      deliveryDate: daysAgo(15),
    },
    {
      memberId: portalIds["michael@example.com"],
      memberEmail: "michael@example.com",
      service: "Technical SEO",
      status: OrderStatus.COMPLETED,
      amountUsd: 300,
      quantity: 1,
      orderDate: daysAgo(45),
      deliveryDate: daysAgo(30),
      rating: 5.0,
    },
    {
      memberId: portalIds["michael@example.com"],
      memberEmail: "michael@example.com",
      service: "Link Building",
      status: OrderStatus.PROCESSING,
      amountUsd: 300,
      quantity: 20,
      orderDate: daysAgo(5),
      deadline: daysFrom(10),
    },
    {
      memberId: portalIds["alice@example.com"],
      memberEmail: "alice@example.com",
      service: "Content Writing",
      status: OrderStatus.COMPLETED,
      amountUsd: 125,
      quantity: 5,
      orderDate: daysAgo(25),
      deliveryDate: daysAgo(18),
      rating: 4.5,
    },
    {
      memberId: portalIds["omar@example.com"],
      memberEmail: "omar@example.com",
      service: "Local SEO",
      status: OrderStatus.PENDING,
      amountUsd: 150,
      quantity: 1,
      orderDate: daysAgo(2),
      deadline: daysFrom(5),
    },
    {
      memberId: portalIds[TEST_PORTAL_EMAIL],
      memberEmail: TEST_PORTAL_EMAIL,
      service: "Link Building",
      status: OrderStatus.COMPLETED,
      amountUsd: 180,
      quantity: 12,
      orderDate: daysAgo(35),
      deliveryDate: daysAgo(20),
      rating: 4.9,
    },
    {
      memberId: portalIds[TEST_PORTAL_EMAIL],
      memberEmail: TEST_PORTAL_EMAIL,
      service: "On-Page SEO",
      status: OrderStatus.DELIVERED,
      amountUsd: 220,
      quantity: 1,
      orderDate: daysAgo(22),
      deadline: daysAgo(14),
      deliveryDate: daysAgo(16),
    },
    {
      memberId: portalIds[TEST_PORTAL_EMAIL],
      memberEmail: TEST_PORTAL_EMAIL,
      service: "Technical SEO",
      status: OrderStatus.PROCESSING,
      amountUsd: 340,
      quantity: 1,
      orderDate: daysAgo(6),
      deadline: daysFrom(8),
    },
    {
      memberId: portalIds[TEST_PORTAL_EMAIL],
      memberEmail: TEST_PORTAL_EMAIL,
      service: "Content Writing",
      status: OrderStatus.PENDING,
      amountUsd: 140,
      quantity: 4,
      orderDate: daysAgo(1),
      deadline: daysFrom(7),
    },
    {
      memberId: portalIds[TEST_PORTAL_EMAIL],
      memberEmail: TEST_PORTAL_EMAIL,
      service: "Local SEO",
      status: OrderStatus.COMPLETED,
      amountUsd: 200,
      quantity: 1,
      orderDate: daysAgo(50),
      deliveryDate: daysAgo(40),
      rating: 5.0,
    },
    {
      memberId: portalIds["referred.demo@pouchcare.com"],
      memberEmail: "referred.demo@pouchcare.com",
      service: "Starter SEO Pack",
      status: OrderStatus.COMPLETED,
      amountUsd: 50,
      quantity: 1,
      orderDate: daysAgo(10),
      deliveryDate: daysAgo(8),
      rating: 4.6,
    },
  ];

  const orderIds: string[] = [];
  const testPortalOrderIds: string[] = [];
  for (const o of orders) {
    const order = await prisma.portalOrder
      .create({ data: o as any })
      .catch(() => null);
    if (order) {
      orderIds.push(order.id);
      if ((o as { memberEmail?: string }).memberEmail === TEST_PORTAL_EMAIL) {
        testPortalOrderIds.push(order.id);
      }
    }
  }

  // Wallet Transactions
  const txs = [
    {
      memberId: portalIds["john@example.com"],
      type: WalletTxType.DEPOSIT,
      amountUsd: 500,
      balanceAfterUsd: 500,
      status: "Confirmed",
      paymentMethod: "USDT TRC20",
      transactionDate: daysAgo(60),
    },
    {
      memberId: portalIds["john@example.com"],
      type: WalletTxType.ORDER_PAYMENT,
      amountUsd: -150,
      balanceAfterUsd: 350,
      status: "Confirmed",
      transactionDate: daysAgo(30),
    },
    {
      memberId: portalIds["john@example.com"],
      type: WalletTxType.COMMISSION_CREDIT,
      amountUsd: 60,
      balanceAfterUsd: 410,
      status: "Confirmed",
      transactionDate: daysAgo(20),
    },
    {
      memberId: portalIds["john@example.com"],
      type: WalletTxType.DEPOSIT,
      amountUsd: 700,
      balanceAfterUsd: 1110,
      status: "Confirmed",
      paymentMethod: "Payoneer",
      transactionDate: daysAgo(15),
    },
    {
      memberId: portalIds["john@example.com"],
      type: WalletTxType.ORDER_PAYMENT,
      amountUsd: -200,
      balanceAfterUsd: 910,
      status: "Confirmed",
      transactionDate: daysAgo(10),
    },
    {
      memberId: portalIds["michael@example.com"],
      type: WalletTxType.DEPOSIT,
      amountUsd: 1000,
      balanceAfterUsd: 1000,
      status: "Confirmed",
      paymentMethod: "Binance",
      transactionDate: daysAgo(50),
    },
    {
      memberId: portalIds["michael@example.com"],
      type: WalletTxType.ORDER_PAYMENT,
      amountUsd: -300,
      balanceAfterUsd: 700,
      status: "Confirmed",
      transactionDate: daysAgo(45),
    },
    {
      memberId: portalIds["michael@example.com"],
      type: WalletTxType.COMMISSION_CREDIT,
      amountUsd: 100,
      balanceAfterUsd: 800,
      status: "Confirmed",
      transactionDate: daysAgo(25),
    },
    {
      memberId: portalIds["alice@example.com"],
      type: WalletTxType.DEPOSIT,
      amountUsd: 300,
      balanceAfterUsd: 300,
      status: "Confirmed",
      paymentMethod: "USDT TRC20",
      transactionDate: daysAgo(30),
    },
    {
      memberId: portalIds["alice@example.com"],
      type: WalletTxType.ORDER_PAYMENT,
      amountUsd: -125,
      balanceAfterUsd: 175,
      status: "Confirmed",
      transactionDate: daysAgo(25),
    },
    {
      memberId: portalIds[TEST_PORTAL_EMAIL],
      type: WalletTxType.DEPOSIT,
      amountUsd: 600,
      balanceAfterUsd: 600,
      status: "Confirmed",
      paymentMethod: "USDT TRC20",
      transactionDate: daysAgo(55),
    },
    {
      memberId: portalIds[TEST_PORTAL_EMAIL],
      type: WalletTxType.ORDER_PAYMENT,
      amountUsd: -180,
      balanceAfterUsd: 420,
      status: "Confirmed",
      transactionDate: daysAgo(35),
    },
    {
      memberId: portalIds[TEST_PORTAL_EMAIL],
      type: WalletTxType.COMMISSION_CREDIT,
      amountUsd: 72,
      balanceAfterUsd: 492,
      status: "Confirmed",
      transactionDate: daysAgo(28),
    },
    {
      memberId: portalIds[TEST_PORTAL_EMAIL],
      type: WalletTxType.DEPOSIT,
      amountUsd: 900,
      balanceAfterUsd: 1392,
      status: "Confirmed",
      paymentMethod: "Payoneer",
      transactionDate: daysAgo(18),
    },
    {
      memberId: portalIds[TEST_PORTAL_EMAIL],
      type: WalletTxType.ORDER_PAYMENT,
      amountUsd: -220,
      balanceAfterUsd: 1172,
      status: "Confirmed",
      transactionDate: daysAgo(22),
    },
    {
      memberId: portalIds[TEST_PORTAL_EMAIL],
      type: WalletTxType.ORDER_PAYMENT,
      amountUsd: -200,
      balanceAfterUsd: 972,
      status: "Confirmed",
      transactionDate: daysAgo(50),
    },
    {
      memberId: portalIds["referred.demo@pouchcare.com"],
      type: WalletTxType.DEPOSIT,
      amountUsd: 100,
      balanceAfterUsd: 100,
      status: "Confirmed",
      paymentMethod: "USDT TRC20",
      transactionDate: daysAgo(12),
    },
    {
      memberId: portalIds["referred.demo@pouchcare.com"],
      type: WalletTxType.ORDER_PAYMENT,
      amountUsd: -50,
      balanceAfterUsd: 50,
      status: "Confirmed",
      transactionDate: daysAgo(10),
    },
  ];
  for (const tx of txs) {
    await prisma.walletTransaction
      .create({ data: tx as any })
      .catch(() => null);
  }

  // Commissions (for john's referrals)
  if (orderIds.length >= 2) {
    await prisma.commission
      .create({
        data: {
          earnerId: portalIds["john@example.com"],
          orderId: orderIds[2], // michael's completed order
          referredMemberName: "Michael Tan",
          orderAmountUsd: 300,
          commissionRate: 0.2,
          commissionAmountUsd: 60,
          status: CommissionStatus.AVAILABLE,
          holdReleaseDate: daysAgo(16),
        },
      })
      .catch(() => null);
    await prisma.commission
      .create({
        data: {
          earnerId: portalIds["john@example.com"],
          orderId: orderIds[4], // alice's completed order
          referredMemberName: "Alice Nguyen",
          orderAmountUsd: 125,
          commissionRate: 0.2,
          commissionAmountUsd: 25,
          status: CommissionStatus.AVAILABLE,
          holdReleaseDate: daysAgo(4),
        },
      })
      .catch(() => null);
  }

  if (testPortalOrderIds.length >= 2) {
    await prisma.commission
      .create({
        data: {
          earnerId: portalIds[TEST_PORTAL_EMAIL],
          orderId: testPortalOrderIds[0],
          referredMemberName: "Demo Referred Client",
          orderAmountUsd: 180,
          commissionRate: 0.2,
          commissionAmountUsd: 36,
          status: CommissionStatus.AVAILABLE,
          holdReleaseDate: daysAgo(18),
        },
      })
      .catch(() => null);
    await prisma.commission
      .create({
        data: {
          earnerId: portalIds[TEST_PORTAL_EMAIL],
          orderId: testPortalOrderIds[4],
          referredMemberName: "Referred order",
          orderAmountUsd: 200,
          commissionRate: 0.2,
          commissionAmountUsd: 40,
          status: CommissionStatus.PENDING_HOLD,
          holdReleaseDate: daysFrom(7),
        },
      })
      .catch(() => null);
  }

  // Payout Request
  await prisma.payoutRequest
    .create({
      data: {
        memberId: portalIds["john@example.com"],
        memberEmail: "john@example.com",
        amountUsd: 85,
        paymentMethod: PaymentMethod.USDT_TRC20,
        paymentDetails: "TRC20 address: TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        status: PayoutStatus.PENDING,
        requestedDate: daysAgo(2),
      },
    })
    .catch(() => null);
  await prisma.payoutRequest
    .create({
      data: {
        memberId: portalIds[TEST_PORTAL_EMAIL],
        memberEmail: TEST_PORTAL_EMAIL,
        amountUsd: 120,
        paymentMethod: PaymentMethod.PAYONEER,
        paymentDetails: "payoneer@client.test",
        status: PayoutStatus.PROCESSING,
        requestedDate: daysAgo(1),
      },
    })
    .catch(() => null);

  // Support Tickets
  const ticket = await prisma.supportTicket
    .create({
      data: {
        memberId: portalIds["john@example.com"],
        memberEmail: "john@example.com",
        subject: "Delivery delayed for order #2",
        status: "Open",
        priority: "High",
        assignedTo: "Md. Habibullah",
      },
    })
    .catch(() => null);

  if (ticket) {
    await prisma.ticketReply
      .create({
        data: {
          ticketId: ticket.id,
          authorId: portalIds["john@example.com"],
          authorName: "John Smith",
          authorType: "client",
          content:
            "Hi, I placed an order 5 days ago and still no update. Can you check?",
        },
      })
      .catch(() => null);
  }

  const testTicket = await prisma.supportTicket
    .create({
      data: {
        memberId: portalIds[TEST_PORTAL_EMAIL],
        memberEmail: TEST_PORTAL_EMAIL,
        subject: "Question about Technical SEO order timeline",
        status: "Open",
        priority: "Medium",
        assignedTo: "Md. Habibullah",
      },
    })
    .catch(() => null);
  if (testTicket) {
    await prisma.ticketReply
      .create({
        data: {
          ticketId: testTicket.id,
          authorId: portalIds[TEST_PORTAL_EMAIL],
          authorName: "PouchCare Test Client",
          authorType: "client",
          content:
            "Can you confirm the expected delivery window for my in-progress order?",
        },
      })
      .catch(() => null);
  }

  console.log("✅ Portal members, orders, wallets, commissions seeded");
  return { portalIds, orderIds };
}

async function seedNotifications(
  staffIds: Record<string, string>,
  portalIds: Record<string, string>,
) {
  const titles = [
    {
      type: "task",
      title: "Task deadline approaching",
      message: "A task is due within 24 hours. Please update status.",
    },
    {
      type: "leave",
      title: "Leave request submitted",
      message: "A new leave request needs your approval.",
    },
    {
      type: "ticket",
      title: "Support ticket update",
      message: "A support ticket has a new reply.",
    },
    {
      type: "payment",
      title: "Payment confirmed",
      message: "Client payment has been confirmed.",
    },
    {
      type: "system",
      title: "System maintenance",
      message: "Scheduled maintenance window announced.",
    },
    {
      type: "order",
      title: "New order received",
      message: "A portal order was placed and awaits processing.",
    },
  ];

  const staffRecipients = Object.values(staffIds).slice(0, 8);
  const portalRecipients = Object.values(portalIds);

  for (const recipientId of staffRecipients) {
    for (let i = 0; i < randint(4, 8); i++) {
      const t = pick(titles);
      await prisma.notification
        .create({
          data: {
            recipientId,
            recipientType: "staff",
            type: t.type,
            title: t.title,
            message: t.message,
            read: chance(0.55),
            link: "/",
            metadata: JSON.stringify({ seeded: true }),
          },
        })
        .catch(() => null);
    }
  }

  for (const recipientId of portalRecipients) {
    for (let i = 0; i < randint(2, 5); i++) {
      const t = pick(titles);
      await prisma.notification
        .create({
          data: {
            recipientId,
            recipientType: "portal",
            type: t.type,
            title: t.title,
            message: t.message,
            read: chance(0.35),
            link: "/portal",
          },
        })
        .catch(() => null);
    }
  }

  console.log("✅ Notifications seeded");
}

async function seedSupportExpansion(
  staffIds: Record<string, string>,
  portalIds: Record<string, string>,
) {
  const tickets = [
    {
      memberEmail: "alice@example.com",
      subject: "Cannot see wallet refund",
      priority: "Medium",
      status: "Open",
    },
    {
      memberEmail: "michael@example.com",
      subject: "Order revision request",
      priority: "High",
      status: "In Progress",
    },
    {
      memberEmail: "omar@example.com",
      subject: "Payment method update",
      priority: "Low",
      status: "Resolved",
    },
    {
      memberEmail: TEST_PORTAL_EMAIL,
      subject: "Invoice copy for last deposit",
      priority: "Low",
      status: "Open",
    },
  ];

  for (const t of tickets) {
    const memberId = portalIds[t.memberEmail];
    if (!memberId) continue;
    const ticket = await prisma.supportTicket
      .create({
        data: {
          memberId,
          memberEmail: t.memberEmail,
          subject: t.subject,
          status: t.status,
          priority: t.priority,
          assignedTo: "Md. Habibullah",
        },
      })
      .catch(() => null);

    if (!ticket) continue;
    await prisma.ticketReply
      .create({
        data: {
          ticketId: ticket.id,
          authorId: memberId,
          authorName: t.memberEmail.split("@")[0],
          authorType: "client",
          content:
            "Please help me with this issue. I have attached details in the dashboard.",
        },
      })
      .catch(() => null);

    const staffAuthorId = staffIds["ops@pouchcare.com"];
    if (staffAuthorId) {
      await prisma.ticketReply
        .create({
          data: {
            ticketId: ticket.id,
            authorId: staffAuthorId,
            authorName: "Md. Habibullah",
            authorType: "staff",
            content:
              "Thanks for reporting. We are reviewing and will update shortly.",
          },
        })
        .catch(() => null);
    }
  }
  console.log("✅ Additional support tickets/replies seeded");
}

async function seedPluginsAndApiKeys(
  staffIds: Record<string, string>,
  portalIds: Record<string, string>,
) {
  const creatorId =
    staffIds["ceo@pouchcare.com"] || staffIds["ops@pouchcare.com"];
  const publisherId = staffIds["ops@pouchcare.com"] || creatorId;
  if (!creatorId || !publisherId) {
    console.log("ℹ️ Plugin seed skipped (missing creator IDs)");
    return;
  }

  const pluginSpecs = [
    {
      slug: "pouchcare-license-checker",
      name: "PouchCare License Checker",
      description: "Validates portal licenses from WordPress",
    },
    {
      slug: "pouchcare-seo-helper",
      name: "PouchCare SEO Helper",
      description: "On-page suggestions and diagnostics",
    },
    {
      slug: "pouchcare-link-sync",
      name: "PouchCare Link Sync",
      description: "Syncs backlink submissions with dashboard",
    },
  ];

  for (const p of pluginSpecs) {
    const plugin = await prisma.plugin.upsert({
      where: { slug: p.slug },
      update: { name: p.name, description: p.description, status: "PUBLISHED" },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        status: "PUBLISHED",
        createdById: creatorId,
      },
    });

    const versions = ["1.0.0", "1.1.0"];
    for (const version of versions) {
      await prisma.pluginVersion
        .upsert({
          where: { pluginId_version: { pluginId: plugin.id, version } },
          update: { isLatest: version === "1.1.0" },
          create: {
            pluginId: plugin.id,
            version,
            changelog:
              version === "1.0.0"
                ? "Initial release"
                : "Stability improvements and bug fixes",
            phpFileContent: `<?php\n/**\n * Plugin Name: ${p.name}\n * Version: ${version}\n */\n`,
            isLatest: version === "1.1.0",
            publishedById: publisherId,
          },
        })
        .catch(() => null);
    }

    await prisma.plugin
      .update({ where: { id: plugin.id }, data: { currentVersion: "1.1.0" } })
      .catch(() => null);

    const actCandidates = [
      {
        type: "staff",
        id: staffIds["branch@pouchcare.com"],
        name: "Zihadduzzaman",
      },
      {
        type: "staff",
        id: staffIds["comd@pouchcare.com"],
        name: "Md Oliullah",
      },
      { type: "portal", id: portalIds["john@example.com"], name: "John Smith" },
      {
        type: "portal",
        id: portalIds[TEST_PORTAL_EMAIL],
        name: "PouchCare Test Client",
      },
    ];

    for (let i = 0; i < actCandidates.length; i++) {
      const c = actCandidates[i];
      if (!c.id) continue;
      await prisma.pluginActivation
        .upsert({
          where: {
            pluginId_siteUrl: {
              pluginId: plugin.id,
              siteUrl: `https://site${i + 1}.${p.slug}.test`,
            },
          },
          update: { isActive: true, lastPingAt: daysAgo(randint(0, 7)) },
          create: {
            pluginId: plugin.id,
            activatedByType: c.type,
            activatedById: c.id,
            activatedByName: c.name,
            siteUrl: `https://site${i + 1}.${p.slug}.test`,
            siteTitle: `${p.name} Demo Site ${i + 1}`,
            lastPingAt: daysAgo(randint(0, 7)),
          },
        })
        .catch(() => null);
    }
  }

  const rawKeys = ["pc_seed_general_001", "pc_seed_plugin_001"];
  const keyRows = [
    { name: "General Integration Key", scope: "general", raw: rawKeys[0] },
    { name: "Plugin Download Key", scope: "plugin_download", raw: rawKeys[1] },
  ];

  for (const k of keyRows) {
    const keyHash = crypto.createHash("sha256").update(k.raw).digest("hex");
    await prisma.apiKey
      .upsert({
        where: { keyHash },
        update: { isActive: true, lastUsedAt: daysAgo(randint(0, 14)) },
        create: {
          name: k.name,
          keyHash,
          keyPrefix: k.raw.slice(0, 11),
          scope: k.scope,
          isActive: true,
          createdById: creatorId,
          lastUsedAt: daysAgo(randint(0, 14)),
          expiresAt: daysFrom(randint(120, 365)),
        },
      })
      .catch(() => null);
  }

  console.log("✅ Plugins, versions, activations, and API keys seeded");
}

async function seedToolRuns(staffIds: Record<string, string>) {
  const runTypes = [
    ToolRunType.SERP_TOP_100,
    ToolRunType.DOMAIN_METRICS,
    ToolRunType.BACKLINKS,
    ToolRunType.KEYWORDS,
    ToolRunType.FAVICON_ZIP,
  ];

  const labels = [
    "best seo agency dubai",
    "pouchcare.com vs competitor.com",
    "https://example.com/backlinks",
    "wordpress seo plugin ideas",
    "favicon upload for client portal",
  ];

  const authors = [
    "ceo@pouchcare.com",
    "comd@pouchcare.com",
    "ops@pouchcare.com",
    "branch@pouchcare.com",
  ];
  for (let i = 0; i < 40; i++) {
    const email = pick(authors);
    const staffId = staffIds[email];
    if (!staffId) continue;
    const t = pick(runTypes);
    const label = pick(labels);
    await prisma.toolRun
      .create({
        data: {
          staffId,
          toolType: t,
          queryLabel: label,
          meta: { seeded: true, resultCount: randint(3, 100) },
          createdAt: daysAgo(randint(0, 35)),
        },
      })
      .catch(() => null);
  }

  console.log("✅ Tool runs seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedMisc() {
  // Automations
  const automations = [
    {
      name: "Daily Attendance Reminder",
      trigger: "cron",
      frequency: "Daily 09:00",
      affectedModule: "Attendance",
      status: "Active",
      runCount: 85,
      lastRunStatus: "Success",
      description:
        "Sends a WhatsApp reminder to staff who have not checked in by 9 AM",
    },
    {
      name: "Weekly KPI Report",
      trigger: "cron",
      frequency: "Every Monday 08:00",
      affectedModule: "Reports",
      status: "Active",
      runCount: 12,
      lastRunStatus: "Success",
      description: "Generates and sends weekly KPI report to CEO and Co-MD",
    },
    {
      name: "Overdue Task Alert",
      trigger: "cron",
      frequency: "Daily 18:00",
      affectedModule: "Tasks",
      status: "Active",
      runCount: 85,
      lastRunStatus: "Success",
      description: "Alerts staff and manager about overdue tasks",
    },
    {
      name: "Commission Hold Release",
      trigger: "cron",
      frequency: "Daily 00:00",
      affectedModule: "Portal",
      status: "Active",
      runCount: 90,
      lastRunStatus: "Success",
      description: `Releases commissions after ${14}-day hold period`,
    },
    {
      name: "Monthly Payroll Reminder",
      trigger: "cron",
      frequency: "Monthly 25th",
      affectedModule: "Payroll",
      status: "Active",
      runCount: 3,
      lastRunStatus: "Success",
      description: "Reminds HR to process payroll by 25th of month",
    },
    {
      name: "Domain Expiry Alert",
      trigger: "cron",
      frequency: "Weekly Sunday",
      affectedModule: "Assets",
      status: "Active",
      runCount: 13,
      lastRunStatus: "Success",
      description: "Sends alert when domain expiry < 30 days",
    },
    {
      name: "Lead Follow-up Nudge",
      trigger: "cron",
      frequency: "Daily 10:00",
      affectedModule: "CRM",
      status: "Paused",
      runCount: 40,
      lastRunStatus: "Success",
      description: "Nudges sales team for leads with no activity in 3 days",
    },
  ];
  for (const a of automations) {
    await prisma.automation
      .upsert({
        where: { name: a.name },
        update: {},
        create: {
          ...a,
          lastRunDate: daysAgo(1),
          nextRunDate: daysFrom(1),
        } as any,
      })
      .catch(() => null);
  }

  // Broadcasts
  await prisma.broadcast
    .create({
      data: {
        title: "Office Holiday – Eid ul-Fitr",
        message:
          "The office will be closed from April 10–12 for Eid ul-Fitr. All staff should complete pending work by April 9.",
        sentBy: "Abdullah Al Mamun",
        audience: "staff",
        channel: "in_app",
        isUrgent: false,
      },
    })
    .catch(() => null);
  await prisma.broadcast
    .create({
      data: {
        title: "New Service Launched – Social Media Management",
        message:
          "We have launched a new Social Media Management service. Check the services page for pricing.",
        sentBy: "Md. Habibullah",
        audience: "all",
        channel: "email",
        isUrgent: false,
      },
    })
    .catch(() => null);

  // Devices
  console.log("✅ Automations and broadcasts seeded");
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding PouchCare database...\n");

  try {
    await prisma.$connect();
  } catch {
    console.error(
      "\n❌ Cannot connect to PostgreSQL (check DATABASE_URL in apps/api/.env).\n" +
        "   Start Postgres first, e.g. from repo root:  docker compose up -d\n" +
        "   Then:  cd apps/api && npx prisma db push && npx prisma db seed\n\n",
    );
    process.exit(1);
  }

  await seedBranches();
  await seedCameras();
  const staffIds = await seedStaff();
  await seedManagedDevices(staffIds);
  await seedServices();
  await seedBacklinkPackages();
  await seedProjects(staffIds);
  await seedTasks(staffIds);
  await seedTaskComments(staffIds);
  await seedAttendance(staffIds);
  await seedLeaveRequests(staffIds);
  await seedDailyReports(staffIds);
  await seedPayroll(staffIds);
  await seedPerformanceRatings(staffIds);
  await seedCrm(staffIds);
  await seedSalesOrders();
  await seedFinance();
  await seedAssets();
  await seedHR();
  await seedStaffDocuments(staffIds);
  await seedRolePermissions();
  const { portalIds } = await seedPortal();
  await seedNotifications(staffIds, portalIds);
  await seedSupportExpansion(staffIds, portalIds);
  await seedPluginsAndApiKeys(staffIds, portalIds);
  await seedToolRuns(staffIds);
  await seedMisc();

  console.log("\n🎉 Seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Login credentials (default password: Password123!)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  CEO:             ceo@pouchcare.com  (Abdullah Al Mamun)");
  console.log("  MD (Co-MD):      comd@pouchcare.com  (Md Oliullah)");
  console.log("  Ops Manager:     ops@pouchcare.com  (Md. Habibullah)");
  console.log("  Branch Manager:  branch@pouchcare.com  (Zihadduzzaman — Dhaka)");
  console.log("  Portal Members:  john / alice / michael / omar @example.com");
  console.log(
    `  Portal (full test):  ${TEST_PORTAL_EMAIL}  /  Test@123`,
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

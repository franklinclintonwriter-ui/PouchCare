import { Router } from "express";
import prisma from "../utils/prisma.js";
import authenticate from "../middleware/authenticate.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ─────────────── GET /admin/stats ───────────────
router.get("/stats", async (_req, res, next) => {
  try {
    const [
      totalCustomers,
      totalLicenses,
      activeLicenses,
      totalSites,
      activeSites,
      sites,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "customer", status: "active" } }),
      prisma.license.count(),
      prisma.license.count({ where: { status: "active" } }),
      prisma.site.count(),
      prisma.site.count({ where: { status: "active" } }),
      prisma.site.findMany({
        where: { status: "active" },
        select: { pluginVersion: true, themeVersion: true, wpVersion: true },
      }),
    ]);

    const pluginVersions = {};
    const themeVersions = {};
    const wpVersions = {};

    for (const site of sites) {
      const pv = site.pluginVersion || "unknown";
      const tv = site.themeVersion || "unknown";
      const wv = site.wpVersion ? site.wpVersion.split(".").slice(0, 2).join(".") : "unknown";
      pluginVersions[pv] = (pluginVersions[pv] || 0) + 1;
      themeVersions[tv] = (themeVersions[tv] || 0) + 1;
      wpVersions[wv] = (wpVersions[wv] || 0) + 1;
    }

    const planCounts = await prisma.license.groupBy({
      by: ["plan"],
      where: { status: "active" },
      _count: true,
    });

    const recentlyActive = await prisma.site.count({
      where: {
        status: "active",
        lastHeartbeat: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    const staleSites = await prisma.site.count({
      where: {
        status: "active",
        lastHeartbeat: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    res.json({
      overview: {
        totalCustomers,
        totalLicenses,
        activeLicenses,
        totalSites,
        activeSites,
        recentlyActive,
        staleSites,
      },
      versions: {
        plugin: pluginVersions,
        theme: themeVersions,
        wordpress: wpVersions,
      },
      plans: planCounts.reduce((acc, p) => {
        acc[p.plan] = p._count;
        return acc;
      }, {}),
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────── GET /admin/customers ───────────────
router.get("/customers", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const where = {
      role: "customer",
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          status: true,
          createdAt: true,
          licenses: {
            select: {
              id: true,
              key: true,
              plan: true,
              status: true,
              maxSites: true,
              _count: { select: { sites: { where: { status: "active" } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      customers: customers.map((c) => ({
        ...c,
        totalLicenses: c.licenses.length,
        totalActiveSites: c.licenses.reduce((sum, l) => sum + l._count.sites, 0),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────── GET /admin/customers/:id ───────────────
router.get("/customers/:id", async (req, res, next) => {
  try {
    const customer = await prisma.user.findFirst({
      where: { id: req.params.id, role: "customer" },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        licenses: {
          include: {
            sites: { orderBy: { lastHeartbeat: "desc" } },
            _count: { select: { sites: { where: { status: "active" } } } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) return res.status(404).json({ error: "Customer not found" });

    res.json({ customer });
  } catch (err) {
    next(err);
  }
});

// ─────────────── GET /admin/sites ───────────────
router.get("/sites", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const skip = (page - 1) * limit;
    const status = req.query.status || undefined;

    const where = status ? { status } : {};

    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        include: {
          license: {
            select: {
              key: true,
              plan: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { lastHeartbeat: "desc" },
        skip,
        take: limit,
      }),
      prisma.site.count({ where }),
    ]);

    res.json({
      sites: sites.map((s) => ({
        id: s.id,
        url: s.url,
        name: s.name,
        wpVersion: s.wpVersion,
        pluginVersion: s.pluginVersion,
        themeVersion: s.themeVersion,
        themeActive: s.themeActive,
        status: s.status,
        lastHeartbeat: s.lastHeartbeat,
        customer: s.license.user,
        plan: s.license.plan,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────── GET /admin/system ───────────────
router.get("/system", async (_req, res, next) => {
  try {
    const uptime = process.uptime();
    const mem = process.memoryUsage();

    let dbStatus = "healthy";
    let dbLatency = 0;
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch {
      dbStatus = "error";
    }

    const [userCount, licenseCount, siteCount] = await Promise.all([
      prisma.user.count(),
      prisma.license.count(),
      prisma.site.count(),
    ]);

    res.json({
      api: { status: "healthy", uptime: Math.floor(uptime), version: "1.0.0" },
      database: { status: dbStatus, latency: dbLatency, tables: { users: userCount, licenses: licenseCount, sites: siteCount } },
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      },
      node: process.version,
      platform: process.platform,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────── Email Templates (in-memory store) ───────────────

const defaultTemplates = {
  verification: {
    type: "verification",
    subject: "Verify your PouchCare account",
    body: "Hi {{name}},\n\nYour verification code is: {{code}}\n\nThis code expires in 15 minutes.",
    enabled: true,
  },
  "password-reset": {
    type: "password-reset",
    subject: "Reset your PouchCare password",
    body: "Hi {{name}},\n\nClick the link below to reset your password:\n\n{{resetUrl}}\n\nThis link expires in 1 hour.",
    enabled: true,
  },
  welcome: {
    type: "welcome",
    subject: "Welcome to PouchCare!",
    body: "Hi {{name}},\n\nWelcome to PouchCare! Your account is now active.\n\nGet started by visiting your dashboard.",
    enabled: true,
  },
  "license-activated": {
    type: "license-activated",
    subject: "License activated - {{plan}} plan",
    body: "Hi {{name}},\n\nYour {{plan}} license has been activated for {{siteUrl}}.\n\nYou can manage your licenses from your dashboard.",
    enabled: true,
  },
};

let emailTemplates = { ...defaultTemplates };

router.get("/email-templates", (_req, res) => {
  res.json({ templates: Object.values(emailTemplates) });
});

router.get("/email-templates/:type", (req, res) => {
  const tmpl = emailTemplates[req.params.type];
  if (!tmpl) return res.status(404).json({ error: "Template not found" });
  res.json({ template: tmpl });
});

router.put("/email-templates/:type", (req, res) => {
  const type = req.params.type;
  if (!emailTemplates[type]) return res.status(404).json({ error: "Template not found" });

  const { subject, body, enabled } = req.body;
  if (subject) emailTemplates[type].subject = subject;
  if (body) emailTemplates[type].body = body;
  if (enabled !== undefined) emailTemplates[type].enabled = enabled;

  res.json({ message: "Template updated", template: emailTemplates[type] });
});

router.post("/email-templates/:type/test", (req, res) => {
  const type = req.params.type;
  if (!emailTemplates[type]) return res.status(404).json({ error: "Template not found" });

  res.json({
    message: `Test email for "${type}" would be sent to ${req.user.email}`,
    template: emailTemplates[type],
  });
});

// ─────────────── GET /admin/analytics ───────────────
router.get("/analytics", async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalCustomers,
      newCustomersMonth,
      newCustomersWeek,
      totalSites,
      activeSites,
      totalLicenses,
      planCounts,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "customer" } }),
      prisma.user.count({ where: { role: "customer", createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { role: "customer", createdAt: { gte: sevenDaysAgo } } }),
      prisma.site.count(),
      prisma.site.count({ where: { status: "active" } }),
      prisma.license.count({ where: { status: "active" } }),
      prisma.license.groupBy({ by: ["plan"], where: { status: "active" }, _count: true }),
    ]);

    const recentUsers = await prisma.user.findMany({
      where: { role: "customer", createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const dailySignups = {};
    for (const u of recentUsers) {
      const day = u.createdAt.toISOString().slice(0, 10);
      dailySignups[day] = (dailySignups[day] || 0) + 1;
    }

    res.json({
      overview: {
        totalCustomers,
        newCustomersMonth,
        newCustomersWeek,
        totalSites,
        activeSites,
        totalLicenses,
      },
      plans: planCounts.reduce((acc, p) => { acc[p.plan] = p._count; return acc; }, {}),
      dailySignups,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router } from "express";
import { z } from "zod";
import prisma from "../utils/prisma.js";
import { generateLicenseKey, PLAN_LIMITS } from "../utils/license.js";
import authenticate from "../middleware/authenticate.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = Router();

/** JSON shape expected by the WordPress plugin (plan / expiresAt on `site` and top-level fallbacks). */
function activationResponse(license, site, message, activations) {
  const plan = license.plan;
  const expiresAt = license.expiresAt;
  const sitePayload = { ...site, plan, expiresAt };
  const body = {
    message,
    site: sitePayload,
    plan,
    expiresAt,
  };
  if (activations) body.activations = activations;
  return body;
}

// ─────────────── POST /licenses/generate (admin) ───────────────
// Admin generates a license key for a customer

const generateSchema = z.object({
  userId: z.string().min(1),
  plan: z.enum(["Starter", "Growth", "Agency"]).default("Starter"),
  expiresAt: z.string().datetime().optional(),
});

router.post("/generate", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = generateSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const key = generateLicenseKey();
    const maxSites = PLAN_LIMITS[body.plan] || 1;

    const license = await prisma.license.create({
      data: {
        key,
        plan: body.plan,
        maxSites,
        userId: body.userId,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });

    // Update user plan to match
    await prisma.user.update({
      where: { id: body.userId },
      data: { plan: body.plan },
    });

    res.status(201).json({ license });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// ─────────────── POST /licenses/activate (from WP plugin) ───────────────
// WP plugin sends license key + site URL to register the site

const activateSchema = z.object({
  licenseKey: z.string().min(1),
  siteUrl: z.string().url(),
  siteName: z.string().optional().default(""),
  wpVersion: z.string().optional().default(""),
  phpVersion: z.string().optional().default(""),
  pluginVersion: z.string().optional().default(""),
  themeVersion: z.string().optional().default(""),
  themeActive: z.boolean().optional().default(false),
});

router.post("/activate", async (req, res, next) => {
  try {
    const body = activateSchema.parse(req.body);

    // Find license
    const license = await prisma.license.findUnique({
      where: { key: body.licenseKey },
      include: { sites: true, user: true },
    });

    if (!license) {
      return res.status(404).json({ error: "Invalid license key" });
    }

    if (license.status !== "active") {
      return res.status(403).json({ error: `License is ${license.status}` });
    }

    if (license.expiresAt && license.expiresAt < new Date()) {
      return res.status(403).json({ error: "License has expired" });
    }

    // Check if site already registered under this license
    const existingSite = license.sites.find(
      (s) => s.url.replace(/\/$/, "") === body.siteUrl.replace(/\/$/, "")
    );

    if (existingSite) {
      // Re-activate existing site
      const updated = await prisma.site.update({
        where: { id: existingSite.id },
        data: {
          status: "active",
          wpVersion: body.wpVersion,
          phpVersion: body.phpVersion,
          pluginVersion: body.pluginVersion,
          themeVersion: body.themeVersion,
          themeActive: body.themeActive,
          name: body.siteName || existingSite.name,
          lastHeartbeat: new Date(),
        },
      });
      return res.json(activationResponse(license, updated, "Site re-activated"));
    }

    // Check activation limit
    const activeSites = license.sites.filter((s) => s.status === "active").length;
    if (activeSites >= license.maxSites) {
      return res.status(403).json({
        error: `License activation limit reached (${license.maxSites} sites). Upgrade your plan or deactivate an existing site.`,
      });
    }

    // Create new site registration
    const site = await prisma.site.create({
      data: {
        url: body.siteUrl.replace(/\/$/, ""),
        name: body.siteName,
        wpVersion: body.wpVersion,
        phpVersion: body.phpVersion,
        pluginVersion: body.pluginVersion,
        themeVersion: body.themeVersion,
        themeActive: body.themeActive,
        licenseId: license.id,
      },
    });

    res.status(201).json(
      activationResponse(license, site, "Site activated successfully", {
        used: activeSites + 1,
        max: license.maxSites,
      })
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// ─────────────── POST /licenses/deactivate ───────────────
// WP plugin or customer deactivates a site

const deactivateSchema = z.object({
  licenseKey: z.string().min(1),
  siteUrl: z.string().url(),
});

router.post("/deactivate", async (req, res, next) => {
  try {
    const body = deactivateSchema.parse(req.body);

    const license = await prisma.license.findUnique({
      where: { key: body.licenseKey },
      include: { sites: true },
    });

    if (!license) return res.status(404).json({ error: "Invalid license key" });

    const site = license.sites.find(
      (s) => s.url.replace(/\/$/, "") === body.siteUrl.replace(/\/$/, "")
    );

    if (!site) return res.status(404).json({ error: "Site not found under this license" });

    await prisma.site.update({
      where: { id: site.id },
      data: { status: "deactivated" },
    });

    res.json({ message: "Site deactivated" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// ─────────────── GET /licenses (customer — my licenses) ───────────────

router.get("/", authenticate, async (req, res, next) => {
  try {
    const licenses = await prisma.license.findMany({
      where: { userId: req.user.id },
      include: {
        sites: {
          orderBy: { lastHeartbeat: "desc" },
        },
        _count: { select: { sites: { where: { status: "active" } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      licenses: licenses.map((l) => ({
        id: l.id,
        key: l.key,
        plan: l.plan,
        status: l.status,
        maxSites: l.maxSites,
        activeSites: l._count.sites,
        expiresAt: l.expiresAt,
        createdAt: l.createdAt,
        sites: l.sites.map((s) => ({
          id: s.id,
          url: s.url,
          name: s.name,
          wpVersion: s.wpVersion,
          pluginVersion: s.pluginVersion,
          themeVersion: s.themeVersion,
          themeActive: s.themeActive,
          pluginActive: s.pluginActive,
          status: s.status,
          lastHeartbeat: s.lastHeartbeat,
        })),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────── GET /licenses/:id (customer — single license detail) ───────────────

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const license = await prisma.license.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { sites: { orderBy: { lastHeartbeat: "desc" } } },
    });

    if (!license) return res.status(404).json({ error: "License not found" });

    res.json({ license });
  } catch (err) {
    next(err);
  }
});

export default router;

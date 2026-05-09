import { Router } from "express";
import { z } from "zod";
import prisma from "../utils/prisma.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

// ─────────────── POST /sites/heartbeat (from WP plugin) ───────────────
// WP plugin sends periodic health data. No JWT needed — uses license key.

const heartbeatSchema = z.object({
  licenseKey: z.string().min(1),
  siteUrl: z.string().url(),
  wpVersion: z.string().optional(),
  phpVersion: z.string().optional(),
  pluginVersion: z.string().optional(),
  themeVersion: z.string().optional(),
  themeActive: z.boolean().optional(),
  pluginActive: z.boolean().optional(),
  siteName: z.string().optional(),
});

router.post("/heartbeat", async (req, res, next) => {
  try {
    const body = heartbeatSchema.parse(req.body);

    const license = await prisma.license.findUnique({
      where: { key: body.licenseKey },
    });

    if (!license || license.status !== "active") {
      return res.status(403).json({ error: "Invalid or inactive license" });
    }

    const normalizedUrl = body.siteUrl.replace(/\/$/, "");

    // Find the site
    const site = await prisma.site.findFirst({
      where: {
        licenseId: license.id,
        url: normalizedUrl,
      },
    });

    if (!site) {
      return res.status(404).json({ error: "Site not registered. Activate license first." });
    }

    // Update heartbeat data
    const updateData = { lastHeartbeat: new Date() };
    if (body.wpVersion) updateData.wpVersion = body.wpVersion;
    if (body.phpVersion) updateData.phpVersion = body.phpVersion;
    if (body.pluginVersion) updateData.pluginVersion = body.pluginVersion;
    if (body.themeVersion) updateData.themeVersion = body.themeVersion;
    if (body.themeActive !== undefined) updateData.themeActive = body.themeActive;
    if (body.pluginActive !== undefined) updateData.pluginActive = body.pluginActive;
    if (body.siteName) updateData.name = body.siteName;

    await prisma.site.update({
      where: { id: site.id },
      data: updateData,
    });

    // Check if there's a newer version available (for auto-update)
    res.json({
      status: "ok",
      // Future: include latest version info for the plugin to self-update
      // latestPluginVersion: "1.2.0",
      // latestThemeVersion: "1.1.0",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// ─────────────── GET /sites (customer — my connected sites) ───────────────

router.get("/", authenticate, async (req, res, next) => {
  try {
    // Get all sites across all of this user's licenses
    const sites = await prisma.site.findMany({
      where: {
        license: { userId: req.user.id },
      },
      include: {
        license: {
          select: { key: true, plan: true, status: true },
        },
      },
      orderBy: { lastHeartbeat: "desc" },
    });

    res.json({
      sites: sites.map((s) => ({
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
        license: s.license,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;

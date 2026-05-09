import { Router } from "express";
import { z } from "zod";
import prisma from "../utils/prisma.js";
import authenticate from "../middleware/authenticate.js";
import requireCustomer from "../middleware/requireCustomer.js";
import customerEntities from "./customerEntities.js";

const router = Router();

router.use(authenticate, requireCustomer);

const snapshotPutSchema = z.object({
  data: z.unknown(),
});

function customerSnapshotKey(userId) {
  return `customer:${userId}`;
}

function asDataObject(data) {
  if (data && typeof data === "object" && !Array.isArray(data)) return data;
  return {};
}

function normalizeOptionalString(v) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  return v;
}

function profileResponse(user) {
  return {
    fullName: user.name,
    email: user.email,
    company: user.company ?? "",
    phone: user.phone ?? "",
    timezone: user.timezone ?? "",
  };
}

const customerProfilePatchSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email address").optional(),
    company: z.union([z.string(), z.null()]).optional(),
    phone: z.union([z.string(), z.null()]).optional(),
    timezone: z.union([z.string(), z.null()]).optional(),
  })
  .refine(
    (d) =>
      d.fullName !== undefined ||
      d.name !== undefined ||
      d.email !== undefined ||
      d.company !== undefined ||
      d.phone !== undefined ||
      d.timezone !== undefined,
    { message: "At least one field is required" }
  );

// ─────────────── GET /customer/profile ───────────────

router.get("/profile", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        phone: true,
        timezone: true,
        plan: true,
        role: true,
        status: true,
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ profile: profileResponse(user) });
  } catch (err) {
    next(err);
  }
});

// ─────────────── PATCH /customer/profile ───────────────

router.patch("/profile", async (req, res, next) => {
  try {
    const body = customerProfilePatchSchema.parse(req.body);
    const updateData = {};

    const displayName = body.fullName ?? body.name;
    if (displayName !== undefined) updateData.name = displayName;

    if (body.email !== undefined && body.email !== req.user.email) {
      const existing = await prisma.user.findUnique({ where: { email: body.email } });
      if (existing) {
        return res.status(409).json({ error: "Email already in use" });
      }
      updateData.email = body.email;
    }

    const co = normalizeOptionalString(body.company);
    if (co !== undefined) updateData.company = co;
    const ph = normalizeOptionalString(body.phone);
    if (ph !== undefined) updateData.phone = ph;
    const tz = normalizeOptionalString(body.timezone);
    if (tz !== undefined) updateData.timezone = tz;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        phone: true,
        timezone: true,
        plan: true,
        role: true,
        status: true,
      },
    });

    res.json({ message: "Profile updated", profile: profileResponse(user) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || "Invalid body" });
    }
    next(err);
  }
});

// ─────────────── PATCH /customer/settings ───────────────
// Merges JSON body into `data.settings` on the user's portal snapshot (creates snapshot if missing).

router.patch("/settings", async (req, res, next) => {
  try {
    const patch = req.body;
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      return res.status(400).json({ error: "Body must be a JSON object" });
    }

    const key = customerSnapshotKey(req.user.id);
    const row = await prisma.portalSnapshot.findUnique({ where: { key } });
    const prev = asDataObject(row?.data);
    const prevSettings = asDataObject(prev.settings);
    const nextData = {
      ...prev,
      settings: { ...prevSettings, ...patch },
    };

    await prisma.portalSnapshot.upsert({
      where: { key },
      create: { key, data: nextData },
      update: { data: nextData },
    });

    res.json({ ok: true, settings: nextData.settings });
  } catch (err) {
    next(err);
  }
});

// ─────────────── GET /customer/snapshot ───────────────

router.get("/snapshot", async (req, res, next) => {
  try {
    const row = await prisma.portalSnapshot.findUnique({
      where: { key: customerSnapshotKey(req.user.id) },
    });
    if (!row) {
      return res.status(404).json({ error: "No snapshot stored yet" });
    }
    res.json({ data: row.data });
  } catch (err) {
    next(err);
  }
});

// ─────────────── PUT /customer/snapshot ───────────────

router.put("/snapshot", async (req, res, next) => {
  try {
    const body = snapshotPutSchema.parse(req.body);
    const key = customerSnapshotKey(req.user.id);
    await prisma.portalSnapshot.upsert({
      where: { key },
      create: { key, data: body.data },
      update: { data: body.data },
    });
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || "Invalid body" });
    }
    next(err);
  }
});

// ─────────────── POST /customer/events ───────────────
// Accepted for offline sync; durable handling can be added later.

const eventSchema = z.object({
  type: z.string().min(1),
}).passthrough();

router.post("/events", async (req, res, next) => {
  try {
    eventSchema.parse(req.body);
    res.status(202).json({ ok: true, accepted: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || "Invalid event" });
    }
    next(err);
  }
});

router.use(customerEntities);

export default router;

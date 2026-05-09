import { Router } from "express";
import { z } from "zod";
import prisma from "../utils/prisma.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

const snapshotPutSchema = z.object({
  data: z.unknown(),
});

function customerSnapshotKey(userId) {
  return `customer:${userId}`;
}

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

export default router;

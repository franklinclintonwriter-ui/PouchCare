import { Router } from "express";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  authenticate,
  requirePortal,
  type AuthRequest,
} from "@/middleware/auth";
import { ok, created, badRequest, notFound, serverError } from "@/lib/response";
import { getPaginationParams, buildMeta } from "@/lib/pagination";
import { validate } from "@/middleware/validate";
import { searchDomains } from "@/lib/namecom";
import { env } from "@/config/env";

const router = Router();

// ── Public routes (no auth) ─────────────────────────────────────────

// GET /portal/hosting/search — Domain availability check (public, uses Name.com API)
router.get("/search", async (req, res) => {
  try {
    const q = (
      (req.query.q as string) ||
      (req.query.query as string) ||
      ""
    ).trim();
    if (!q || q.length < 2) {
      return badRequest(res, "Query must be at least 2 characters");
    }

    // If Name.com credentials are configured, use the real API
    if (env.NAMECOM_USERNAME && env.NAMECOM_TOKEN) {
      const results = await searchDomains(q);
      const mapped = results.map((r) => ({
        fqdn: r.domainName,
        tld: r.tld,
        available: r.purchasable ?? false,
        pricePerYearUsd: r.purchasePrice ?? 0,
        renewalPriceUsd: r.renewalPrice ?? 0,
        premium: r.premium ?? false,
        purchaseType: r.purchaseType ?? "registration",
      }));
      return ok(res, mapped);
    }

    // Fallback: mock results when no Name.com credentials
    const tlds = ["com", "net", "io", "co"];
    const candidates = tlds.map((tld) => `${q}.${tld}`);
    const existing = await prisma.domain.findMany({
      where: { domainName: { in: candidates } },
      select: { domainName: true },
    });
    const taken = new Set(existing.map((d) => d.domainName));

    const pricing: Record<string, number> = {
      com: 12.99,
      net: 11.99,
      io: 34.99,
      co: 29.99,
    };
    const suggestions = tlds.map((tld) => ({
      fqdn: `${q}.${tld}`,
      tld,
      available: !taken.has(`${q}.${tld}`),
      pricePerYearUsd: pricing[tld],
      renewalPriceUsd: pricing[tld],
      premium: false,
      purchaseType: "registration",
    }));

    return ok(res, suggestions);
  } catch (e) {
    console.error("[portal/hosting/search]", e);
    return serverError(res);
  }
});

// ── Authenticated routes ────────────────────────────────────────────
router.use(authenticate, requirePortal);

// Validation schemas
const createDomainSchema = z.object({
  domainName: z.string().min(3).max(253),
  registrar: z.string().optional(),
  autoRenew: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

const updateDomainSchema = z.object({
  autoRenew: z.boolean().optional(),
  notes: z.string().optional(),
  nameservers: z.array(z.string()).optional(),
});

const dnsRecordSchema = z.object({
  type: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS"]),
  name: z.string(),
  value: z.string(),
  ttl: z.number().int().positive().optional().default(3600),
  priority: z.number().int().optional(),
});

// GET /portal/hosting/domains — List domains owned by portal member
router.get("/domains", async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);

    const where: any = { portalMemberId: req.user!.id };
    const [items, total] = await Promise.all([
      prisma.domain.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.domain.count({ where }),
    ]);
    return ok(res, items, buildMeta(total, page, limit));
  } catch (e) {
    console.error("[portal/hosting/domains]", e);
    return serverError(res);
  }
});

// POST /portal/hosting/domains — Register/add new domain
router.post(
  "/domains",
  validate(createDomainSchema),
  async (req: AuthRequest, res) => {
    try {
      const { domainName, registrar, autoRenew, notes } = req.body;

      // Check if domain already exists
      const existing = await prisma.domain.findUnique({
        where: { domainName },
      });
      if (existing) return badRequest(res, "Domain already registered");

      // Create domain record with portalMemberId
      const domain = await prisma.domain.create({
        data: {
          domainName,
          registrar: registrar || "PouchCare",
          status: "Active",
          registrationDate: new Date(),
          notes: notes || undefined,
          portalMemberId: req.user!.id,
        },
      });

      return created(res, {
        ...domain,
        autoRenew: autoRenew ?? true,
        dnsRecords: [],
      });
    } catch (e) {
      console.error("[portal/hosting/domains]", e);
      return serverError(res);
    }
  },
);

// GET /portal/hosting/domains/:id — Domain detail
router.get("/domains/:id", async (req: AuthRequest, res) => {
  try {
    const domain = await prisma.domain.findFirst({
      where: { id: req.params.id, portalMemberId: req.user!.id },
    });
    if (!domain) return notFound(res, "Domain");

    // Parse DNS records if stored as JSON string
    let dnsRecords: any[] = [];
    if (domain.notes) {
      try {
        const parsed = JSON.parse(domain.notes);
        if (parsed.dnsRecords) dnsRecords = parsed.dnsRecords;
      } catch {
        // Notes is just text, not JSON
      }
    }

    return ok(res, {
      ...domain,
      dnsRecords,
      ssl: {
        status: domain.sslStatus || "not-configured",
        expiresAt: null,
        autoRenew: true,
      },
      usage: {
        bandwidthGb: 0,
        storageGb: 0,
      },
    });
  } catch (e) {
    console.error("[portal/hosting/domains]", e);
    return serverError(res);
  }
});

// PATCH /portal/hosting/domains/:id — Update domain
router.patch(
  "/domains/:id",
  validate(updateDomainSchema),
  async (req: AuthRequest, res) => {
    try {
      const domain = await prisma.domain.findFirst({
        where: { id: req.params.id, portalMemberId: req.user!.id },
      });
      if (!domain) return notFound(res, "Domain");

      const { autoRenew, notes, nameservers } = req.body;

      // Build update data
      const updateData: any = {};
      if (notes !== undefined) updateData.notes = notes;
      if (nameservers) {
        // Store nameservers in notes as JSON
        const existing = domain.notes
          ? JSON.parse(domain.notes).nameservers
          : [];
        updateData.notes = JSON.stringify({
          ...JSON.parse(domain.notes || "{}"),
          nameservers,
        });
      }

      const updated = await prisma.domain.update({
        where: { id: req.params.id },
        data: updateData,
      });

      return ok(res, {
        ...updated,
        autoRenew: autoRenew ?? true,
      });
    } catch (e) {
      console.error("[portal/hosting/domains]", e);
      return serverError(res);
    }
  },
);

// DELETE /portal/hosting/domains/:id — Remove domain
router.delete("/domains/:id", async (req: AuthRequest, res) => {
  try {
    const domain = await prisma.domain.findFirst({
      where: { id: req.params.id, portalMemberId: req.user!.id },
    });
    if (!domain) return notFound(res, "Domain");

    await prisma.domain.delete({
      where: { id: req.params.id },
    });

    return ok(res, { message: "Domain deleted" });
  } catch (e) {
    console.error("[portal/hosting/domains]", e);
    return serverError(res);
  }
});

// POST /portal/hosting/domains/:id/dns — Add DNS record
router.post(
  "/domains/:id/dns",
  validate(dnsRecordSchema),
  async (req: AuthRequest, res) => {
    try {
      const domain = await prisma.domain.findFirst({
        where: { id: req.params.id, portalMemberId: req.user!.id },
      });
      if (!domain) return notFound(res, "Domain");

      const record = {
        id: `dns_${Date.now()}`,
        ...req.body,
        createdAt: new Date().toISOString(),
      };

      // Parse existing DNS records
      let existing = domain.notes ? JSON.parse(domain.notes) : {};
      if (!existing.dnsRecords) existing.dnsRecords = [];
      existing.dnsRecords.push(record);

      await prisma.domain.update({
        where: { id: req.params.id },
        data: { notes: JSON.stringify(existing) },
      });

      return created(res, record);
    } catch (e) {
      console.error("[portal/hosting/domains/:id/dns]", e);
      return serverError(res);
    }
  },
);

// PATCH /portal/hosting/domains/:id/dns/:recordId — Update DNS record
router.patch(
  "/domains/:id/dns/:recordId",
  validate(dnsRecordSchema),
  async (req: AuthRequest, res) => {
    try {
      const domain = await prisma.domain.findFirst({
        where: { id: req.params.id, portalMemberId: req.user!.id },
      });
      if (!domain) return notFound(res, "Domain");

      const existing = domain.notes ? JSON.parse(domain.notes) : {};
      if (!existing.dnsRecords) return notFound(res, "DNS record");

      const recordIdx = existing.dnsRecords.findIndex(
        (r: any) => r.id === req.params.recordId,
      );
      if (recordIdx === -1) return notFound(res, "DNS record");

      existing.dnsRecords[recordIdx] = {
        ...existing.dnsRecords[recordIdx],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      await prisma.domain.update({
        where: { id: req.params.id },
        data: { notes: JSON.stringify(existing) },
      });

      return ok(res, existing.dnsRecords[recordIdx]);
    } catch (e) {
      console.error("[portal/hosting/domains/:id/dns/:recordId]", e);
      return serverError(res);
    }
  },
);

// DELETE /portal/hosting/domains/:id/dns/:recordId — Remove DNS record
router.delete("/domains/:id/dns/:recordId", async (req: AuthRequest, res) => {
  try {
    const domain = await prisma.domain.findFirst({
      where: { id: req.params.id, portalMemberId: req.user!.id },
    });
    if (!domain) return notFound(res, "Domain");

    const existing = domain.notes ? JSON.parse(domain.notes) : {};
    if (!existing.dnsRecords) return notFound(res, "DNS record");

    const recordIdx = existing.dnsRecords.findIndex(
      (r: any) => r.id === req.params.recordId,
    );
    if (recordIdx === -1) return notFound(res, "DNS record");

    existing.dnsRecords.splice(recordIdx, 1);

    await prisma.domain.update({
      where: { id: req.params.id },
      data: { notes: JSON.stringify(existing) },
    });

    return ok(res, { message: "DNS record deleted" });
  } catch (e) {
    console.error("[portal/hosting/domains/:id/dns/:recordId]", e);
    return serverError(res);
  }
});

export default router;

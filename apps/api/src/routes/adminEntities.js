import { Router } from "express";
import { randomUUID } from "node:crypto";
import { mutateSnapshotByKey } from "../utils/snapshotStore.js";

const router = Router();

function adminKey(userId) {
  return `admin:${userId}`;
}

function nowLabel() {
  return new Date().toISOString().slice(0, 10);
}

function newId(prefix) {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function defaultCompany(body) {
  const id = body.id || newId("co");
  const { id: _drop, ...rest } = body;
  return {
    id,
    updated: nowLabel(),
    websites: 0,
    mrr: 0,
    suspension: { reason: "", notes: "", suspendedAt: null },
    usageLimits: { maxWebsites: 1, maxSeats: 1, monthlyPageViews: 1000, storageGb: 5 },
    internalNotes: [],
    websitesList: [],
    subscriptions: [],
    invoices: [],
    auditEvents: [],
    ...rest,
  };
}

// ─────────────── companies ───────────────

router.post("/companies", async (req, res, next) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const company = defaultCompany(body);
    const data = await mutateSnapshotByKey(adminKey(req.user.id), (d) => {
      const companies = Array.isArray(d.companies) ? [...d.companies] : [];
      companies.unshift(company);
      return { ...d, companies };
    });
    const created = data.companies.find((c) => c.id === company.id);
    res.status(201).json({ ok: true, company: created });
  } catch (e) {
    next(e);
  }
});

router.patch("/companies/:companyId", async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const patch = req.body && typeof req.body === "object" ? req.body : {};
    let notFound = false;
    const data = await mutateSnapshotByKey(adminKey(req.user.id), (d) => {
      const companies = Array.isArray(d.companies) ? [...d.companies] : [];
      const idx = companies.findIndex((c) => c.id === companyId);
      if (idx === -1) {
        notFound = true;
        return d;
      }
      companies[idx] = { ...companies[idx], ...patch, updated: nowLabel() };
      return { ...d, companies };
    });
    if (notFound) return res.status(404).json({ error: "Company not found" });
    const company = data.companies.find((c) => c.id === companyId);
    res.json({ ok: true, company });
  } catch (e) {
    next(e);
  }
});

router.delete("/companies/:companyId", async (req, res, next) => {
  try {
    const { companyId } = req.params;
    let found = false;
    await mutateSnapshotByKey(adminKey(req.user.id), (d) => {
      const companies = Array.isArray(d.companies) ? d.companies : [];
      if (!companies.some((c) => c.id === companyId)) return d;
      found = true;
      return { ...d, companies: companies.filter((c) => c.id !== companyId) };
    });
    if (!found) return res.status(404).json({ error: "Company not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/companies/:companyId/suspend", async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const body = req.body && typeof req.body === "object" ? req.body : {};
    let notFound = false;
    const data = await mutateSnapshotByKey(adminKey(req.user.id), (d) => {
      const companies = Array.isArray(d.companies) ? [...d.companies] : [];
      const idx = companies.findIndex((c) => c.id === companyId);
      if (idx === -1) {
        notFound = true;
        return d;
      }
      companies[idx] = {
        ...companies[idx],
        status: "Suspended",
        updated: nowLabel(),
        suspension: {
          reason: body.reason || "",
          notes: body.notes || "",
          suspendedAt: nowLabel(),
        },
      };
      return { ...d, companies };
    });
    if (notFound) return res.status(404).json({ error: "Company not found" });
    res.json({ ok: true, company: data.companies.find((c) => c.id === companyId) });
  } catch (e) {
    next(e);
  }
});

router.post("/companies/:companyId/activate", async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const body = req.body && typeof req.body === "object" ? req.body : {};
    let notFound = false;
    const data = await mutateSnapshotByKey(adminKey(req.user.id), (d) => {
      const companies = Array.isArray(d.companies) ? [...d.companies] : [];
      const idx = companies.findIndex((c) => c.id === companyId);
      if (idx === -1) {
        notFound = true;
        return d;
      }
      companies[idx] = {
        ...companies[idx],
        status: "Active",
        updated: nowLabel(),
        suspension: { reason: "", notes: body.notes || "", suspendedAt: null },
      };
      return { ...d, companies };
    });
    if (notFound) return res.status(404).json({ error: "Company not found" });
    res.json({ ok: true, company: data.companies.find((c) => c.id === companyId) });
  } catch (e) {
    next(e);
  }
});

router.patch("/companies/:companyId/usage-limits", async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const limits = req.body && typeof req.body === "object" ? req.body : {};
    let notFound = false;
    const data = await mutateSnapshotByKey(adminKey(req.user.id), (d) => {
      const companies = Array.isArray(d.companies) ? [...d.companies] : [];
      const idx = companies.findIndex((c) => c.id === companyId);
      if (idx === -1) {
        notFound = true;
        return d;
      }
      const prevLimits =
        companies[idx].usageLimits && typeof companies[idx].usageLimits === "object"
          ? companies[idx].usageLimits
          : {};
      companies[idx] = {
        ...companies[idx],
        usageLimits: { ...prevLimits, ...limits },
        updated: nowLabel(),
      };
      return { ...d, companies };
    });
    if (notFound) return res.status(404).json({ error: "Company not found" });
    res.json({ ok: true, company: data.companies.find((c) => c.id === companyId) });
  } catch (e) {
    next(e);
  }
});

router.post("/companies/:companyId/notes", async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const body = req.body && typeof req.body === "object" ? req.body : {};
    if (!body.text) return res.status(400).json({ error: "text is required" });
    const author = body.author || "Admin";
    const note = { id: newId("note"), text: body.text, author, createdAt: nowLabel() };
    let notFound = false;
    const data = await mutateSnapshotByKey(adminKey(req.user.id), (d) => {
      const companies = Array.isArray(d.companies) ? [...d.companies] : [];
      const idx = companies.findIndex((c) => c.id === companyId);
      if (idx === -1) {
        notFound = true;
        return d;
      }
      const internalNotes = Array.isArray(companies[idx].internalNotes)
        ? [...companies[idx].internalNotes]
        : [];
      internalNotes.unshift(note);
      companies[idx] = { ...companies[idx], internalNotes, updated: nowLabel() };
      return { ...d, companies };
    });
    if (notFound) return res.status(404).json({ error: "Company not found" });
    res.status(201).json({ ok: true, note });
  } catch (e) {
    next(e);
  }
});

router.patch("/companies/:companyId/notes/:noteId", async (req, res, next) => {
  try {
    const { companyId, noteId } = req.params;
    const body = req.body && typeof req.body === "object" ? req.body : {};
    if (body.text === undefined) return res.status(400).json({ error: "text is required" });
    let notFound = false;
    let noteMiss = false;
    await mutateSnapshotByKey(adminKey(req.user.id), (d) => {
      const companies = Array.isArray(d.companies) ? [...d.companies] : [];
      const idx = companies.findIndex((c) => c.id === companyId);
      if (idx === -1) {
        notFound = true;
        return d;
      }
      const internalNotes = Array.isArray(companies[idx].internalNotes)
        ? [...companies[idx].internalNotes]
        : [];
      const nIdx = internalNotes.findIndex((n) => n.id === noteId);
      if (nIdx === -1) {
        noteMiss = true;
        return d;
      }
      internalNotes[nIdx] = { ...internalNotes[nIdx], text: body.text };
      companies[idx] = { ...companies[idx], internalNotes, updated: nowLabel() };
      return { ...d, companies };
    });
    if (notFound) return res.status(404).json({ error: "Company not found" });
    if (noteMiss) return res.status(404).json({ error: "Note not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete("/companies/:companyId/notes/:noteId", async (req, res, next) => {
  try {
    const { companyId, noteId } = req.params;
    let notFound = false;
    let noteMiss = false;
    await mutateSnapshotByKey(adminKey(req.user.id), (d) => {
      const companies = Array.isArray(d.companies) ? [...d.companies] : [];
      const idx = companies.findIndex((c) => c.id === companyId);
      if (idx === -1) {
        notFound = true;
        return d;
      }
      const internalNotes = Array.isArray(companies[idx].internalNotes)
        ? companies[idx].internalNotes
        : [];
      if (!internalNotes.some((n) => n.id === noteId)) {
        noteMiss = true;
        return d;
      }
      companies[idx] = {
        ...companies[idx],
        internalNotes: internalNotes.filter((n) => n.id !== noteId),
        updated: nowLabel(),
      };
      return { ...d, companies };
    });
    if (notFound) return res.status(404).json({ error: "Company not found" });
    if (noteMiss) return res.status(404).json({ error: "Note not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ─────────────── team members ───────────────

router.post("/team-members", async (req, res, next) => {
  try {
    const payload = req.body && typeof req.body === "object" ? { ...req.body } : {};
    const id = payload.id || newId("tm");
    delete payload.id;
    const data = await mutateSnapshotByKey(adminKey(req.user.id), (d) => {
      const teamMembers = Array.isArray(d.teamMembers) ? [...d.teamMembers] : [];
      const row = { id, updated: nowLabel(), ...payload };
      teamMembers.unshift(row);
      return { ...d, teamMembers };
    });
    const member = data.teamMembers.find((m) => m.id === id);
    res.status(201).json({ ok: true, member });
  } catch (e) {
    next(e);
  }
});

router.patch("/team-members/:memberId", async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const patch = req.body && typeof req.body === "object" ? req.body : {};
    let notFound = false;
    const data = await mutateSnapshotByKey(adminKey(req.user.id), (d) => {
      const teamMembers = Array.isArray(d.teamMembers) ? [...d.teamMembers] : [];
      const idx = teamMembers.findIndex((m) => m.id === memberId);
      if (idx === -1) {
        notFound = true;
        return d;
      }
      teamMembers[idx] = { ...teamMembers[idx], ...patch, updated: nowLabel() };
      return { ...d, teamMembers };
    });
    if (notFound) return res.status(404).json({ error: "Team member not found" });
    res.json({ ok: true, member: data.teamMembers.find((m) => m.id === memberId) });
  } catch (e) {
    next(e);
  }
});

router.delete("/team-members/:memberId", async (req, res, next) => {
  try {
    const { memberId } = req.params;
    let found = false;
    await mutateSnapshotByKey(adminKey(req.user.id), (d) => {
      const teamMembers = Array.isArray(d.teamMembers) ? d.teamMembers : [];
      if (!teamMembers.some((m) => m.id === memberId)) return d;
      found = true;
      return { ...d, teamMembers: teamMembers.filter((m) => m.id !== memberId) };
    });
    if (!found) return res.status(404).json({ error: "Team member not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ─────────────── billing records ───────────────

router.post("/billing-records", async (req, res, next) => {
  try {
    const payload = req.body && typeof req.body === "object" ? { ...req.body } : {};
    const id = payload.id || newId("inv");
    delete payload.id;
    const data = await mutateSnapshotByKey(adminKey(req.user.id), (d) => {
      const billingRecords = Array.isArray(d.billingRecords) ? [...d.billingRecords] : [];
      const row = { id, updated: nowLabel(), ...payload };
      billingRecords.unshift(row);
      return { ...d, billingRecords };
    });
    const record = data.billingRecords.find((r) => r.id === id);
    res.status(201).json({ ok: true, record });
  } catch (e) {
    next(e);
  }
});

router.patch("/billing-records/:recordId", async (req, res, next) => {
  try {
    const { recordId } = req.params;
    const patch = req.body && typeof req.body === "object" ? req.body : {};
    let notFound = false;
    const data = await mutateSnapshotByKey(adminKey(req.user.id), (d) => {
      const billingRecords = Array.isArray(d.billingRecords) ? [...d.billingRecords] : [];
      const idx = billingRecords.findIndex((r) => r.id === recordId);
      if (idx === -1) {
        notFound = true;
        return d;
      }
      billingRecords[idx] = { ...billingRecords[idx], ...patch, updated: nowLabel() };
      return { ...d, billingRecords };
    });
    if (notFound) return res.status(404).json({ error: "Billing record not found" });
    res.json({ ok: true, record: data.billingRecords.find((r) => r.id === recordId) });
  } catch (e) {
    next(e);
  }
});

router.delete("/billing-records/:recordId", async (req, res, next) => {
  try {
    const { recordId } = req.params;
    let found = false;
    await mutateSnapshotByKey(adminKey(req.user.id), (d) => {
      const billingRecords = Array.isArray(d.billingRecords) ? d.billingRecords : [];
      if (!billingRecords.some((r) => r.id === recordId)) return d;
      found = true;
      return { ...d, billingRecords: billingRecords.filter((r) => r.id !== recordId) };
    });
    if (!found) return res.status(404).json({ error: "Billing record not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

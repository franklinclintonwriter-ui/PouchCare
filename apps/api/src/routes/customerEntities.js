import { Router } from "express";
import { randomUUID } from "node:crypto";
import { mutateSnapshotByKey } from "../utils/snapshotStore.js";

const router = Router();

function customerKey(userId) {
  return `customer:${userId}`;
}

function companyScope(req) {
  const h = req.headers["x-pouchcare-company-id"];
  return typeof h === "string" ? h.trim() : "";
}

function nowLabel() {
  return new Date().toISOString().slice(0, 10);
}

function newId(prefix) {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function ensureBilling(data) {
  const billing = data.billing && typeof data.billing === "object" ? { ...data.billing } : {};
  if (!Array.isArray(billing.paymentMethods)) billing.paymentMethods = [];
  if (!Array.isArray(billing.invoices)) billing.invoices = [];
  return billing;
}

function ensureSettings(data) {
  const settings = data.settings && typeof data.settings === "object" ? { ...data.settings } : {};
  if (!Array.isArray(settings.apiKeys)) settings.apiKeys = [];
  return settings;
}

function scopedCompanyId(req, body) {
  return companyScope(req) || (body && typeof body.companyId === "string" ? body.companyId.trim() : "");
}

function matchesCompanyScope(req, item) {
  const scope = companyScope(req);
  if (!scope) return true;
  return item?.companyId === scope;
}

// ─────────────── websites ───────────────

router.post("/websites", async (req, res, next) => {
  try {
    const scope = scopedCompanyId(req, req.body);
    if (!scope) {
      return res.status(400).json({ error: "X-PouchCare-Company-Id or companyId is required" });
    }
    const payload = req.body && typeof req.body === "object" ? { ...req.body } : {};
    delete payload.companyId;
    const id = payload.id || newId("w");
    delete payload.id;
    const data = await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const websites = Array.isArray(d.websites) ? [...d.websites] : [];
      const row = { id, companyId: scope, updated: nowLabel(), ...payload };
      websites.unshift(row);
      return { ...d, websites };
    });
    const website = data.websites.find((w) => w.id === id);
    res.status(201).json({ ok: true, website });
  } catch (e) {
    next(e);
  }
});

router.patch("/websites/:websiteId", async (req, res, next) => {
  try {
    const { websiteId } = req.params;
    const patch = req.body && typeof req.body === "object" ? req.body : {};
    let notFound = false;
    const data = await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const websites = Array.isArray(d.websites) ? [...d.websites] : [];
      const idx = websites.findIndex((w) => w.id === websiteId);
      if (idx === -1) {
        notFound = true;
        return d;
      }
      if (!matchesCompanyScope(req, websites[idx])) {
        throw new Error("FORBIDDEN_COMPANY");
      }
      websites[idx] = { ...websites[idx], ...patch, updated: nowLabel() };
      return { ...d, websites };
    });
    if (notFound) return res.status(404).json({ error: "Website not found" });
    const website = data.websites.find((w) => w.id === websiteId);
    res.json({ ok: true, website });
  } catch (e) {
    if (e.message === "FORBIDDEN_COMPANY") return res.status(403).json({ error: "Company scope mismatch" });
    next(e);
  }
});

router.delete("/websites/:websiteId", async (req, res, next) => {
  try {
    const { websiteId } = req.params;
    let found = false;
    await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const websites = Array.isArray(d.websites) ? d.websites : [];
      const target = websites.find((w) => w.id === websiteId);
      if (!target) return d;
      if (!matchesCompanyScope(req, target)) {
        const err = new Error("FORBIDDEN_COMPANY");
        throw err;
      }
      found = true;
      return { ...d, websites: websites.filter((w) => w.id !== websiteId) };
    });
    if (!found) return res.status(404).json({ error: "Website not found" });
    res.json({ ok: true });
  } catch (e) {
    if (e.message === "FORBIDDEN_COMPANY") return res.status(403).json({ error: "Company scope mismatch" });
    next(e);
  }
});

// ─────────────── subscriptions ───────────────

router.post("/subscriptions", async (req, res, next) => {
  try {
    const scope = scopedCompanyId(req, req.body);
    if (!scope) return res.status(400).json({ error: "X-PouchCare-Company-Id or companyId is required" });
    const payload = req.body && typeof req.body === "object" ? { ...req.body } : {};
    delete payload.companyId;
    const id = payload.id || newId("s");
    delete payload.id;
    const data = await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const subscriptions = Array.isArray(d.subscriptions) ? [...d.subscriptions] : [];
      const row = { id, companyId: scope, ...payload };
      subscriptions.unshift(row);
      return { ...d, subscriptions };
    });
    const subscription = data.subscriptions.find((s) => s.id === id);
    res.status(201).json({ ok: true, subscription });
  } catch (e) {
    next(e);
  }
});

router.patch("/subscriptions/:subscriptionId", async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const patch = req.body && typeof req.body === "object" ? req.body : {};
    let notFound = false;
    const data = await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const list = Array.isArray(d.subscriptions) ? [...d.subscriptions] : [];
      const idx = list.findIndex((x) => x.id === subscriptionId);
      if (idx === -1) {
        notFound = true;
        return d;
      }
      if (!matchesCompanyScope(req, list[idx])) throw new Error("FORBIDDEN_COMPANY");
      list[idx] = { ...list[idx], ...patch };
      return { ...d, subscriptions: list };
    });
    if (notFound) return res.status(404).json({ error: "Subscription not found" });
    const subscription = data.subscriptions.find((s) => s.id === subscriptionId);
    res.json({ ok: true, subscription });
  } catch (e) {
    if (e.message === "FORBIDDEN_COMPANY") return res.status(403).json({ error: "Company scope mismatch" });
    next(e);
  }
});

router.delete("/subscriptions/:subscriptionId", async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    let found = false;
    await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const list = Array.isArray(d.subscriptions) ? d.subscriptions : [];
      const target = list.find((x) => x.id === subscriptionId);
      if (!target) return d;
      if (!matchesCompanyScope(req, target)) throw new Error("FORBIDDEN_COMPANY");
      found = true;
      return { ...d, subscriptions: list.filter((x) => x.id !== subscriptionId) };
    });
    if (!found) return res.status(404).json({ error: "Subscription not found" });
    res.json({ ok: true });
  } catch (e) {
    if (e.message === "FORBIDDEN_COMPANY") return res.status(403).json({ error: "Company scope mismatch" });
    next(e);
  }
});

// ─────────────── plugins ───────────────

router.post("/plugins", async (req, res, next) => {
  try {
    const scope = scopedCompanyId(req, req.body);
    if (!scope) return res.status(400).json({ error: "X-PouchCare-Company-Id or companyId is required" });
    const payload = req.body && typeof req.body === "object" ? { ...req.body } : {};
    delete payload.companyId;
    const id = payload.id || newId("p");
    delete payload.id;
    const data = await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const plugins = Array.isArray(d.plugins) ? [...d.plugins] : [];
      const row = { id, companyId: scope, updated: nowLabel(), ...payload };
      plugins.unshift(row);
      return { ...d, plugins };
    });
    const plugin = data.plugins.find((p) => p.id === id);
    res.status(201).json({ ok: true, plugin });
  } catch (e) {
    next(e);
  }
});

router.patch("/plugins/:pluginId", async (req, res, next) => {
  try {
    const { pluginId } = req.params;
    const patch = req.body && typeof req.body === "object" ? req.body : {};
    let notFound = false;
    const data = await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const list = Array.isArray(d.plugins) ? [...d.plugins] : [];
      const idx = list.findIndex((x) => x.id === pluginId);
      if (idx === -1) {
        notFound = true;
        return d;
      }
      if (!matchesCompanyScope(req, list[idx])) throw new Error("FORBIDDEN_COMPANY");
      list[idx] = { ...list[idx], ...patch, updated: nowLabel() };
      return { ...d, plugins: list };
    });
    if (notFound) return res.status(404).json({ error: "Plugin not found" });
    const plugin = data.plugins.find((p) => p.id === pluginId);
    res.json({ ok: true, plugin });
  } catch (e) {
    if (e.message === "FORBIDDEN_COMPANY") return res.status(403).json({ error: "Company scope mismatch" });
    next(e);
  }
});

router.delete("/plugins/:pluginId", async (req, res, next) => {
  try {
    const { pluginId } = req.params;
    let found = false;
    await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const list = Array.isArray(d.plugins) ? d.plugins : [];
      const target = list.find((x) => x.id === pluginId);
      if (!target) return d;
      if (!matchesCompanyScope(req, target)) throw new Error("FORBIDDEN_COMPANY");
      found = true;
      return { ...d, plugins: list.filter((x) => x.id !== pluginId) };
    });
    if (!found) return res.status(404).json({ error: "Plugin not found" });
    res.json({ ok: true });
  } catch (e) {
    if (e.message === "FORBIDDEN_COMPANY") return res.status(403).json({ error: "Company scope mismatch" });
    next(e);
  }
});

// ─────────────── tickets (not company-scoped in UI) ───────────────

router.post("/tickets", async (req, res, next) => {
  try {
    const payload = req.body && typeof req.body === "object" ? { ...req.body } : {};
    const id = payload.id || newId("T");
    delete payload.id;
    const data = await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const tickets = Array.isArray(d.tickets) ? [...d.tickets] : [];
      const row = { id, updated: nowLabel(), ...payload };
      tickets.unshift(row);
      return { ...d, tickets };
    });
    const ticket = data.tickets.find((t) => t.id === id);
    res.status(201).json({ ok: true, ticket });
  } catch (e) {
    next(e);
  }
});

router.patch("/tickets/:ticketId", async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const patch = req.body && typeof req.body === "object" ? req.body : {};
    let notFound = false;
    const data = await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const tickets = Array.isArray(d.tickets) ? [...d.tickets] : [];
      const idx = tickets.findIndex((t) => t.id === ticketId);
      if (idx === -1) {
        notFound = true;
        return d;
      }
      tickets[idx] = { ...tickets[idx], ...patch, updated: nowLabel() };
      return { ...d, tickets };
    });
    if (notFound) return res.status(404).json({ error: "Ticket not found" });
    const ticket = data.tickets.find((t) => t.id === ticketId);
    res.json({ ok: true, ticket });
  } catch (e) {
    next(e);
  }
});

router.delete("/tickets/:ticketId", async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    let found = false;
    await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const tickets = Array.isArray(d.tickets) ? d.tickets : [];
      if (!tickets.some((t) => t.id === ticketId)) return d;
      found = true;
      return { ...d, tickets: tickets.filter((t) => t.id !== ticketId) };
    });
    if (!found) return res.status(404).json({ error: "Ticket not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ─────────────── payment methods ───────────────

router.post("/payment-methods", async (req, res, next) => {
  try {
    const payload = req.body && typeof req.body === "object" ? { ...req.body } : {};
    const id = payload.id || newId("pm");
    delete payload.id;
    const data = await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const billing = ensureBilling(d);
      const row = { id, updated: nowLabel(), ...payload };
      billing.paymentMethods = [row, ...billing.paymentMethods];
      return { ...d, billing };
    });
    const pm = data.billing.paymentMethods.find((x) => x.id === id);
    res.status(201).json({ ok: true, paymentMethod: pm });
  } catch (e) {
    next(e);
  }
});

router.delete("/payment-methods/:paymentMethodId", async (req, res, next) => {
  try {
    const { paymentMethodId } = req.params;
    let found = false;
    await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const billing = ensureBilling(d);
      if (!billing.paymentMethods.some((x) => x.id === paymentMethodId)) return d;
      found = true;
      billing.paymentMethods = billing.paymentMethods.filter((x) => x.id !== paymentMethodId);
      return { ...d, billing };
    });
    if (!found) return res.status(404).json({ error: "Payment method not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ─────────────── API keys ───────────────

router.post("/api-keys", async (req, res, next) => {
  try {
    const payload = req.body && typeof req.body === "object" ? { ...req.body } : {};
    const id = payload.id || newId("k");
    delete payload.id;
    const data = await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const settings = ensureSettings(d);
      const row = { id, updated: nowLabel(), ...payload };
      settings.apiKeys = [row, ...settings.apiKeys];
      return { ...d, settings };
    });
    const key = data.settings.apiKeys.find((x) => x.id === id);
    res.status(201).json({ ok: true, apiKey: key });
  } catch (e) {
    next(e);
  }
});

router.delete("/api-keys/:apiKeyId", async (req, res, next) => {
  try {
    const { apiKeyId } = req.params;
    let found = false;
    await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const settings = ensureSettings(d);
      if (!settings.apiKeys.some((x) => x.id === apiKeyId)) return d;
      found = true;
      settings.apiKeys = settings.apiKeys.filter((x) => x.id !== apiKeyId);
      return { ...d, settings };
    });
    if (!found) return res.status(404).json({ error: "API key not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ─────────────── invitations ───────────────

function appendInvitation(data, inv) {
  const pendingInvitations = Array.isArray(data.pendingInvitations) ? [...data.pendingInvitations] : [];
  pendingInvitations.unshift(inv);
  return { ...data, pendingInvitations };
}

router.post("/invitations", async (req, res, next) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const companyId = scopedCompanyId(req, body) || (typeof body.companyId === "string" ? body.companyId : "");
    if (!companyId) return res.status(400).json({ error: "companyId is required" });
    if (!body.email || !body.role) {
      return res.status(400).json({ error: "email and role are required" });
    }
    const id = body.id || newId("inv");
    const row = {
      id,
      email: body.email,
      role: body.role,
      companyId,
      status: body.status || "Pending",
      updated: body.updated || nowLabel(),
    };
    const data = await mutateSnapshotByKey(customerKey(req.user.id), (d) => appendInvitation(d, row));
    const invitation = data.pendingInvitations.find((i) => i.id === id);
    res.status(201).json({ ok: true, invitation });
  } catch (e) {
    next(e);
  }
});

router.post("/companies/:companyId/invitations", async (req, res, next) => {
  try {
    const companyId = req.params.companyId;
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const id = body.id || newId("inv");
    if (!body.email || !body.role) {
      return res.status(400).json({ error: "email and role are required" });
    }
    const row = {
      id,
      email: body.email,
      role: body.role,
      companyId,
      status: body.status || "Pending",
      updated: body.updated || nowLabel(),
    };
    const data = await mutateSnapshotByKey(customerKey(req.user.id), (d) => appendInvitation(d, row));
    const invitation = data.pendingInvitations.find((i) => i.id === id);
    res.status(201).json({ ok: true, invitation });
  } catch (e) {
    next(e);
  }
});

router.delete("/invitations/:invitationId", async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    let found = false;
    await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const list = Array.isArray(d.pendingInvitations) ? d.pendingInvitations : [];
      const target = list.find((i) => i.id === invitationId);
      if (!target) return d;
      if (!matchesCompanyScope(req, target) && companyScope(req)) {
        throw new Error("FORBIDDEN_COMPANY");
      }
      found = true;
      return { ...d, pendingInvitations: list.filter((i) => i.id !== invitationId) };
    });
    if (!found) return res.status(404).json({ error: "Invitation not found" });
    res.json({ ok: true });
  } catch (e) {
    if (e.message === "FORBIDDEN_COMPANY") return res.status(403).json({ error: "Company scope mismatch" });
    next(e);
  }
});

router.post("/invitations/:invitationId/revoke", async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    let found = false;
    await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const list = Array.isArray(d.pendingInvitations) ? d.pendingInvitations : [];
      const target = list.find((i) => i.id === invitationId);
      if (!target) return d;
      if (!matchesCompanyScope(req, target) && companyScope(req)) throw new Error("FORBIDDEN_COMPANY");
      found = true;
      return { ...d, pendingInvitations: list.filter((i) => i.id !== invitationId) };
    });
    if (!found) return res.status(404).json({ error: "Invitation not found" });
    res.json({ ok: true });
  } catch (e) {
    if (e.message === "FORBIDDEN_COMPANY") return res.status(403).json({ error: "Company scope mismatch" });
    next(e);
  }
});

router.delete("/companies/:companyId/invitations/:invitationId", async (req, res, next) => {
  try {
    const { companyId, invitationId } = req.params;
    let found = false;
    await mutateSnapshotByKey(customerKey(req.user.id), (d) => {
      const list = Array.isArray(d.pendingInvitations) ? d.pendingInvitations : [];
      const target = list.find((i) => i.id === invitationId && i.companyId === companyId);
      if (!target) return d;
      found = true;
      return { ...d, pendingInvitations: list.filter((i) => !(i.id === invitationId && i.companyId === companyId)) };
    });
    if (!found) return res.status(404).json({ error: "Invitation not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

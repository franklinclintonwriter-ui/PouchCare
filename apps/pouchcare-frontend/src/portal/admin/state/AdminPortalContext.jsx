/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { adminPortalSeed } from "./seed";
import { fetchAdminSnapshot, persistAdminSnapshot, syncBillingOperation, syncCompanyOperation, syncTeamOperation } from "../api/adminPortalRepository";
import { withUpdated, nowLabel, createId, pushToList, createActivityEntry, createAuditEntry, ACTIVITY_CAP, AUDIT_CAP, NOTIFICATION_CAP } from "../../shared/utils";

const AdminPortalContext = createContext(null);

export function AdminPortalProvider({ children }) {
  const [data, setData] = useState(adminPortalSeed);

  useEffect(() => {
    let active = true;
    fetchAdminSnapshot(adminPortalSeed).then((snapshot) => {
      if (active && snapshot) setData(snapshot);
    });
    return () => {
      active = false;
    };
  }, []);

  const commit = (updater, event = null) => {
    setData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persistAdminSnapshot(next);
      if (event) { if (event.type.startsWith("company.")) syncCompanyOperation(event); else if (event.type.startsWith("team.")) syncTeamOperation(event); else if (event.type.startsWith("billing.")) syncBillingOperation(event); }
      return next;
    });
  };

  function pushActivity(prev, action, actor = "Admin") {
    return {
      ...prev,
      activity: pushToList(prev.activity, createActivityEntry({ action, actor }), ACTIVITY_CAP),
    };
  }

  function pushAudit(prev, entry) {
    return {
      ...prev,
      auditEvents: pushToList(prev.auditEvents, entry, AUDIT_CAP),
    };
  }

  function pushCompanyAudit(company, action, actor = "Admin") {
    return {
      ...company,
      auditEvents: pushToList(
        company.auditEvents || [],
        { id: createId("evt"), title: action, subtitle: actor, updated: nowLabel() },
        40
      ),
    };
  }

  function pushNotification(prev, title, level = "info") {
    const notification = {
      id: createId("n"),
      title,
      level,
      read: false,
      updated: nowLabel(),
    };
    return {
      ...prev,
      notifications: pushToList(prev.notifications || [], notification, NOTIFICATION_CAP),
    };
  }

  const withCompany = (prev, id, updater) => ({
    ...prev,
    companies: withUpdated(prev.companies, id, updater),
  });

  const actions = {
    createCompany: (payload) => {
      const event = { type: "company.create", payload };
      commit((prev) => {
        const company = {
          id: createId("co"),
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
          ...payload,
        };
        const next = { ...prev, companies: [company, ...prev.companies] };
        const withActivity = pushActivity(next, `Company created: ${payload.name}`);
        const withNotif = pushNotification(withActivity, `New company created: ${payload.name}`, "success");
        return pushAudit(withNotif, createAuditEntry({ action: "company.create", target: payload.name, metadata: payload }));
      }, event);
    },

    updateCompany: (id, patch) => {
      const event = { type: "company.update", companyId: id, payload: patch };
      commit((prev) => {
        const target = prev.companies.find((c) => c.id === id);
        const next = withCompany(prev, id, (item) => pushCompanyAudit({ ...item, ...patch, updated: nowLabel() }, "Company profile updated"));
        const withActivity = pushActivity(next, `Company updated: ${target?.name || id}`);
        return pushAudit(withActivity, createAuditEntry({ action: "company.update", target: target?.name || id, metadata: patch }));
      }, event);
    },

    deleteCompany: (id) => {
      const event = { type: "company.delete", companyId: id };
      commit((prev) => {
        const target = prev.companies.find((c) => c.id === id);
        const next = { ...prev, companies: prev.companies.filter((item) => item.id !== id) };
        const withActivity = pushActivity(next, `Company deleted: ${target?.name || id}`);
        return pushAudit(withActivity, createAuditEntry({ action: "company.delete", target: target?.name || id }));
      }, event);
    },

    suspendCompany: (id, payload) => {
      const event = { type: "company.suspend", companyId: id, payload };
      commit((prev) => {
        const target = prev.companies.find((c) => c.id === id);
        const next = withCompany(prev, id, (company) =>
          pushCompanyAudit(
            {
              ...company,
              status: "Suspended",
              updated: nowLabel(),
              suspension: { reason: payload.reason, notes: payload.notes || "", suspendedAt: nowLabel() },
            },
            `Company suspended: ${payload.reason}`
          )
        );
        const withActivity = pushActivity(next, `Company suspended: ${target?.name || id}`);
        const withNotif = pushNotification(withActivity, `Company suspended: ${target?.name || id}`, "warning");
        return pushAudit(withNotif, createAuditEntry({ action: "company.suspend", target: target?.name || id, metadata: payload }));
      }, event);
    },

    activateCompany: (id, payload = {}) => {
      const event = { type: "company.activate", companyId: id, payload };
      commit((prev) => {
        const target = prev.companies.find((c) => c.id === id);
        const next = withCompany(prev, id, (company) =>
          pushCompanyAudit(
            {
              ...company,
              status: "Active",
              updated: nowLabel(),
              suspension: { reason: "", notes: payload.notes || "", suspendedAt: null },
            },
            "Company reactivated"
          )
        );
        const withActivity = pushActivity(next, `Company activated: ${target?.name || id}`);
        return pushAudit(withActivity, createAuditEntry({ action: "company.activate", target: target?.name || id, metadata: payload }));
      }, event);
    },

    updateCompanyUsageLimits: (id, limits) => {
      const event = { type: "company.usage_limits.update", companyId: id, payload: limits };
      commit((prev) => {
        const target = prev.companies.find((c) => c.id === id);
        const next = withCompany(prev, id, (company) =>
          pushCompanyAudit({ ...company, usageLimits: { ...company.usageLimits, ...limits }, updated: nowLabel() }, "Usage limits updated")
        );
        const withActivity = pushActivity(next, `Company usage limits updated: ${target?.name || id}`);
        return pushAudit(withActivity, createAuditEntry({ action: "company.usage_limits.update", target: target?.name || id, metadata: limits }));
      }, event);
    },

    addCompanyNote: (companyId, text, author = "Admin") => {
      const event = { type: "company.note.create", companyId, payload: { text, author } };
      commit((prev) => {
        const target = prev.companies.find((c) => c.id === companyId);
        const note = { id: createId("note"), text, author, createdAt: nowLabel() };
        const next = withCompany(prev, companyId, (company) =>
          pushCompanyAudit({ ...company, internalNotes: [note, ...(company.internalNotes || [])], updated: nowLabel() }, "Internal note added", author)
        );
        const withActivity = pushActivity(next, `Company note added: ${target?.name || companyId}`, author);
        return pushAudit(withActivity, createAuditEntry({ action: "company.note.create", actor: author, target: target?.name || companyId }));
      }, event);
    },

    updateCompanyNote: (companyId, noteId, text, actor = "Admin") => {
      const event = { type: "company.note.update", companyId, payload: { noteId, text, actor } };
      commit((prev) => {
        const target = prev.companies.find((c) => c.id === companyId);
        const next = withCompany(prev, companyId, (company) =>
          pushCompanyAudit(
            {
              ...company,
              internalNotes: (company.internalNotes || []).map((note) => (note.id === noteId ? { ...note, text } : note)),
              updated: nowLabel(),
            },
            "Internal note updated",
            actor
          )
        );
        const withActivity = pushActivity(next, `Company note updated: ${target?.name || companyId}`, actor);
        return pushAudit(withActivity, createAuditEntry({ action: "company.note.update", actor, target: target?.name || companyId, metadata: { noteId } }));
      }, event);
    },

    deleteCompanyNote: (companyId, noteId, actor = "Admin") => {
      const event = { type: "company.note.delete", companyId, payload: { noteId, actor } };
      commit((prev) => {
        const target = prev.companies.find((c) => c.id === companyId);
        const next = withCompany(prev, companyId, (company) =>
          pushCompanyAudit(
            {
              ...company,
              internalNotes: (company.internalNotes || []).filter((note) => note.id !== noteId),
              updated: nowLabel(),
            },
            "Internal note deleted",
            actor
          )
        );
        const withActivity = pushActivity(next, `Company note deleted: ${target?.name || companyId}`, actor);
        return pushAudit(withActivity, createAuditEntry({ action: "company.note.delete", actor, target: target?.name || companyId, metadata: { noteId } }));
      }, event);
    },

    createTeamMember: (payload) => {
      const event = { type: "team.member.create", payload };
      commit((prev) => {
        const next = {
          ...prev,
          teamMembers: [{ id: createId("tm"), updated: nowLabel(), ...payload }, ...prev.teamMembers],
        };
        return pushActivity(next, `Team invite created: ${payload.email}`);
      }, event);
    },

    updateTeamMember: (id, patch) => {
      const event = { type: "team.member.update", memberId: id, payload: patch };
      commit((prev) => ({
        ...pushActivity(prev, `Team member updated: ${id}`),
        teamMembers: withUpdated(prev.teamMembers, id, (item) => ({ ...item, ...patch, updated: nowLabel() })),
      }), event);
    },

    deleteTeamMember: (id) => {
      const event = { type: "team.member.delete", memberId: id };
      commit((prev) => ({
        ...pushActivity(prev, `Team member removed: ${id}`),
        teamMembers: prev.teamMembers.filter((item) => item.id !== id),
      }), event);
    },

    createBillingRecord: (payload) => {
      const event = { type: "billing.record.create", payload };
      commit((prev) => {
        const withActivity = pushActivity(prev, `Billing record created: ${payload.company}`);
        const withNotif = pushNotification(withActivity, `Billing record created: ${payload.company}`, "info");
        return {
          ...withNotif,
          billingRecords: [{ id: createId("inv"), updated: nowLabel(), ...payload }, ...withNotif.billingRecords],
        };
      }, event);
    },

    updateBillingRecord: (id, patch) => {
      const event = { type: "billing.record.update", recordId: id, payload: patch };
      commit((prev) => ({
        ...pushActivity(prev, `Billing record updated: ${id}`),
        billingRecords: withUpdated(prev.billingRecords, id, (item) => ({ ...item, ...patch, updated: nowLabel() })),
      }), event);
    },

    deleteBillingRecord: (id) => {
      const event = { type: "billing.record.delete", recordId: id };
      commit((prev) => ({
        ...pushActivity(prev, `Billing record removed: ${id}`),
        billingRecords: prev.billingRecords.filter((item) => item.id !== id),
      }), event);
    },

    createTemplate: (payload) => {
      commit((prev) => {
        const template = {
          id: createId("tpl"),
          version: "1.0.0",
          updated: nowLabel(),
          ...payload,
        };
        const next = { ...prev, templates: [template, ...prev.templates] };
        const withAct = pushActivity(next, `Template created: ${payload.name}`);
        return pushAudit(withAct, createAuditEntry({ action: "template.create", target: payload.name, metadata: payload }));
      });
    },

    updateTemplate: (id, patch) => {
      commit((prev) => {
        const target = prev.templates.find((t) => t.id === id);
        const next = {
          ...prev,
          templates: withUpdated(prev.templates, id, (item) => ({ ...item, ...patch, updated: nowLabel() })),
        };
        const withAct = pushActivity(next, `Template updated: ${target?.name || id}`);
        return pushAudit(withAct, createAuditEntry({ action: "template.update", target: target?.name || id, metadata: patch }));
      });
    },

    deleteTemplate: (id) => {
      commit((prev) => {
        const target = prev.templates.find((t) => t.id === id);
        const next = { ...prev, templates: prev.templates.filter((item) => item.id !== id) };
        const withAct = pushActivity(next, `Template deleted: ${target?.name || id}`);
        return pushAudit(withAct, createAuditEntry({ action: "template.delete", target: target?.name || id }));
      });
    },

    duplicateTemplate: (id) => {
      commit((prev) => {
        const source = prev.templates.find((t) => t.id === id);
        if (!source) return prev;
        const copy = { ...source, id: createId("tpl"), name: `${source.name} (Copy)`, slug: `${source.slug}-copy`, updated: nowLabel() };
        const next = { ...prev, templates: [copy, ...prev.templates] };
        const withAct = pushActivity(next, `Template duplicated: ${source.name}`);
        return pushAudit(withAct, createAuditEntry({ action: "template.duplicate", target: source.name }));
      });
    },

    createPage: (payload) => {
      commit((prev) => {
        const page = { id: createId("pg"), seoScore: 0, updated: nowLabel(), ...payload };
        const next = { ...prev, pages: [page, ...prev.pages] };
        const withAct = pushActivity(next, `Page created: ${payload.title}`);
        return pushAudit(withAct, createAuditEntry({ action: "page.create", target: payload.title, metadata: payload }));
      });
    },

    updatePage: (id, patch) => {
      commit((prev) => {
        const target = prev.pages.find((p) => p.id === id);
        const next = {
          ...prev,
          pages: withUpdated(prev.pages, id, (item) => ({ ...item, ...patch, updated: nowLabel() })),
        };
        const withAct = pushActivity(next, `Page updated: ${target?.title || id}`);
        return pushAudit(withAct, createAuditEntry({ action: "page.update", target: target?.title || id, metadata: patch }));
      });
    },

    deletePage: (id) => {
      commit((prev) => {
        const target = prev.pages.find((p) => p.id === id);
        const next = { ...prev, pages: prev.pages.filter((item) => item.id !== id) };
        const withAct = pushActivity(next, `Page deleted: ${target?.title || id}`);
        return pushAudit(withAct, createAuditEntry({ action: "page.delete", target: target?.title || id }));
      });
    },

    createMedia: (payload) => {
      commit((prev) => {
        const media = { id: createId("md"), usageCount: 0, dimensions: "-", updated: nowLabel(), ...payload };
        const next = { ...prev, media: [media, ...prev.media] };
        const withAct = pushActivity(next, `Media uploaded: ${payload.name}`);
        return pushAudit(withAct, createAuditEntry({ action: "media.create", target: payload.name, metadata: payload }));
      });
    },

    updateMedia: (id, patch) => {
      commit((prev) => {
        const target = prev.media.find((m) => m.id === id);
        const next = {
          ...prev,
          media: withUpdated(prev.media, id, (item) => ({ ...item, ...patch, updated: nowLabel() })),
        };
        const withAct = pushActivity(next, `Media updated: ${target?.name || id}`);
        return pushAudit(withAct, createAuditEntry({ action: "media.update", target: target?.name || id, metadata: patch }));
      });
    },

    deleteMedia: (id) => {
      commit((prev) => {
        const target = prev.media.find((m) => m.id === id);
        const next = { ...prev, media: prev.media.filter((item) => item.id !== id) };
        const withAct = pushActivity(next, `Media deleted: ${target?.name || id}`);
        return pushAudit(withAct, createAuditEntry({ action: "media.delete", target: target?.name || id }));
      });
    },

    updateSeoEntry: (id, patch) => {
      commit((prev) => {
        const target = prev.seoEntries.find((s) => s.id === id);
        const next = {
          ...prev,
          seoEntries: withUpdated(prev.seoEntries, id, (item) => ({ ...item, ...patch, updated: nowLabel() })),
        };
        const withAct = pushActivity(next, `SEO entry updated: ${target?.pageTitle || id}`);
        return pushAudit(withAct, createAuditEntry({ action: "seo.update", target: target?.pageTitle || id, metadata: patch }));
      });
    },

    /* ── Leads ────────────────────────────────────────── */

    createLead: (payload) => {
      commit((prev) => {
        const lead = { id: createId("ld"), updated: nowLabel(), assignedTo: "", ...payload };
        const next = { ...prev, leads: [lead, ...prev.leads] };
        const withAct = pushActivity(next, `Lead created: ${payload.name}`);
        const withNotif = pushNotification(withAct, `New lead: ${payload.name}`, "info");
        return pushAudit(withNotif, createAuditEntry({ action: "lead.create", target: payload.name, metadata: payload }));
      });
    },

    updateLead: (id, patch) => {
      commit((prev) => {
        const target = prev.leads.find((l) => l.id === id);
        const next = {
          ...prev,
          leads: withUpdated(prev.leads, id, (item) => ({ ...item, ...patch, updated: nowLabel() })),
        };
        const withAct = pushActivity(next, `Lead updated: ${target?.name || id}`);
        return pushAudit(withAct, createAuditEntry({ action: "lead.update", target: target?.name || id, metadata: patch }));
      });
    },

    deleteLead: (id) => {
      commit((prev) => {
        const target = prev.leads.find((l) => l.id === id);
        const next = { ...prev, leads: prev.leads.filter((item) => item.id !== id) };
        const withAct = pushActivity(next, `Lead deleted: ${target?.name || id}`);
        return pushAudit(withAct, createAuditEntry({ action: "lead.delete", target: target?.name || id }));
      });
    },

    convertLead: (id) => {
      commit((prev) => {
        const target = prev.leads.find((l) => l.id === id);
        const next = {
          ...prev,
          leads: withUpdated(prev.leads, id, (item) => ({ ...item, status: "Converted", updated: nowLabel() })),
        };
        const withAct = pushActivity(next, `Lead converted: ${target?.name || id}`);
        const withNotif = pushNotification(withAct, `Lead converted: ${target?.name || id}`, "success");
        return pushAudit(withNotif, createAuditEntry({ action: "lead.convert", target: target?.name || id }));
      });
    },

    /* ── Projects ─────────────────────────────────────── */

    createProject: (payload) => {
      commit((prev) => {
        const project = { id: createId("proj"), progress: 0, updated: nowLabel(), ...payload };
        const next = { ...prev, projects: [project, ...prev.projects] };
        const withAct = pushActivity(next, `Project created: ${payload.name}`);
        const withNotif = pushNotification(withAct, `New project: ${payload.name}`, "info");
        return pushAudit(withNotif, createAuditEntry({ action: "project.create", target: payload.name, metadata: payload }));
      });
    },

    updateProject: (id, patch) => {
      commit((prev) => {
        const target = prev.projects.find((p) => p.id === id);
        const next = {
          ...prev,
          projects: withUpdated(prev.projects, id, (item) => ({ ...item, ...patch, updated: nowLabel() })),
        };
        const withAct = pushActivity(next, `Project updated: ${target?.name || id}`);
        return pushAudit(withAct, createAuditEntry({ action: "project.update", target: target?.name || id, metadata: patch }));
      });
    },

    deleteProject: (id) => {
      commit((prev) => {
        const target = prev.projects.find((p) => p.id === id);
        const next = { ...prev, projects: prev.projects.filter((item) => item.id !== id) };
        const withAct = pushActivity(next, `Project deleted: ${target?.name || id}`);
        return pushAudit(withAct, createAuditEntry({ action: "project.delete", target: target?.name || id }));
      });
    },

    /* ── Platform Settings ────────────────────────────── */

    updatePlatformSettings: (patch) => {
      commit((prev) => {
        const next = { ...prev, platformSettings: { ...prev.platformSettings, ...patch } };
        const withAct = pushActivity(next, `Platform settings updated`);
        const withNotif = pushNotification(withAct, "Platform settings updated", "info");
        return pushAudit(withNotif, createAuditEntry({ action: "settings.update", target: "platformSettings", metadata: patch }));
      });
    },

    retryWebhook: (id) => {
      commit((prev) => {
        const next = {
          ...prev,
          webhookLogs: withUpdated(prev.webhookLogs, id, (item) => ({
            ...item,
            httpCode: 200,
            retryCount: item.retryCount + 1,
            updated: nowLabel(),
          })),
        };
        const withAct = pushActivity(next, `Webhook retried: ${id}`);
        return pushAudit(withAct, createAuditEntry({ action: "webhook.retry", target: id }));
      });
    },

    markNotificationRead(id) {
      commit((prev) => ({
        ...prev,
        notifications: withUpdated(prev.notifications || [], id, (n) => ({ ...n, read: true })),
      }));
    },
  };

  const value = { data, ...actions };

  return <AdminPortalContext.Provider value={value}>{children}</AdminPortalContext.Provider>;
}

export function useAdminPortal() {
  const ctx = useContext(AdminPortalContext);
  if (!ctx) {
    throw new Error("useAdminPortal must be used within AdminPortalProvider");
  }
  return ctx;
}


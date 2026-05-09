/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { customerPortalSeed } from "../data/seed";
import { withUpdated, nowLabel, createId, pushToList, createActivityEntry, createAuditEntry, ACTIVITY_CAP, AUDIT_CAP, NOTIFICATION_CAP } from "../../shared/utils";
import { fetchCustomerSnapshot, persistCustomerSnapshot, syncWebsiteOperation, syncSubscriptionOperation, syncPluginOperation, syncProfileOperation, syncSettingsOperation, syncApiKeyOperation, syncTicketOperation, syncPaymentMethodOperation, switchCompanyScope, syncCompanyInvitation } from "../api/customerPortalRepository";

const CustomerPortalContext = createContext(null);

/**
 * @typedef {Object} Company
 * @property {string} id
 * @property {string} name
 * @property {"owner"|"manager"|"viewer"} role
 * @property {string} plan
 */

/**
 * @typedef {Object} PendingInvitation
 * @property {string} id
 * @property {string} email
 * @property {"owner"|"manager"|"viewer"} role
 * @property {string} companyId
 * @property {string} status
 * @property {string} updated
 */

export function CustomerPortalProvider({ children }) {
  const [data, setData] = useState(() => customerPortalSeed);

  useEffect(() => {
    let active = true;
    fetchCustomerSnapshot(customerPortalSeed).then((snapshot) => {
      if (active) setData(snapshot);
    });
    return () => { active = false; };
  }, []);

  function routeEvent(event) {
    const type = event.type || "";
    if (type.startsWith("website.")) syncWebsiteOperation(event);
    else if (type.startsWith("subscription.")) syncSubscriptionOperation(event);
    else if (type.startsWith("plugin.")) syncPluginOperation(event);
    else if (type.startsWith("profile.")) syncProfileOperation(event);
    else if (type.startsWith("settings.")) syncSettingsOperation(event);
    else if (type.startsWith("apiKey.")) syncApiKeyOperation(event);
    else if (type.startsWith("ticket.")) syncTicketOperation(event);
    else if (type.startsWith("paymentMethod.")) syncPaymentMethodOperation(event);
    else if (type.startsWith("company.invitation")) syncCompanyInvitation(event);
  }

  function commit(updater, event = null) {
    setData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persistCustomerSnapshot(next);
      if (event) {
        routeEvent(event);
      }
      return next;
    });
  }

  function pushActivity(prev, action) {
    return {
      ...prev,
      activity: pushToList(
        prev.activity,
        createActivityEntry({ action, actor: prev.profile?.fullName || "User" }),
        ACTIVITY_CAP,
      ),
    };
  }

  function pushNotification(prev, title, level = "info") {
    return {
      ...prev,
      notifications: pushToList(
        prev.notifications,
        { id: createId("n"), title, level, read: false, updated: nowLabel() },
        NOTIFICATION_CAP,
      ),
    };
  }

  function pushAudit(prev, action, target = "Customer Portal") {
    return {
      ...prev,
      auditEvents: pushToList(
        prev.auditEvents || [],
        createAuditEntry({ action, actor: prev.profile?.fullName || "User", target }),
        AUDIT_CAP,
      ),
    };
  }

  // ---------------------------------------------------------------------------
  // Company-scoped computed values
  // ---------------------------------------------------------------------------

  /** @type {Company|undefined} */
  const activeCompany = useMemo(
    () => (data.companies || []).find((c) => c.id === data.activeCompanyId),
    [data.companies, data.activeCompanyId],
  );

  /** Websites filtered by the active company */
  const activeWebsites = useMemo(
    () => (data.websites || []).filter((w) => w.companyId === data.activeCompanyId),
    [data.websites, data.activeCompanyId],
  );

  /** Subscriptions filtered by the active company */
  const activeSubscriptions = useMemo(
    () => (data.subscriptions || []).filter((s) => s.companyId === data.activeCompanyId),
    [data.subscriptions, data.activeCompanyId],
  );

  /** Plugins filtered by the active company */
  const activePlugins = useMemo(
    () => (data.plugins || []).filter((p) => p.companyId === data.activeCompanyId),
    [data.plugins, data.activeCompanyId],
  );

  /** Pending invitations for the active company */
  const activePendingInvitations = useMemo(
    () => (data.pendingInvitations || []).filter((inv) => inv.companyId === data.activeCompanyId),
    [data.pendingInvitations, data.activeCompanyId],
  );

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const actions = {
    // ---- Company switching ----

    /**
     * Switch the active company scope. Updates local state and notifies the API
     * so subsequent requests are company-scoped.
     * @param {string} companyId
     */
    switchCompany: (companyId) => {
      const target = (data.companies || []).find((c) => c.id === companyId);
      if (!target) return;
      switchCompanyScope(companyId);
      commit((prev) => {
        let next = { ...prev, activeCompanyId: companyId };
        next = pushActivity(next, `Switched to company ${target.name}`);
        next = pushAudit(next, `Company switched to: ${target.name}`, "Company");
        return next;
      });
    },

    /**
     * Invite a user to the active company.
     * @param {string} email
     * @param {"owner"|"manager"|"viewer"} role
     */
    inviteToCompany: (email, role) => {
      const companyId = data.activeCompanyId;
      const company = (data.companies || []).find((c) => c.id === companyId);
      const invitation = {
        id: createId("inv"),
        email,
        role,
        companyId,
        status: "Pending",
        updated: nowLabel(),
      };

      commit((prev) => {
        let next = {
          ...prev,
          pendingInvitations: [invitation, ...(prev.pendingInvitations || [])],
        };
        next = pushNotification(next, `Invitation sent to ${email}`, "success");
        next = pushActivity(next, `Invited ${email} as ${role} to ${company?.name || companyId}`);
        next = pushAudit(next, `Invitation sent: ${email} (${role})`, "Company");
        return next;
      }, { type: "company.invitation.create", payload: invitation });
    },

    // ---- Existing actions ----

    markNotificationRead: (id) =>
      commit((prev) => ({ ...prev, notifications: withUpdated(prev.notifications, id, (n) => ({ ...n, read: true })) })),

    updateProfile: (patch) =>
      commit((prev) => {
        let next = { ...prev, profile: { ...prev.profile, ...patch } };
        next = pushActivity(next, "Updated profile information");
        next = pushAudit(next, "Profile updated", "Profile");
        return next;
      }, { type: "profile.update", payload: patch }),

    createWebsite: (payload) =>
      commit((prev) => {
        const site = { id: createId("w"), companyId: prev.activeCompanyId, updated: nowLabel(), ...payload };
        let next = { ...prev, websites: [site, ...prev.websites] };
        next = pushActivity(next, `Created website ${payload.name}`);
        next = pushNotification(next, `Website "${payload.name}" created`, "success");
        next = pushAudit(next, `Website created: ${payload.name}`, "Websites");
        return next;
      }, { type: "website.create", payload }),
    updateWebsite: (id, patch) =>
      commit((prev) => {
        const target = prev.websites.find((w) => w.id === id);
        let next = {
          ...prev,
          websites: withUpdated(prev.websites, id, (item) => ({ ...item, ...patch, updated: nowLabel() })),
        };
        next = pushActivity(next, `Updated website ${target?.name || id}`);
        next = pushAudit(next, `Website updated: ${target?.name || id}`, "Websites");
        return next;
      }, { type: "website.update", websiteId: id, payload: patch }),
    deleteWebsite: (id) =>
      commit((prev) => {
        const target = prev.websites.find((w) => w.id === id);
        let next = { ...prev, websites: prev.websites.filter((item) => item.id !== id) };
        next = pushNotification(next, `Website removed: ${target?.name || id}`, "warning");
        next = pushActivity(next, `Deleted website ${target?.name || id}`);
        next = pushAudit(next, `Website deleted: ${target?.name || id}`, "Websites");
        return next;
      }, { type: "website.delete", websiteId: id }),

    createPaymentMethod: (payload) =>
      commit((prev) => {
        let next = {
          ...prev,
          billing: {
            ...prev.billing,
            paymentMethods: [{ id: createId("pm"), updated: nowLabel(), ...payload }, ...prev.billing.paymentMethods],
          },
        };
        next = pushActivity(next, `Added payment method ${payload.label}`);
        next = pushAudit(next, `Payment method added: ${payload.label}`, "Billing");
        return next;
      }, { type: "paymentMethod.create", payload }),
    deletePaymentMethod: (id) =>
      commit((prev) => {
        let next = {
          ...prev,
          billing: { ...prev.billing, paymentMethods: prev.billing.paymentMethods.filter((item) => item.id !== id) },
        };
        next = pushActivity(next, `Removed payment method ${id}`);
        next = pushAudit(next, `Payment method removed: ${id}`, "Billing");
        return next;
      }, { type: "paymentMethod.delete", paymentMethodId: id }),

    createSubscription: (payload) =>
      commit((prev) => {
        let next = { ...prev, subscriptions: [{ id: createId("s"), companyId: prev.activeCompanyId, ...payload }, ...prev.subscriptions] };
        next = pushNotification(next, `Subscription added: ${payload.name}`, "success");
        next = pushActivity(next, `Added subscription ${payload.name}`);
        next = pushAudit(next, `Subscription created: ${payload.name}`, "Subscriptions");
        return next;
      }, { type: "subscription.create", payload }),
    updateSubscription: (id, patch) =>
      commit((prev) => {
        let next = { ...prev, subscriptions: withUpdated(prev.subscriptions, id, (item) => ({ ...item, ...patch })) };
        next = pushActivity(next, `Updated subscription ${id}`);
        next = pushAudit(next, `Subscription updated: ${id}`, "Subscriptions");
        return next;
      }, { type: "subscription.update", subscriptionId: id, payload: patch }),
    deleteSubscription: (id) =>
      commit((prev) => {
        let next = { ...prev, subscriptions: prev.subscriptions.filter((item) => item.id !== id) };
        next = pushActivity(next, `Deleted subscription ${id}`);
        next = pushAudit(next, `Subscription deleted: ${id}`, "Subscriptions");
        return next;
      }, { type: "subscription.delete", subscriptionId: id }),

    createPlugin: (payload) =>
      commit((prev) => {
        let next = { ...prev, plugins: [{ id: createId("p"), companyId: prev.activeCompanyId, updated: nowLabel(), ...payload }, ...prev.plugins] };
        next = pushNotification(next, `Plugin installed: ${payload.name}`, "success");
        next = pushActivity(next, `Installed plugin ${payload.name}`);
        next = pushAudit(next, `Plugin installed: ${payload.name}`, "Plugins");
        return next;
      }, { type: "plugin.create", payload }),
    updatePlugin: (id, patch) =>
      commit((prev) => {
        let next = { ...prev, plugins: withUpdated(prev.plugins, id, (item) => ({ ...item, ...patch, updated: nowLabel() })) };
        next = pushActivity(next, `Updated plugin ${id}`);
        next = pushAudit(next, `Plugin updated: ${id}`, "Plugins");
        return next;
      }, { type: "plugin.update", pluginId: id, payload: patch }),
    deletePlugin: (id) =>
      commit((prev) => {
        let next = { ...prev, plugins: prev.plugins.filter((item) => item.id !== id) };
        next = pushActivity(next, `Removed plugin ${id}`);
        next = pushAudit(next, `Plugin removed: ${id}`, "Plugins");
        return next;
      }, { type: "plugin.delete", pluginId: id }),

    updateSettings: (patch) =>
      commit((prev) => {
        let next = { ...prev, settings: { ...prev.settings, ...patch } };
        next = pushActivity(next, "Updated settings");
        next = pushAudit(next, "Settings updated", "Settings");
        return next;
      }, { type: "settings.update", payload: patch }),
    createApiKey: (payload) =>
      commit((prev) => {
        let next = {
          ...prev,
          settings: {
            ...prev.settings,
            apiKeys: [{ id: createId("k"), updated: nowLabel(), ...payload }, ...prev.settings.apiKeys],
          },
        };
        next = pushNotification(next, `API key created: ${payload.name}`, "success");
        next = pushActivity(next, `Created API key ${payload.name}`);
        next = pushAudit(next, `API key created: ${payload.name}`, "Settings");
        return next;
      }, { type: "apiKey.create", payload }),
    deleteApiKey: (id) =>
      commit((prev) => {
        let next = {
          ...prev,
          settings: { ...prev.settings, apiKeys: prev.settings.apiKeys.filter((item) => item.id !== id) },
        };
        next = pushActivity(next, `Revoked API key ${id}`);
        next = pushAudit(next, `API key revoked: ${id}`, "Settings");
        return next;
      }, { type: "apiKey.delete", apiKeyId: id }),

    createTicket: (payload) =>
      commit((prev) => {
        let next = { ...prev, tickets: [{ id: createId("T"), updated: nowLabel(), ...payload }, ...prev.tickets] };
        next = pushNotification(next, `Support ticket submitted: ${payload.subject}`, "info");
        next = pushActivity(next, `Submitted ticket ${payload.subject}`);
        next = pushAudit(next, `Ticket created: ${payload.subject}`, "Support");
        return next;
      }, { type: "ticket.create", payload }),
    updateTicket: (id, patch) =>
      commit((prev) => {
        let next = { ...prev, tickets: withUpdated(prev.tickets, id, (item) => ({ ...item, ...patch, updated: nowLabel() })) };
        next = pushActivity(next, `Updated ticket ${id}`);
        next = pushAudit(next, `Ticket updated: ${id}`, "Support");
        return next;
      }, { type: "ticket.update", ticketId: id, payload: patch }),
    deleteTicket: (id) =>
      commit((prev) => {
        let next = { ...prev, tickets: prev.tickets.filter((item) => item.id !== id) };
        next = pushActivity(next, `Deleted ticket ${id}`);
        next = pushAudit(next, `Ticket deleted: ${id}`, "Support");
        return next;
      }, { type: "ticket.delete", ticketId: id }),
  };

  const value = {
    data,
    activeCompany,
    activeWebsites,
    activeSubscriptions,
    activePlugins,
    pendingInvitations: activePendingInvitations,
    ...actions,
  };

  return <CustomerPortalContext.Provider value={value}>{children}</CustomerPortalContext.Provider>;
}

export function useCustomerPortal() {
  const ctx = useContext(CustomerPortalContext);
  if (!ctx) throw new Error("useCustomerPortal must be used within CustomerPortalProvider");
  return ctx;
}

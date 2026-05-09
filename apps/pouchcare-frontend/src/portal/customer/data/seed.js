export const customerPortalSeed = {
  activeCompanyId: "comp_1",
  companies: [
    { id: "comp_1", name: "TechVenture Labs", role: "owner", plan: "Growth" },
    { id: "comp_2", name: "Digital Starter Co", role: "manager", plan: "Starter" },
  ],
  profile: {
    fullName: "Customer User",
    email: "customer@pouchcare.com",
    company: "PouchCare Client Co.",
    phone: "+1 555 0100",
    timezone: "UTC",
  },
  websites: [
    { id: "w1", companyId: "comp_1", name: "Main Website", domain: "client.com", status: "Published", updated: "Today" },
    { id: "w2", companyId: "comp_2", name: "Campaign Site", domain: "promo.client.com", status: "Draft", updated: "Today" },
  ],
  billing: {
    invoices: [
      { id: "INV-2041", amount: "$149", status: "Paid", date: "2026-05-01" },
      { id: "INV-2031", amount: "$149", status: "Paid", date: "2026-04-01" },
    ],
    paymentMethods: [
      { id: "pm1", label: "Visa **** 4821", type: "Card", status: "Active", updated: "Today" },
    ],
  },
  subscriptions: [
    { id: "s1", companyId: "comp_1", name: "Growth Plan", detail: "Up to 10 websites", status: "Active", renewalDate: "2026-06-01" },
    { id: "s2", companyId: "comp_2", name: "Extra Seats", detail: "3 additional users", status: "Active", renewalDate: "2026-06-01" },
  ],
  plugins: [
    { id: "p1", companyId: "comp_1", name: "PouchCare Builder", version: "0.1.0", status: "Installed", updated: "Today" },
    { id: "p2", companyId: "comp_2", name: "SEO Toolkit", version: "2.3.4", status: "Update available", updated: "Yesterday" },
  ],
  pendingInvitations: [],
  settings: {
    twoFactorEnabled: true,
    emailAlertsEnabled: true,
    weeklyDigestEnabled: true,
    webhookUrl: "https://client.com/webhooks/pouchcare",
    locale: "en-US",
    apiKeys: [
      { id: "k1", name: "Production API Key", keyPreview: "pk_live_***8hj2", status: "Active", updated: "Today" },
    ],
  },
  tickets: [
    { id: "T-1432", subject: "Domain setup help", priority: "Medium", status: "Resolved", updated: "Yesterday" },
    { id: "T-1441", subject: "Plugin sync question", priority: "Low", status: "Open", updated: "Today" },
  ],
  notifications: [
    { id: "n1", title: "Plugin update available", level: "info", read: false, updated: "10m ago" },
    { id: "n2", title: "Invoice INV-2041 paid", level: "success", read: true, updated: "2d ago" },
  ],
  activity: [
    { id: "a1", action: "Published Main Website", actor: "Customer User", updated: "1h ago" },
    { id: "a2", action: "Updated billing method", actor: "Customer User", updated: "Yesterday" },
  ],
  auditEvents: [
    { id: "aud_1", action: "Seed initialized", actor: "System", target: "Customer Portal", metadata: null, updated: "Today" },
  ],
};

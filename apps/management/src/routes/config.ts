export const ROUTES = {
  // Auth
  LOGIN: "/login",
  PORTAL_LOGIN: "/portal/login",
  PORTAL_REGISTER: "/portal/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",

  // Dashboard
  DASHBOARD: "/",

  // Staff
  STAFF: "/staff",
  STAFF_DETAIL: "/staff/:id",
  STAFF_DOCUMENT_VIEW: "/staff/:staffId/documents/:documentId",
  LEADERBOARD: "/staff/leaderboard",

  // Tasks
  TASKS: "/tasks",
  TASKS_MINE: "/tasks/mine",
  TASK_DETAIL: "/tasks/:id",

  // Projects
  PROJECTS: "/projects",
  PROJECT_DETAIL: "/projects/:id",

  // Attendance
  ATTENDANCE: "/attendance",
  TEAM_ATTENDANCE: "/attendance/team",
  ATTENDANCE_CHECK: "/attendance/check",

  // Leave
  LEAVE: "/leave",
  LEAVE_REQUEST: "/leave/request",

  // Reports
  REPORTS: "/reports",
  REPORT_SUBMIT: "/reports/submit",

  // Payroll
  PAYROLL: "/payroll",

  // Performance
  PERFORMANCE: "/performance",

  // Finance
  INVOICES: "/finance/invoices",
  EXPENSES: "/finance/expenses",
  REVENUE: "/finance/revenue",
  FORECAST: "/finance/forecast",

  // CRM
  LEADS: "/crm/leads",
  LEAD_DETAIL: "/crm/leads/:id",
  PIPELINE: "/crm/pipeline",
  SALES_ORDERS: "/crm/orders",
  SALES_ORDER_DETAIL: "/crm/orders/:id",

  // HR
  POSITIONS: "/hr/positions",
  APPLICATIONS: "/hr/applications",

  // Assets (hub redirects to /assets/domains)
  ASSETS: "/assets",
  DOMAINS: "/assets/domains",
  SERVERS: "/assets/servers",
  WEBSITES: "/assets/websites",

  // Services (backlinks tab is inside /services now)
  SERVICES: "/services",

  // Support
  SUPPORT: "/support",
  TICKET_DETAIL: "/support/:id",

  // Broadcast
  BROADCAST: "/broadcast",

  // Analytics
  ANALYTICS: "/analytics",

  // Notifications
  NOTIFICATIONS: "/notifications",

  // Settings
  SETTINGS_PROFILE: "/settings/profile",
  SETTINGS_SECURITY: "/settings/security",
  SETTINGS_PREFERENCES: "/settings/preferences",
  SETTINGS_ROLE_PERMISSIONS: "/settings/role-permissions",

  // Portal
  PORTAL_DASHBOARD: "/portal",
  PORTAL_ORDERS: "/portal/orders",
  PORTAL_ORDER_DETAIL: "/portal/orders/:id",
  PORTAL_PLACE_ORDER: "/portal/order",
  PORTAL_WALLET: "/portal/wallet",
  PORTAL_REFERRALS: "/portal/referrals",
  PORTAL_LEADERBOARD: "/portal/referrals/leaderboard",
  PORTAL_COMMISSIONS: "/portal/commissions",
  PORTAL_SUPPORT: "/portal/support",
  PORTAL_SETTINGS: "/portal/settings",

  // Staff Branches
  BRANCHES: "/staff/branches",
  BRANCH_DETAIL: "/staff/branches/:branchId",

  // Finance detail pages
  INVOICE_DETAIL: "/finance/invoices/:id",
  EXPENSE_DETAIL: "/finance/expenses/:id",
  EXCHANGE_RATES: "/finance/exchange-rates",

  // Payroll detail
  PAYROLL_DETAIL: "/payroll/:id",

  // Assets detail
  DOMAIN_DETAIL: "/assets/domains/:id",
  SERVER_DETAIL: "/assets/servers/:id",
  WEBSITE_DETAIL: "/assets/websites/:id",
  DEVICES: "/assets/devices",
  DEVICE_DETAIL: "/assets/devices/:id",

  // HR hub (redirects to /hr/positions)
  HR: "/hr",
  // HR detail
  APPLICATION_DETAIL: "/hr/applications/:id",
  POSITION_DETAIL: "/hr/positions/:id",

  // CRM Clients
  CRM_CLIENTS: "/crm/clients",
  CRM_CLIENT_DETAIL: "/crm/clients/:id",

  // Leave detail
  LEAVE_DETAIL: "/leave/:id",

  // Broadcast detail
  BROADCAST_DETAIL: "/broadcast/:id",

  // Plugins
  PLUGINS: "/plugins",
  PLUGIN_DETAIL: "/plugins/:id",

  // Settings - API Keys
  SETTINGS_API_KEYS: "/settings/api-keys",

  // Tools (SEO / web utilities — mock data in v1)
  TOOLS: "/tools",
  TOOLS_FAVICON: "/tools/favicon",
  TOOLS_BACKLINKS: "/tools/backlinks",
  TOOLS_DA_PA: "/tools/da-pa",
  TOOLS_KEYWORDS: "/tools/keywords",
  TOOLS_SERP_TOP_100: "/tools/serp-top-100",

  // Monitor (CCTV)
  MONITOR: "/monitor",
  MONITOR_BRANCH: "/monitor/:branchId",

  // Admin Portal
  ADMIN_PORTAL_MEMBERS: "/admin/portal/members",
  ADMIN_PORTAL_MEMBER_DETAIL: "/admin/portal/members/:id",
  ADMIN_PORTAL_ORDERS: "/admin/portal/orders",
  ADMIN_PORTAL_COMMISSIONS: "/admin/portal/commissions",
  ADMIN_PORTAL_PAYOUTS: "/admin/portal/payouts",
  ADMIN_PORTAL_DEPOSITS: "/admin/portal/deposits",
  ADMIN_PORTAL_REFERRAL_FRAUD: "/admin/portal/referrals/fraud",
} as const;

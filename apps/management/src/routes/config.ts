export const ROUTES = {
  // Auth
  LOGIN: '/login',
  PORTAL_LOGIN: '/portal/login',
  PORTAL_REGISTER: '/portal/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',

  // Dashboard
  DASHBOARD: '/',

  // Staff
  STAFF: '/staff',
  STAFF_DETAIL: '/staff/:id',
  LEADERBOARD: '/staff/leaderboard',

  // Tasks
  TASKS: '/tasks',
  TASKS_MINE: '/tasks/mine',
  TASK_DETAIL: '/tasks/:id',

  // Projects
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',

  // Attendance
  ATTENDANCE: '/attendance',
  TEAM_ATTENDANCE: '/attendance/team',

  // Leave
  LEAVE: '/leave',

  // Reports
  REPORTS: '/reports',

  // Payroll
  PAYROLL: '/payroll',

  // Performance
  PERFORMANCE: '/performance',

  // Finance
  INVOICES: '/finance/invoices',
  EXPENSES: '/finance/expenses',
  REVENUE: '/finance/revenue',
  FORECAST: '/finance/forecast',

  // CRM
  LEADS: '/crm/leads',
  LEAD_DETAIL: '/crm/leads/:id',
  PIPELINE: '/crm/pipeline',
  SALES_ORDERS: '/crm/orders',

  // HR
  POSITIONS: '/hr/positions',
  APPLICATIONS: '/hr/applications',

  // Assets
  DOMAINS: '/assets/domains',
  SERVERS: '/assets/servers',
  WEBSITES: '/assets/websites',

  // Services
  SERVICES: '/services',
  BACKLINKS: '/services/backlinks',

  // Support
  SUPPORT: '/support',
  TICKET_DETAIL: '/support/:id',

  // Broadcast
  BROADCAST: '/broadcast',

  // Analytics
  ANALYTICS: '/analytics',

  // Notifications
  NOTIFICATIONS: '/notifications',

  // Settings
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_SECURITY: '/settings/security',
  SETTINGS_PREFERENCES: '/settings/preferences',

  // Portal
  PORTAL_DASHBOARD: '/portal',
  PORTAL_ORDERS: '/portal/orders',
  PORTAL_ORDER_DETAIL: '/portal/orders/:id',
  PORTAL_PLACE_ORDER: '/portal/order',
  PORTAL_WALLET: '/portal/wallet',
  PORTAL_REFERRALS: '/portal/referrals',
  PORTAL_LEADERBOARD: '/portal/referrals/leaderboard',
  PORTAL_COMMISSIONS: '/portal/commissions',
  PORTAL_SUPPORT: '/portal/support',
  PORTAL_SETTINGS: '/portal/settings',

  // Admin Portal
  ADMIN_PORTAL_MEMBERS: '/admin/portal/members',
  ADMIN_PORTAL_MEMBER_DETAIL: '/admin/portal/members/:id',
  ADMIN_PORTAL_ORDERS: '/admin/portal/orders',
  ADMIN_PORTAL_COMMISSIONS: '/admin/portal/commissions',
  ADMIN_PORTAL_PAYOUTS: '/admin/portal/payouts',
} as const;

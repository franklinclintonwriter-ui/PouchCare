# Audit inventory (generated)

**Generated:** 2026-04-04 — run `node scripts/generate-audit-inventory.mjs` from repo root to refresh.

## 1. Management page components

**Count:** 75

`apps/management/src/pages/**/*.tsx`

- `apps/management/src/pages/analytics/Analytics.tsx`
- `apps/management/src/pages/assets/Devices.tsx`
- `apps/management/src/pages/assets/DomainDetail.tsx`
- `apps/management/src/pages/assets/Domains.tsx`
- `apps/management/src/pages/assets/ServerDetail.tsx`
- `apps/management/src/pages/assets/Servers.tsx`
- `apps/management/src/pages/assets/WebsiteDetail.tsx`
- `apps/management/src/pages/assets/Websites.tsx`
- `apps/management/src/pages/attendance/CheckinCheckout.tsx`
- `apps/management/src/pages/attendance/MyAttendance.tsx`
- `apps/management/src/pages/attendance/TeamAttendance.tsx`
- `apps/management/src/pages/auth/ForgotPassword.tsx`
- `apps/management/src/pages/auth/PortalLogin.tsx`
- `apps/management/src/pages/auth/PortalRegister.tsx`
- `apps/management/src/pages/auth/ResetPassword.tsx`
- `apps/management/src/pages/auth/StaffLogin.tsx`
- `apps/management/src/pages/auth/VerifyEmail.tsx`
- `apps/management/src/pages/broadcast/BroadcastList.tsx`
- `apps/management/src/pages/crm/ClientAccounts.tsx`
- `apps/management/src/pages/crm/LeadDetail.tsx`
- `apps/management/src/pages/crm/LeadList.tsx`
- `apps/management/src/pages/crm/Pipeline.tsx`
- `apps/management/src/pages/crm/SalesOrderDetail.tsx`
- `apps/management/src/pages/crm/SalesOrders.tsx`
- `apps/management/src/pages/dashboard/Dashboard.tsx`
- `apps/management/src/pages/finance/ExchangeRates.tsx`
- `apps/management/src/pages/finance/ExpenseDetail.tsx`
- `apps/management/src/pages/finance/ExpenseList.tsx`
- `apps/management/src/pages/finance/Forecast.tsx`
- `apps/management/src/pages/finance/InvoiceDetail.tsx`
- `apps/management/src/pages/finance/InvoiceList.tsx`
- `apps/management/src/pages/finance/Revenue.tsx`
- `apps/management/src/pages/hr/ApplicationDetail.tsx`
- `apps/management/src/pages/hr/Applications.tsx`
- `apps/management/src/pages/hr/Performance.tsx`
- `apps/management/src/pages/hr/Positions.tsx`
- `apps/management/src/pages/leave/LeaveList.tsx`
- `apps/management/src/pages/leave/LeaveRequestForm.tsx`
- `apps/management/src/pages/notifications/NotificationList.tsx`
- `apps/management/src/pages/payroll/PayrollDetail.tsx`
- `apps/management/src/pages/payroll/PayrollList.tsx`
- `apps/management/src/pages/portal/Commissions.tsx`
- `apps/management/src/pages/portal/PlaceOrder.tsx`
- `apps/management/src/pages/portal/PortalDashboard.tsx`
- `apps/management/src/pages/portal/PortalOrderDetail.tsx`
- `apps/management/src/pages/portal/PortalOrders.tsx`
- `apps/management/src/pages/portal/PortalSettings.tsx`
- `apps/management/src/pages/portal/PortalSupport.tsx`
- `apps/management/src/pages/portal/ReferralLeaderboard.tsx`
- `apps/management/src/pages/portal/Referrals.tsx`
- `apps/management/src/pages/portal/Wallet.tsx`
- `apps/management/src/pages/portal/admin/PortalCommissions.tsx`
- `apps/management/src/pages/portal/admin/PortalDeposits.tsx`
- `apps/management/src/pages/portal/admin/PortalMemberDetail.tsx`
- `apps/management/src/pages/portal/admin/PortalMembers.tsx`
- `apps/management/src/pages/portal/admin/PortalOrdersAdmin.tsx`
- `apps/management/src/pages/portal/admin/PortalPayouts.tsx`
- `apps/management/src/pages/projects/ProjectDetail.tsx`
- `apps/management/src/pages/projects/ProjectList.tsx`
- `apps/management/src/pages/reports/DailyReports.tsx`
- `apps/management/src/pages/reports/ReportSubmit.tsx`
- `apps/management/src/pages/services/BacklinkPackages.tsx`
- `apps/management/src/pages/services/ServiceList.tsx`
- `apps/management/src/pages/settings/Preferences.tsx`
- `apps/management/src/pages/settings/Profile.tsx`
- `apps/management/src/pages/settings/Security.tsx`
- `apps/management/src/pages/staff/BranchManagement.tsx`
- `apps/management/src/pages/staff/Leaderboard.tsx`
- `apps/management/src/pages/staff/StaffDetail.tsx`
- `apps/management/src/pages/staff/StaffList.tsx`
- `apps/management/src/pages/support/TicketDetail.tsx`
- `apps/management/src/pages/support/TicketList.tsx`
- `apps/management/src/pages/tasks/MyTasks.tsx`
- `apps/management/src/pages/tasks/TaskDetail.tsx`
- `apps/management/src/pages/tasks/TaskList.tsx`

## 2. API route modules

**Count:** 28

`apps/api/src/routes/**/*.ts`

- `apps/api/src/routes/admin/portal.ts`
- `apps/api/src/routes/admin/resources.ts`
- `apps/api/src/routes/analytics/index.ts`
- `apps/api/src/routes/assets/index.ts`
- `apps/api/src/routes/attendance/index.ts`
- `apps/api/src/routes/auth/index.ts`
- `apps/api/src/routes/broadcast/index.ts`
- `apps/api/src/routes/crm/index.ts`
- `apps/api/src/routes/finance/index.ts`
- `apps/api/src/routes/hr/index.ts`
- `apps/api/src/routes/leave/index.ts`
- `apps/api/src/routes/notifications/index.ts`
- `apps/api/src/routes/payroll/index.ts`
- `apps/api/src/routes/performance/index.ts`
- `apps/api/src/routes/portal/auth.ts`
- `apps/api/src/routes/portal/commissions.ts`
- `apps/api/src/routes/portal/me.ts`
- `apps/api/src/routes/portal/orders.ts`
- `apps/api/src/routes/portal/referrals.ts`
- `apps/api/src/routes/portal/wallet.ts`
- `apps/api/src/routes/projects/index.ts`
- `apps/api/src/routes/reports/index.ts`
- `apps/api/src/routes/search/index.ts`
- `apps/api/src/routes/services/backlinks.ts`
- `apps/api/src/routes/services/index.ts`
- `apps/api/src/routes/staff/index.ts`
- `apps/api/src/routes/support/index.ts`
- `apps/api/src/routes/tasks/index.ts`

## 3. Management API client modules

**Count:** 23

`apps/management/src/api/*.ts`

- `apps/management/src/api/admin-portal.ts`
- `apps/management/src/api/admin-resources.ts`
- `apps/management/src/api/analytics.ts`
- `apps/management/src/api/assets.ts`
- `apps/management/src/api/attendance.ts`
- `apps/management/src/api/auth.ts`
- `apps/management/src/api/broadcast.ts`
- `apps/management/src/api/client.ts`
- `apps/management/src/api/crm.ts`
- `apps/management/src/api/finance.ts`
- `apps/management/src/api/hr.ts`
- `apps/management/src/api/leave.ts`
- `apps/management/src/api/notifications.ts`
- `apps/management/src/api/payroll.ts`
- `apps/management/src/api/performance.ts`
- `apps/management/src/api/portal.ts`
- `apps/management/src/api/projects.ts`
- `apps/management/src/api/reports.ts`
- `apps/management/src/api/search.ts`
- `apps/management/src/api/services.ts`
- `apps/management/src/api/staff.ts`
- `apps/management/src/api/support.ts`
- `apps/management/src/api/tasks.ts`


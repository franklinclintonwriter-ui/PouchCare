import { lazy, Suspense, type ReactNode } from "react";
import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { AuthGuard, GuestGuard, PermissionGuard, ManagerGuard } from "./guards";

function PageLoader() {
  return (
    <div
      className="flex items-center justify-center py-12 opacity-0 animate-fade-in"
      style={{ animationDelay: "150ms", animationFillMode: "forwards" }}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-100 border-t-primary-500" />
      </div>
    </div>
  );
}

function LazyPage({ element }: { element: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

// ── Eager imports: core nav pages load instantly ──────────────
import Dashboard from "@/pages/dashboard/Dashboard";
import TaskList from "@/pages/tasks/TaskList";
import MyTasks from "@/pages/tasks/MyTasks";
import ProjectList from "@/pages/projects/ProjectList";
import NotificationList from "@/pages/notifications/NotificationList";
import StaffLogin from "@/pages/auth/StaffLogin";

import PortalDashboard from "@/pages/portal/PortalDashboard";
import PlaceOrder from "@/pages/portal/PlaceOrder";
import PortalOrders from "@/pages/portal/PortalOrders";
import WalletPage from "@/pages/portal/Wallet";

// ── Lazy imports: secondary pages load on demand ─────────────
const PortalLogin = lazy(() => import("@/pages/auth/PortalLogin"));
const PortalRegister = lazy(() => import("@/pages/auth/PortalRegister"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("@/pages/auth/VerifyEmail"));

const StaffList = lazy(() => import("@/pages/staff/StaffList"));
const StaffDetail = lazy(() => import("@/pages/staff/StaffDetail"));
const StaffDocumentViewer = lazy(
  () => import("@/pages/staff/StaffDocumentViewer"),
);
const StaffLeaderboard = lazy(() => import("@/pages/staff/Leaderboard"));
const BranchManagement = lazy(() => import("@/pages/staff/BranchManagement"));
const BranchDetail = lazy(() => import("@/pages/staff/BranchDetail"));
const TaskDetail = lazy(() => import("@/pages/tasks/TaskDetail"));
const ProjectDetail = lazy(() => import("@/pages/projects/ProjectDetail"));
const MyAttendance = lazy(() => import("@/pages/attendance/MyAttendance"));
const TeamAttendance = lazy(() => import("@/pages/attendance/TeamAttendance"));
const CheckinCheckout = lazy(
  () => import("@/pages/attendance/CheckinCheckout"),
);
const LeaveList = lazy(() => import("@/pages/leave/LeaveList"));
const LeaveDetail = lazy(() => import("@/pages/leave/LeaveDetail"));
const LeaveRequestForm = lazy(() => import("@/pages/leave/LeaveRequestForm"));
const DailyReports = lazy(() => import("@/pages/reports/DailyReports"));
const ReportSubmit = lazy(() => import("@/pages/reports/ReportSubmit"));
const PayrollList = lazy(() => import("@/pages/payroll/PayrollList"));
const Performance = lazy(() => import("@/pages/hr/Performance"));
const InvoiceList = lazy(() => import("@/pages/finance/InvoiceList"));
const ExpenseList = lazy(() => import("@/pages/finance/ExpenseList"));
const Revenue = lazy(() => import("@/pages/finance/Revenue"));
const Forecast = lazy(() => import("@/pages/finance/Forecast"));
const ExchangeRates = lazy(() => import("@/pages/finance/ExchangeRates"));
const LeadList = lazy(() => import("@/pages/crm/LeadList"));
const LeadDetail = lazy(() => import("@/pages/crm/LeadDetail"));
const Pipeline = lazy(() => import("@/pages/crm/Pipeline"));
const SalesOrders = lazy(() => import("@/pages/crm/SalesOrders"));
const SalesOrderDetail = lazy(() => import("@/pages/crm/SalesOrderDetail"));
const ClientAccounts = lazy(() => import("@/pages/crm/ClientAccounts"));
const ClientDetail = lazy(() => import("@/pages/crm/ClientDetail"));
const Positions = lazy(() => import("@/pages/hr/Positions"));
const PositionDetail = lazy(() => import("@/pages/hr/PositionDetail"));
const Applications = lazy(() => import("@/pages/hr/Applications"));
const Domains = lazy(() => import("@/pages/assets/Domains"));
const DomainDetail = lazy(() => import("@/pages/assets/DomainDetail"));
const Servers = lazy(() => import("@/pages/assets/Servers"));
const ServerDetail = lazy(() => import("@/pages/assets/ServerDetail"));
const Websites = lazy(() => import("@/pages/assets/Websites"));
const WebsiteDetail = lazy(() => import("@/pages/assets/WebsiteDetail"));
const Devices = lazy(() => import("@/pages/assets/Devices"));
const DeviceDetail = lazy(() => import("@/pages/assets/DeviceDetail"));
const ServiceList = lazy(() => import("@/pages/services/ServiceList"));
const TicketList = lazy(() => import("@/pages/support/TicketList"));
const TicketDetail = lazy(() => import("@/pages/support/TicketDetail"));
const BroadcastList = lazy(() => import("@/pages/broadcast/BroadcastList"));
const BroadcastDetail = lazy(() => import("@/pages/broadcast/BroadcastDetail"));
const Analytics = lazy(() => import("@/pages/analytics/Analytics"));
const Profile = lazy(() => import("@/pages/settings/Profile"));
const Security = lazy(() => import("@/pages/settings/Security"));
const Preferences = lazy(() => import("@/pages/settings/Preferences"));
const RolePermissions = lazy(() => import("@/pages/settings/RolePermissions"));
const SystemConfig = lazy(() => import("@/pages/settings/SystemConfig"));

const PortalOrderDetail = lazy(
  () => import("@/pages/portal/PortalOrderDetail"),
);
const Referrals = lazy(() => import("@/pages/portal/Referrals"));
const ReferralLeaderboard = lazy(
  () => import("@/pages/portal/ReferralLeaderboard"),
);
const Commissions = lazy(() => import("@/pages/portal/Commissions"));
const PortalSupport = lazy(() => import("@/pages/portal/PortalSupport"));
const PortalSettings = lazy(() => import("@/pages/portal/PortalSettings"));

const PortalMembers = lazy(() => import("@/pages/portal/admin/PortalMembers"));
const PortalMemberDetail = lazy(
  () => import("@/pages/portal/admin/PortalMemberDetail"),
);
const PortalOrdersAdmin = lazy(
  () => import("@/pages/portal/admin/PortalOrdersAdmin"),
);
const PortalCommissions = lazy(
  () => import("@/pages/portal/admin/PortalCommissions"),
);
const PortalPayouts = lazy(() => import("@/pages/portal/admin/PortalPayouts"));
const PortalDeposits = lazy(
  () => import("@/pages/portal/admin/PortalDeposits"),
);
const ReferralFraud = lazy(() => import("@/pages/portal/admin/ReferralFraud"));
const InvoiceDetail = lazy(() => import("@/pages/finance/InvoiceDetail"));
const ExpenseDetail = lazy(() => import("@/pages/finance/ExpenseDetail"));
const PayrollDetail = lazy(() => import("@/pages/payroll/PayrollDetail"));
const ApplicationDetail = lazy(() => import("@/pages/hr/ApplicationDetail"));
const PluginList = lazy(() => import("@/pages/plugins/PluginList"));
const PluginDetail = lazy(() => import("@/pages/plugins/PluginDetail"));
const ApiKeys = lazy(() => import("@/pages/settings/ApiKeys"));
const MonitorDashboard = lazy(() => import("@/pages/monitor/MonitorDashboard"));
const BranchCameras = lazy(() => import("@/pages/monitor/BranchCameras"));
const ToolsHub = lazy(() => import("@/pages/tools/ToolsHub"));
const FaviconToolPage = lazy(() => import("@/pages/tools/FaviconToolPage"));
const BacklinksToolPage = lazy(() => import("@/pages/tools/BacklinksToolPage"));
const DaPaToolPage = lazy(() => import("@/pages/tools/DaPaToolPage"));
const KeywordsToolPage = lazy(() => import("@/pages/tools/KeywordsToolPage"));
const SerpTop100ToolPage = lazy(
  () => import("@/pages/tools/SerpTop100ToolPage"),
);

export const routes: RouteObject[] = [
  // Auth routes (guest only)
  {
    path: "/login",
    element: (
      <GuestGuard>
        <StaffLogin />
      </GuestGuard>
    ),
  },
  {
    path: "/portal/login",
    element: (
      <GuestGuard>
        <LazyPage element={<PortalLogin />} />
      </GuestGuard>
    ),
  },
  {
    path: "/portal/register",
    element: (
      <GuestGuard>
        <LazyPage element={<PortalRegister />} />
      </GuestGuard>
    ),
  },
  {
    path: "/forgot-password",
    element: <LazyPage element={<ForgotPassword />} />,
  },
  {
    path: "/reset-password",
    element: <LazyPage element={<ResetPassword />} />,
  },
  {
    path: "/verify-email",
    element: <LazyPage element={<VerifyEmail />} />,
  },

  // Staff routes (authenticated)
  {
    element: (
      <AuthGuard userType="staff">
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "dashboard", element: <Navigate to="/" replace /> },
      { path: "staff", element: <LazyPage element={<StaffList />} /> },
      {
        path: "staff/leaderboard",
        element: <LazyPage element={<StaffLeaderboard />} />,
      },
      {
        path: "staff/branches",
        element: (
          <PermissionGuard permission="staff.branches">
            <LazyPage element={<BranchManagement />} />
          </PermissionGuard>
        ),
      },
      {
        path: "staff/branches/:branchId",
        element: (
          <PermissionGuard permission="staff.branches">
            <LazyPage element={<BranchDetail />} />
          </PermissionGuard>
        ),
      },
      {
        path: "staff/:staffId/documents/:documentId",
        element: <LazyPage element={<StaffDocumentViewer />} />,
      },
      { path: "staff/:id", element: <LazyPage element={<StaffDetail />} /> },
      { path: "tasks", element: <TaskList /> },
      { path: "tasks/mine", element: <MyTasks /> },
      { path: "tasks/:id", element: <LazyPage element={<TaskDetail />} /> },
      { path: "projects", element: <ProjectList /> },
      {
        path: "projects/:id",
        element: <LazyPage element={<ProjectDetail />} />,
      },
      { path: "attendance", element: <LazyPage element={<MyAttendance />} /> },
      {
        path: "attendance/team",
        element: (
          <ManagerGuard>
            <LazyPage element={<TeamAttendance />} />
          </ManagerGuard>
        ),
      },
      {
        path: "attendance/check",
        element: <LazyPage element={<CheckinCheckout />} />,
      },
      { path: "leave", element: <LazyPage element={<LeaveList />} /> },
      {
        path: "leave/request",
        element: <LazyPage element={<LeaveRequestForm />} />,
      },
      { path: "leave/:id", element: <LazyPage element={<LeaveDetail />} /> },
      { path: "reports", element: <LazyPage element={<DailyReports />} /> },
      {
        path: "reports/submit",
        element: <LazyPage element={<ReportSubmit />} />,
      },
      {
        path: "payroll",
        element: (
          <PermissionGuard permission="payroll.access">
            <LazyPage element={<PayrollList />} />
          </PermissionGuard>
        ),
      },
      {
        path: "payroll/:id",
        element: (
          <PermissionGuard permission="payroll.access">
            <LazyPage element={<PayrollDetail />} />
          </PermissionGuard>
        ),
      },
      {
        path: "performance",
        element: (
          <PermissionGuard permission="hr.performance">
            <LazyPage element={<Performance />} />
          </PermissionGuard>
        ),
      },
      {
        path: "finance/invoices",
        element: (
          <PermissionGuard permission="finance.access">
            <LazyPage element={<InvoiceList />} />
          </PermissionGuard>
        ),
      },
      {
        path: "finance/invoices/:id",
        element: (
          <PermissionGuard permission="finance.access">
            <LazyPage element={<InvoiceDetail />} />
          </PermissionGuard>
        ),
      },
      {
        path: "finance/expenses",
        element: (
          <PermissionGuard permission="finance.access">
            <LazyPage element={<ExpenseList />} />
          </PermissionGuard>
        ),
      },
      {
        path: "finance/expenses/:id",
        element: (
          <PermissionGuard permission="finance.access">
            <LazyPage element={<ExpenseDetail />} />
          </PermissionGuard>
        ),
      },
      {
        path: "finance/revenue",
        element: (
          <PermissionGuard permission="finance.access">
            <LazyPage element={<Revenue />} />
          </PermissionGuard>
        ),
      },
      {
        path: "finance/forecast",
        element: (
          <PermissionGuard permission="finance.access">
            <LazyPage element={<Forecast />} />
          </PermissionGuard>
        ),
      },
      {
        path: "finance/exchange-rates",
        element: (
          <PermissionGuard permission="finance.exchange_rates">
            <LazyPage element={<ExchangeRates />} />
          </PermissionGuard>
        ),
      },
      {
        path: "crm/leads",
        element: (
          <ManagerGuard>
            <LazyPage element={<LeadList />} />
          </ManagerGuard>
        ),
      },
      {
        path: "crm/leads/:id",
        element: (
          <ManagerGuard>
            <LazyPage element={<LeadDetail />} />
          </ManagerGuard>
        ),
      },
      {
        path: "crm/pipeline",
        element: (
          <ManagerGuard>
            <LazyPage element={<Pipeline />} />
          </ManagerGuard>
        ),
      },
      {
        path: "crm/orders/:id",
        element: (
          <ManagerGuard>
            <LazyPage element={<SalesOrderDetail />} />
          </ManagerGuard>
        ),
      },
      {
        path: "crm/orders",
        element: (
          <ManagerGuard>
            <LazyPage element={<SalesOrders />} />
          </ManagerGuard>
        ),
      },
      {
        path: "crm/clients",
        element: (
          <PermissionGuard permission="crm.client_accounts">
            <LazyPage element={<ClientAccounts />} />
          </PermissionGuard>
        ),
      },
      {
        path: "crm/clients/:id",
        element: (
          <PermissionGuard permission="crm.client_accounts">
            <LazyPage element={<ClientDetail />} />
          </PermissionGuard>
        ),
      },
      { path: "hr", element: <Navigate to="/hr/positions" replace /> },
      {
        path: "hr/positions",
        element: (
          <PermissionGuard permission="hr.recruitment">
            <LazyPage element={<Positions />} />
          </PermissionGuard>
        ),
      },
      {
        path: "hr/positions/:id",
        element: (
          <PermissionGuard permission="hr.recruitment">
            <LazyPage element={<PositionDetail />} />
          </PermissionGuard>
        ),
      },
      {
        path: "hr/applications",
        element: (
          <PermissionGuard permission="hr.recruitment">
            <LazyPage element={<Applications />} />
          </PermissionGuard>
        ),
      },
      {
        path: "hr/applications/:id",
        element: (
          <PermissionGuard permission="hr.recruitment">
            <LazyPage element={<ApplicationDetail />} />
          </PermissionGuard>
        ),
      },
      { path: "assets", element: <Navigate to="/assets/domains" replace /> },
      {
        path: "assets/domains/:id",
        element: <LazyPage element={<DomainDetail />} />,
      },
      { path: "assets/domains", element: <LazyPage element={<Domains />} /> },
      {
        path: "assets/servers/:id",
        element: <LazyPage element={<ServerDetail />} />,
      },
      { path: "assets/servers", element: <LazyPage element={<Servers />} /> },
      {
        path: "assets/websites/:id",
        element: <LazyPage element={<WebsiteDetail />} />,
      },
      { path: "assets/websites", element: <LazyPage element={<Websites />} /> },
      {
        path: "assets/devices",
        element: (
          <PermissionGuard permission="assets.devices">
            <LazyPage element={<Devices />} />
          </PermissionGuard>
        ),
      },
      {
        path: "assets/devices/:id",
        element: (
          <PermissionGuard permission="assets.devices">
            <LazyPage element={<DeviceDetail />} />
          </PermissionGuard>
        ),
      },
      { path: "services", element: <LazyPage element={<ServiceList />} /> },
      {
        path: "services/backlinks",
        element: <Navigate to="/services" replace />,
      },
      { path: "support", element: <LazyPage element={<TicketList />} /> },
      { path: "support/:id", element: <LazyPage element={<TicketDetail />} /> },
      {
        path: "broadcast",
        element: (
          <PermissionGuard permission="broadcast.access">
            <LazyPage element={<BroadcastList />} />
          </PermissionGuard>
        ),
      },
      {
        path: "broadcast/:id",
        element: (
          <PermissionGuard permission="broadcast.access">
            <LazyPage element={<BroadcastDetail />} />
          </PermissionGuard>
        ),
      },
      {
        path: "analytics",
        element: (
          <PermissionGuard permission="analytics.access">
            <LazyPage element={<Analytics />} />
          </PermissionGuard>
        ),
      },
      { path: "tools", element: <LazyPage element={<ToolsHub />} /> },
      {
        path: "tools/favicon",
        element: <LazyPage element={<FaviconToolPage />} />,
      },
      {
        path: "tools/backlinks",
        element: <LazyPage element={<BacklinksToolPage />} />,
      },
      { path: "tools/da-pa", element: <LazyPage element={<DaPaToolPage />} /> },
      {
        path: "tools/keywords",
        element: <LazyPage element={<KeywordsToolPage />} />,
      },
      {
        path: "tools/serp-top-100",
        element: <LazyPage element={<SerpTop100ToolPage />} />,
      },
      { path: "notifications", element: <NotificationList /> },
      { path: "settings/profile", element: <LazyPage element={<Profile />} /> },
      {
        path: "settings/security",
        element: <LazyPage element={<Security />} />,
      },
      {
        path: "settings/preferences",
        element: <LazyPage element={<Preferences />} />,
      },
      {
        path: "settings/role-permissions",
        element: (
          <PermissionGuard permission="settings.role_permissions">
            <LazyPage element={<RolePermissions />} />
          </PermissionGuard>
        ),
      },
      {
        path: "settings/system",
        element: (
          <PermissionGuard permission="settings.role_permissions">
            <LazyPage element={<SystemConfig />} />
          </PermissionGuard>
        ),
      },
      {
        path: "settings/api-keys",
        element: (
          <PermissionGuard permission="settings.role_permissions">
            <LazyPage element={<ApiKeys />} />
          </PermissionGuard>
        ),
      },
      {
        path: "monitor",
        element: (
          <PermissionGuard permission="monitor.view">
            <LazyPage element={<MonitorDashboard />} />
          </PermissionGuard>
        ),
      },
      {
        path: "monitor/:branchId",
        element: (
          <PermissionGuard permission="monitor.view">
            <LazyPage element={<BranchCameras />} />
          </PermissionGuard>
        ),
      },
      { path: "plugins", element: <LazyPage element={<PluginList />} /> },
      { path: "plugins/:id", element: <LazyPage element={<PluginDetail />} /> },
      // Admin Portal
      {
        path: "admin/portal/members",
        element: (
          <PermissionGuard permission="admin_portal.access">
            <LazyPage element={<PortalMembers />} />
          </PermissionGuard>
        ),
      },
      {
        path: "admin/portal/members/:id",
        element: (
          <PermissionGuard permission="admin_portal.access">
            <LazyPage element={<PortalMemberDetail />} />
          </PermissionGuard>
        ),
      },
      {
        path: "admin/portal/orders",
        element: (
          <PermissionGuard permission="admin_portal.access">
            <LazyPage element={<PortalOrdersAdmin />} />
          </PermissionGuard>
        ),
      },
      {
        path: "admin/portal/commissions",
        element: (
          <PermissionGuard permission="admin_portal.access">
            <LazyPage element={<PortalCommissions />} />
          </PermissionGuard>
        ),
      },
      {
        path: "admin/portal/payouts",
        element: (
          <PermissionGuard permission="admin_portal.access">
            <LazyPage element={<PortalPayouts />} />
          </PermissionGuard>
        ),
      },
      {
        path: "admin/portal/deposits",
        element: (
          <PermissionGuard permission="admin_portal.access">
            <LazyPage element={<PortalDeposits />} />
          </PermissionGuard>
        ),
      },
      {
        path: "admin/portal/referrals/fraud",
        element: (
          <PermissionGuard permission="admin_portal.access">
            <LazyPage element={<ReferralFraud />} />
          </PermissionGuard>
        ),
      },
    ],
  },

  // Portal routes (authenticated portal member)
  {
    path: "portal",
    element: (
      <AuthGuard userType="portal">
        <PortalLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <PortalDashboard /> },
      { path: "orders", element: <PortalOrders /> },
      {
        path: "orders/:id",
        element: <LazyPage element={<PortalOrderDetail />} />,
      },
      { path: "order", element: <PlaceOrder /> },
      { path: "wallet", element: <WalletPage /> },
      { path: "referrals", element: <LazyPage element={<Referrals />} /> },
      {
        path: "referrals/leaderboard",
        element: <LazyPage element={<ReferralLeaderboard />} />,
      },
      { path: "commissions", element: <LazyPage element={<Commissions />} /> },
      { path: "support", element: <LazyPage element={<PortalSupport />} /> },
      { path: "support/:id", element: <LazyPage element={<TicketDetail />} /> },
      { path: "settings", element: <LazyPage element={<PortalSettings />} /> },
    ],
  },
];

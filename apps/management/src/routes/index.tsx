import { lazy, Suspense, type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { AuthGuard, GuestGuard, RoleGuard } from './guards';

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-12 opacity-0 animate-fade-in" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
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
import Dashboard from '@/pages/dashboard/Dashboard';
import TaskList from '@/pages/tasks/TaskList';
import MyTasks from '@/pages/tasks/MyTasks';
import ProjectList from '@/pages/projects/ProjectList';
import NotificationList from '@/pages/notifications/NotificationList';
import StaffLogin from '@/pages/auth/StaffLogin';

import PortalDashboard from '@/pages/portal/PortalDashboard';
import PlaceOrder from '@/pages/portal/PlaceOrder';
import PortalOrders from '@/pages/portal/PortalOrders';
import WalletPage from '@/pages/portal/Wallet';

// ── Lazy imports: secondary pages load on demand ─────────────
const PortalLogin = lazy(() => import('@/pages/auth/PortalLogin'));
const PortalRegister = lazy(() => import('@/pages/auth/PortalRegister'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'));

const StaffList = lazy(() => import('@/pages/staff/StaffList'));
const StaffDetail = lazy(() => import('@/pages/staff/StaffDetail'));
const StaffLeaderboard = lazy(() => import('@/pages/staff/Leaderboard'));
const BranchManagement = lazy(() => import('@/pages/staff/BranchManagement'));
const TaskDetail = lazy(() => import('@/pages/tasks/TaskDetail'));
const ProjectDetail = lazy(() => import('@/pages/projects/ProjectDetail'));
const MyAttendance = lazy(() => import('@/pages/attendance/MyAttendance'));
const TeamAttendance = lazy(() => import('@/pages/attendance/TeamAttendance'));
const CheckinCheckout = lazy(() => import('@/pages/attendance/CheckinCheckout'));
const LeaveList = lazy(() => import('@/pages/leave/LeaveList'));
const LeaveRequestForm = lazy(() => import('@/pages/leave/LeaveRequestForm'));
const DailyReports = lazy(() => import('@/pages/reports/DailyReports'));
const ReportSubmit = lazy(() => import('@/pages/reports/ReportSubmit'));
const PayrollList = lazy(() => import('@/pages/payroll/PayrollList'));
const Performance = lazy(() => import('@/pages/hr/Performance'));
const InvoiceList = lazy(() => import('@/pages/finance/InvoiceList'));
const ExpenseList = lazy(() => import('@/pages/finance/ExpenseList'));
const Revenue = lazy(() => import('@/pages/finance/Revenue'));
const Forecast = lazy(() => import('@/pages/finance/Forecast'));
const ExchangeRates = lazy(() => import('@/pages/finance/ExchangeRates'));
const LeadList = lazy(() => import('@/pages/crm/LeadList'));
const LeadDetail = lazy(() => import('@/pages/crm/LeadDetail'));
const Pipeline = lazy(() => import('@/pages/crm/Pipeline'));
const SalesOrders = lazy(() => import('@/pages/crm/SalesOrders'));
const ClientAccounts = lazy(() => import('@/pages/crm/ClientAccounts'));
const Positions = lazy(() => import('@/pages/hr/Positions'));
const Applications = lazy(() => import('@/pages/hr/Applications'));
const Domains = lazy(() => import('@/pages/assets/Domains'));
const Servers = lazy(() => import('@/pages/assets/Servers'));
const Websites = lazy(() => import('@/pages/assets/Websites'));
const Devices = lazy(() => import('@/pages/assets/Devices'));
const ServiceList = lazy(() => import('@/pages/services/ServiceList'));
const BacklinkPackages = lazy(() => import('@/pages/services/BacklinkPackages'));
const TicketList = lazy(() => import('@/pages/support/TicketList'));
const TicketDetail = lazy(() => import('@/pages/support/TicketDetail'));
const BroadcastList = lazy(() => import('@/pages/broadcast/BroadcastList'));
const Analytics = lazy(() => import('@/pages/analytics/Analytics'));
const Profile = lazy(() => import('@/pages/settings/Profile'));
const Security = lazy(() => import('@/pages/settings/Security'));
const Preferences = lazy(() => import('@/pages/settings/Preferences'));

const PortalOrderDetail = lazy(() => import('@/pages/portal/PortalOrderDetail'));
const Referrals = lazy(() => import('@/pages/portal/Referrals'));
const ReferralLeaderboard = lazy(() => import('@/pages/portal/ReferralLeaderboard'));
const Commissions = lazy(() => import('@/pages/portal/Commissions'));
const PortalSupport = lazy(() => import('@/pages/portal/PortalSupport'));
const PortalSettings = lazy(() => import('@/pages/portal/PortalSettings'));

const PortalMembers = lazy(() => import('@/pages/portal/admin/PortalMembers'));
const PortalMemberDetail = lazy(() => import('@/pages/portal/admin/PortalMemberDetail'));
const PortalOrdersAdmin = lazy(() => import('@/pages/portal/admin/PortalOrdersAdmin'));
const PortalCommissions = lazy(() => import('@/pages/portal/admin/PortalCommissions'));
const PortalPayouts = lazy(() => import('@/pages/portal/admin/PortalPayouts'));
const PortalDeposits = lazy(() => import('@/pages/portal/admin/PortalDeposits'));
const InvoiceDetail = lazy(() => import('@/pages/finance/InvoiceDetail'));
const ExpenseDetail = lazy(() => import('@/pages/finance/ExpenseDetail'));
const PayrollDetail = lazy(() => import('@/pages/payroll/PayrollDetail'));
const ApplicationDetail = lazy(() => import('@/pages/hr/ApplicationDetail'));

export const routes: RouteObject[] = [
  // Auth routes (guest only)
  {
    path: '/login',
    element: <GuestGuard><StaffLogin /></GuestGuard>,
  },
  {
    path: '/portal/login',
    element: <GuestGuard><LazyPage element={<PortalLogin />} /></GuestGuard>,
  },
  {
    path: '/portal/register',
    element: <GuestGuard><LazyPage element={<PortalRegister />} /></GuestGuard>,
  },
  {
    path: '/forgot-password',
    element: <LazyPage element={<ForgotPassword />} />,
  },
  {
    path: '/reset-password',
    element: <LazyPage element={<ResetPassword />} />,
  },
  {
    path: '/verify-email',
    element: <LazyPage element={<VerifyEmail />} />,
  },

  // Staff routes (authenticated)
  {
    element: <AuthGuard userType="staff"><AppLayout /></AuthGuard>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'staff', element: <LazyPage element={<StaffList />} /> },
      { path: 'staff/:id', element: <LazyPage element={<StaffDetail />} /> },
      { path: 'staff/leaderboard', element: <LazyPage element={<StaffLeaderboard />} /> },
      {
        path: 'staff/branches',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<BranchManagement />} />
          </RoleGuard>
        ),
      },
      { path: 'tasks', element: <TaskList /> },
      { path: 'tasks/mine', element: <MyTasks /> },
      { path: 'tasks/:id', element: <LazyPage element={<TaskDetail />} /> },
      { path: 'projects', element: <ProjectList /> },
      { path: 'projects/:id', element: <LazyPage element={<ProjectDetail />} /> },
      { path: 'attendance', element: <LazyPage element={<MyAttendance />} /> },
      { path: 'attendance/team', element: <LazyPage element={<TeamAttendance />} /> },
      { path: 'attendance/check', element: <LazyPage element={<CheckinCheckout />} /> },
      { path: 'leave', element: <LazyPage element={<LeaveList />} /> },
      { path: 'leave/request', element: <LazyPage element={<LeaveRequestForm />} /> },
      { path: 'reports', element: <LazyPage element={<DailyReports />} /> },
      { path: 'reports/submit', element: <LazyPage element={<ReportSubmit />} /> },
      {
        path: 'payroll',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<PayrollList />} />
          </RoleGuard>
        ),
      },
      {
        path: 'payroll/:id',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<PayrollDetail />} />
          </RoleGuard>
        ),
      },
      { path: 'performance', element: <LazyPage element={<Performance />} /> },
      {
        path: 'finance/invoices',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<InvoiceList />} />
          </RoleGuard>
        ),
      },
      {
        path: 'finance/invoices/:id',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<InvoiceDetail />} />
          </RoleGuard>
        ),
      },
      {
        path: 'finance/expenses',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<ExpenseList />} />
          </RoleGuard>
        ),
      },
      {
        path: 'finance/expenses/:id',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<ExpenseDetail />} />
          </RoleGuard>
        ),
      },
      {
        path: 'finance/revenue',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<Revenue />} />
          </RoleGuard>
        ),
      },
      {
        path: 'finance/forecast',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<Forecast />} />
          </RoleGuard>
        ),
      },
      {
        path: 'finance/exchange-rates',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<ExchangeRates />} />
          </RoleGuard>
        ),
      },
      { path: 'crm/leads', element: <LazyPage element={<LeadList />} /> },
      { path: 'crm/leads/:id', element: <LazyPage element={<LeadDetail />} /> },
      { path: 'crm/pipeline', element: <LazyPage element={<Pipeline />} /> },
      { path: 'crm/orders', element: <LazyPage element={<SalesOrders />} /> },
      {
        path: 'crm/clients',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<ClientAccounts />} />
          </RoleGuard>
        ),
      },
      {
        path: 'hr/positions',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER']}>
            <LazyPage element={<Positions />} />
          </RoleGuard>
        ),
      },
      {
        path: 'hr/applications',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER']}>
            <LazyPage element={<Applications />} />
          </RoleGuard>
        ),
      },
      {
        path: 'hr/applications/:id',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER']}>
            <LazyPage element={<ApplicationDetail />} />
          </RoleGuard>
        ),
      },
      { path: 'assets/domains', element: <LazyPage element={<Domains />} /> },
      { path: 'assets/servers', element: <LazyPage element={<Servers />} /> },
      { path: 'assets/websites', element: <LazyPage element={<Websites />} /> },
      {
        path: 'assets/devices',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<Devices />} />
          </RoleGuard>
        ),
      },
      { path: 'services', element: <LazyPage element={<ServiceList />} /> },
      { path: 'services/backlinks', element: <LazyPage element={<BacklinkPackages />} /> },
      { path: 'support', element: <LazyPage element={<TicketList />} /> },
      { path: 'support/:id', element: <LazyPage element={<TicketDetail />} /> },
      {
        path: 'broadcast',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<BroadcastList />} />
          </RoleGuard>
        ),
      },
      {
        path: 'analytics',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<Analytics />} />
          </RoleGuard>
        ),
      },
      { path: 'notifications', element: <NotificationList /> },
      { path: 'settings/profile', element: <LazyPage element={<Profile />} /> },
      { path: 'settings/security', element: <LazyPage element={<Security />} /> },
      { path: 'settings/preferences', element: <LazyPage element={<Preferences />} /> },
      // Admin Portal
      {
        path: 'admin/portal/members',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<PortalMembers />} />
          </RoleGuard>
        ),
      },
      {
        path: 'admin/portal/members/:id',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<PortalMemberDetail />} />
          </RoleGuard>
        ),
      },
      {
        path: 'admin/portal/orders',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<PortalOrdersAdmin />} />
          </RoleGuard>
        ),
      },
      {
        path: 'admin/portal/commissions',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<PortalCommissions />} />
          </RoleGuard>
        ),
      },
      {
        path: 'admin/portal/payouts',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<PortalPayouts />} />
          </RoleGuard>
        ),
      },
      {
        path: 'admin/portal/deposits',
        element: (
          <RoleGuard roles={['CEO', 'CO_MD', 'OP_MANAGER']}>
            <LazyPage element={<PortalDeposits />} />
          </RoleGuard>
        ),
      },
    ],
  },

  // Portal routes (authenticated portal member)
  {
    path: 'portal',
    element: <AuthGuard userType="portal"><PortalLayout /></AuthGuard>,
    children: [
      { index: true, element: <PortalDashboard /> },
      { path: 'orders', element: <PortalOrders /> },
      { path: 'orders/:id', element: <LazyPage element={<PortalOrderDetail />} /> },
      { path: 'order', element: <PlaceOrder /> },
      { path: 'wallet', element: <WalletPage /> },
      { path: 'referrals', element: <LazyPage element={<Referrals />} /> },
      { path: 'referrals/leaderboard', element: <LazyPage element={<ReferralLeaderboard />} /> },
      { path: 'commissions', element: <LazyPage element={<Commissions />} /> },
      { path: 'support', element: <LazyPage element={<PortalSupport />} /> },
      { path: 'support/:id', element: <LazyPage element={<TicketDetail />} /> },
      { path: 'settings', element: <LazyPage element={<PortalSettings />} /> },
    ],
  },
];

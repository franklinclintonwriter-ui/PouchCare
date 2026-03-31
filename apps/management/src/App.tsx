import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { AppLayout } from '@/components/layout/AppLayout'

// Auth
import LoginPage from '@/pages/auth/LoginPage'

// Pages
import DashboardPage from '@/pages/dashboard/DashboardPage'
import CommandCenterPage from '@/pages/dashboard/CommandCenterPage'
import TasksPage from '@/pages/tasks/TasksPage'
import ProjectsPage from '@/pages/projects/ProjectsPage'
import StaffPage from '@/pages/staff/StaffPage'
import AttendancePage from '@/pages/attendance/AttendancePage'
import LeavePage from '@/pages/leave/LeavePage'
import ReportsPage from '@/pages/reports/ReportsPage'
import FinancePage from '@/pages/finance/FinancePage'
import CrmPage from '@/pages/crm/CrmPage'
import PortalPage from '@/pages/portal/PortalPage'
import AnalyticsPage from '@/pages/analytics/AnalyticsPage'
import AssetsPage from '@/pages/assets/AssetsPage'
import HrPage from '@/pages/hr/HrPage'
import BroadcastPage from '@/pages/broadcast/BroadcastPage'
import SupportPage from '@/pages/support/SupportPage'
import SettingsPage from '@/pages/settings/SettingsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        <Route path="command-center" element={<CommandCenterPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="crm" element={<CrmPage />} />
        <Route path="portal" element={<PortalPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="hr" element={<HrPage />} />
        <Route path="broadcast" element={<BroadcastPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

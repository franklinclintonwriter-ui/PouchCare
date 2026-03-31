import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { AppLayout } from '@/components/layout/AppLayout'

import LoginPage from '@/pages/auth/LoginPage'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import BranchDashboardPage from '@/pages/dashboard/BranchDashboardPage'
import LeaderboardPage from '@/pages/dashboard/LeaderboardPage'
import TasksPage from '@/pages/tasks/TasksPage'
import AttendancePage from '@/pages/attendance/AttendancePage'
import LeavePage from '@/pages/leave/LeavePage'
import ReportsPage from '@/pages/reports/ReportsPage'
import PerformancePage from '@/pages/performance/PerformancePage'
import AnnouncementsPage from '@/pages/announcements/AnnouncementsPage'
import ProfilePage from '@/pages/profile/ProfilePage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />

      <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        <Route path="branch-dashboard" element={<BranchDashboardPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

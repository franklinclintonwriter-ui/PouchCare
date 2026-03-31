export type SystemRole = 'CEO' | 'Brother / Co-MD' | 'Operation Manager' | 'HR Manager' | 'Branch Manager' | 'Staff' | 'Intern'

export interface User {
  id: string; name: string; email: string; role: SystemRole
  branch?: string; avatar?: string; memberId?: number
}

export interface Task {
  id: string; taskId: number; title: string
  status: string; approvalStatus: string; priority: string
  deadline?: string; estimatedHours?: number; actualHours?: number
  progress: number; ceoWorkRating?: number; notes?: string; createdAt: string
}

export interface AttendanceRecord {
  id: string; date: string; status: string
  workType: string; checkInTime?: string; checkOutTime?: string
  hoursWorked?: number; overtimeHours?: number
}

export interface LeaveRequest {
  id: string; leaveType: string; status: string
  startDate: string; endDate: string; totalDays: number; reason?: string
}

export interface DailyReport {
  id: string; reportDate: string; tasksCompleted: string
  plannedTomorrow: string; blockers?: string; hoursWorked: number; mood: string; status: string
}

export interface Announcement {
  id: string; title: string; message: string; sentBy: string
  createdAt: string; isUrgent: boolean; read: boolean
}

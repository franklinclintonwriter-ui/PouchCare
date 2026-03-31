// ── Auth ────────────────────────────────────────────────
// These match Prisma SystemRole enum keys exactly (not @map values)
export type SystemRole = 'CEO' | 'CO_MD' | 'OP_MANAGER' | 'HR_MANAGER' | 'BRANCH_MANAGER' | 'STAFF' | 'INTERN'

// Display labels for UI
export const ROLE_LABELS: Record<SystemRole, string> = {
  CEO:            'CEO',
  CO_MD:          'Co-MD',
  OP_MANAGER:     'Operations Manager',
  HR_MANAGER:     'HR Manager',
  BRANCH_MANAGER: 'Branch Manager',
  STAFF:          'Staff',
  INTERN:         'Intern',
}

export interface User {
  id: string
  name: string
  email: string
  role: SystemRole
  branch?: string
  avatar?: string
  twoFactorEnabled?: boolean
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
}

// ── Tasks ────────────────────────────────────────────────
export type TaskStatus = 'Not Started' | 'In Progress' | 'Blocked' | 'Review' | 'Done'
export type TaskApproval = 'Waiting for Submission' | 'Submitted by Staff' | 'Approved by Manager' | 'Rejected by Manager' | 'Escalated to CEO' | 'Completed & Verified'
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low'

export interface Task {
  id: string
  taskId: number
  title: string
  status: TaskStatus
  approvalStatus: TaskApproval
  priority: Priority
  category: string
  assignedMember?: string
  assignedManager?: string
  assignedBranch?: string
  createdByRole: SystemRole
  relatedProject?: string
  relatedClient?: string
  startDate?: string
  deadline?: string
  completedDate?: string
  estimatedHours?: number
  actualHours?: number
  progress: number
  ceoVerified: boolean
  ceoWorkRating?: number
  ceoRatingNote?: string
  notes?: string
  createdAt: string
}

// ── Projects ─────────────────────────────────────────────
export interface Project {
  id: string
  projectId: number
  name: string
  status: string
  projectType: string
  serviceType: string
  paymentStatus: string
  clientName?: string
  clientEmail?: string
  price?: number
  paidAmount?: number
  progress: number
  deadline?: string
  startDate?: string
  assignedBranch?: string
  createdAt: string
}

// ── Staff ─────────────────────────────────────────────────
export interface StaffMember {
  id: string
  memberId: number
  name: string
  email: string
  phone?: string
  whatsapp?: string
  systemRole: SystemRole
  status: 'Active' | 'On Leave' | 'Inactive'
  branch?: string
  jobRole?: string
  primarySkill?: string
  skillLevel?: string
  salary?: number
  joinDate?: string
  employmentType?: string
  averageTaskRating?: number
  ceoPerformanceRating?: number
  tasksCompleted?: number
}

// ── Attendance ──────────────────────────────────────────
export interface AttendanceRecord {
  id: string
  attendanceId: number
  name: string
  branch?: string
  date: string
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Remote'
  workType: string
  staffRole: SystemRole
  checkInTime?: string
  checkOutTime?: string
  hoursWorked?: number
  overtimeHours?: number
}

// ── Leave ────────────────────────────────────────────────
export interface LeaveRequest {
  id: string
  leaveId: number
  staffName: string
  staffRole: SystemRole
  branch?: string
  leaveType: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'
  startDate: string
  endDate: string
  totalDays: number
  reason?: string
  approvedBy?: string
}

// ── Finance ──────────────────────────────────────────────
export interface Invoice {
  id: string
  invoiceNumber: string
  clientName?: string
  service?: string
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'
  amountUsd: number
  issueDate: string
  dueDate?: string
  paidDate?: string
  paymentMethod?: string
}

export interface Expense {
  id: string
  title: string
  category: string
  amountUsd: number
  status: string
  paidBy?: string
  branch?: string
  expenseDate: string
}

// ── CRM ──────────────────────────────────────────────────
export interface Lead {
  id: string
  leadId: number
  company: string
  contactName?: string
  email?: string
  stage: 'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost'
  source?: string
  serviceInterested?: string
  budgetUsd?: number
  estimatedValue?: number
  leadScore?: number
  owner?: string
  nextFollowUpDate?: string
  convertedToClient: boolean
}

// ── Portal ────────────────────────────────────────────────
export interface PortalMember {
  id: string
  fullName: string
  email: string
  country?: string
  status: string
  referralCode: string
  walletBalance: number
  totalOrders: number
  totalCommissionEarned: number
  registrationDate: string
  emailVerified: boolean
}

export interface PayoutRequest {
  id: string
  memberName: string
  amountUsd: number
  paymentMethod: string
  status: 'Pending' | 'Processing' | 'Completed' | 'Rejected'
  requestedDate: string
}

// ── Analytics ─────────────────────────────────────────────
export interface KpiCard {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  color: 'sky' | 'green' | 'yellow' | 'red'
  icon: string
}

export interface HealthScore {
  total: number
  revenue: number
  tasks: number
  attendance: number
  clientSatisfaction: number
  noBlockers: number
  pipeline: number
}

// ── Notifications ─────────────────────────────────────────
export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}

// ── Pagination ────────────────────────────────────────────
export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: { page: number; limit: number; total: number }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
}

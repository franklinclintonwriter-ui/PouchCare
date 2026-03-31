// @pouchcare/types — Shared TypeScript types across all apps

export type SystemRole = 
  | 'CEO' 
  | 'CO_MD' 
  | 'OPERATION_MANAGER' 
  | 'HR_MANAGER' 
  | 'BRANCH_MANAGER' 
  | 'STAFF' 
  | 'INTERN'

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'REVIEW' | 'DONE'

export type ApprovalStatus = 
  | 'WAITING_FOR_SUBMISSION'
  | 'SUBMITTED_BY_STAFF'
  | 'APPROVED_BY_MANAGER'
  | 'REJECTED_BY_MANAGER'
  | 'ESCALATED_TO_CEO'
  | 'COMPLETED_AND_VERIFIED'

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type LeaveType = 'ANNUAL' | 'SICK' | 'EMERGENCY' | 'MATERNITY' | 'PATERNITY' | 'UNPAID'

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'REFUNDED'

export type CrmStage = 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST'

export interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface User {
  id: string
  name: string
  email: string
  role: SystemRole
  branch?: string
  memberId?: number
}

export interface PortalUser {
  id: string
  fullName: string
  email: string
  referralCode: string
  walletBalance: number
}

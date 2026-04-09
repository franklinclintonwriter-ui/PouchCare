// Status color mappings for all enum types

export const STATUS_COLORS: Record<string, string> = {
  // Task Status
  NOT_STARTED: 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',

  // Approval Status
  WAITING: 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
  SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  APPROVED_MGR: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  REJECTED_MGR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  ESCALATED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  VERIFIED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',

  // Priority
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',

  // Project Status
  PENDING: 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
  DELIVERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  ON_HOLD: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',

  // Payment Status
  UNPAID: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  PARTIAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  REFUNDED: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',

  // Lead Stage
  NEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  QUALIFIED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  PROPOSAL: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  NEGOTIATION: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  WON: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  LOST: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',

  // Attendance Status
  PRESENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  ABSENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  LATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  HALF_DAY: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  REMOTE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',

  // Leave Status
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',

  // Portal
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  PENDING_VERIFICATION: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  INACTIVE: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',

  // Orders
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  REVISION_REQUESTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',

  // Commissions
  PENDING_HOLD: 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
  AVAILABLE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  PAID_OUT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  FRAUD_HOLD: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',

  // Support (normalized + title-case variants)
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  waiting: 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',
  Open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Waiting: 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
  Resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',
};

export const STATUS_DOT_COLORS: Record<string, string> = {
  NOT_STARTED: 'bg-gray-400',
  IN_PROGRESS: 'bg-blue-500',
  BLOCKED: 'bg-red-500',
  REVIEW: 'bg-amber-500',
  DONE: 'bg-emerald-500',
  PRESENT: 'bg-emerald-500',
  ABSENT: 'bg-red-500',
  LATE: 'bg-amber-500',
  REMOTE: 'bg-blue-500',
  ACTIVE: 'bg-emerald-500',
  SUSPENDED: 'bg-red-500',
  INACTIVE: 'bg-gray-400',
  open: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  waiting: 'bg-gray-400',
  resolved: 'bg-emerald-500',
  closed: 'bg-gray-400',
};

export const PRIORITY_ICONS: Record<string, { color: string; label: string }> = {
  CRITICAL: { color: 'text-red-600 dark:text-red-400', label: 'Critical' },
  HIGH: { color: 'text-orange-600 dark:text-orange-400', label: 'High' },
  MEDIUM: { color: 'text-amber-600 dark:text-amber-400', label: 'Medium' },
  LOW: { color: 'text-gray-500 dark:text-gray-400', label: 'Low' },
};

export function getStatusLabel(status: string | undefined | null): string {
  if (status == null || status === '') return '—';
  return String(status)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

import type {
  SystemRole,
  TaskStatus,
  ApprovalStatus,
  Priority,
  AttendanceStatus,
  WorkType,
  LeaveType,
  LeaveStatus,
  ProjectStatus,
  PaymentStatus,
  LeadStage,
  PortalMemberStatus,
  OrderStatus,
  WalletTxType,
  CommissionStatus,
  PayoutStatus,
  PaymentMethod,
} from "./enums";

// ── Staff & HR ──────────────────────────────────────────────
export interface StaffMember {
  id: string;
  memberId: string;
  name: string;
  email: string;
  systemRole: SystemRole;
  branch: string;
  phone: string;
  department: string;
  joinDate: string;
  /** Omitted on the list API when the viewer lacks HR/profile-admin access. */
  salary?: number;
  isActive: boolean;
  avatarUrl?: string;
}

/** Full staff record from GET /staff/members/:id (extends list fields). */
export interface StaffProfileDetail extends StaffMember {
  /** `limited` = colleague directory view (no salary/PII). `full` = self or HR. */
  profileScope?: "full" | "limited";
  profileAdmin?: boolean;
  rolePermissions?: Record<string, boolean> | null;
  email2?: string | null;
  whatsapp?: string | null;
  primarySkill?: string | null;
  status?: string;
  skillLevel?: string | null;
  secondarySkills?: string | null;
  toolsKnown?: string | null;
  yearsExperience?: number | null;
  employmentType?: string | null;
  country?: string | null;
  address?: string | null;
  nidPassport?: string | null;
  emergencyContact?: string | null;
  terminationDate?: string | null;
  exitReason?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  certifications?: string | null;
  averageTaskRating?: number | null;
  ceoPerformanceRating?: number | null;
  ceoRatingNote?: string | null;
  ceoLastRatedDate?: string | null;
  tasksAssigned?: number;
  tasksCompleted?: number;
  totalTasksRated?: number;
  performanceScore?: number | null;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  /** Salary stored in this currency (default system: BDT). */
  preferredCurrency?: "USD" | "BDT" | null;
}

export type TaskAttachmentItem = {
  url: string;
  name: string;
  uploadedAt: string;
};

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar?: string;
  assignedBranch?: string | null;
  assignedManagerId?: string | null;
  assignedManagerName?: string;
  status: TaskStatus;
  approvalStatus: ApprovalStatus;
  priority: Priority;
  dueDate: string;
  rating?: number;
  tags: string[];
  createdAt: string;
  progress?: number;
  progressUpdatedAt?: string | null;
  actualHours?: number | null;
  taskAttachments?: TaskAttachmentItem[];
  /** Set when manager approves or rejects (API). */
  managerApprovedDate?: string | null;
  managerApprovalNote?: string | null;
  /** Set when CEO verifies completion. */
  ceoVerifiedDate?: string | null;
  completedDate?: string | null;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  spent: number;
  teamIds: string[];
  teamMembers: { id: string; name: string; avatarUrl?: string }[];
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  avatarUrl?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  workType: WorkType;
  hours: number;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  avatarUrl?: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  approvedBy?: string;
  createdAt: string;
}

export interface PayrollEntry {
  id: string;
  staffId: string;
  staffName: string;
  role: SystemRole;
  branch: string;
  month: number;
  year: number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPay: number;
  status: PaymentStatus;
  paymentMethod?: string;
  notes?: string;
  /** ISO date when payment was marked complete (if paid) */
  paymentDate?: string | null;
}

export interface PerformanceReview {
  id: string;
  staffId: string;
  staffName: string;
  avatarUrl?: string;
  period: string;
  scores: {
    tasks: number;
    attendance: number;
    quality: number;
    initiative: number;
  };
  overallScore: number;
  trend: number;
  comments: string;
}

export interface DailyReport {
  id: string;
  staffId: string;
  staffName: string;
  avatarUrl?: string;
  date: string;
  tasksCompleted: number;
  hoursWorked: number;
  notes: string;
  mood: "great" | "good" | "okay" | "bad";
  status: ApprovalStatus;
}

// ── Finance ─────────────────────────────────────────────────
export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  status: PaymentStatus;
  issueDate: string;
  dueDate: string;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  staffId: string;
  staffName: string;
  date: string;
  receiptUrl?: string;
  status: ApprovalStatus;
}

export interface MonthlyRevenue {
  id?: string;
  month: string;
  year?: number;
  revenue: number;
  expenses: number;
  profit: number;
  notes?: string;
}

// ── CRM ─────────────────────────────────────────────────────
export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  stage: LeadStage;
  value: number;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar?: string;
  source: string;
  lastContactDate: string;
  notes: string;
  createdAt: string;
}

export interface SalesOrder {
  id: string;
  number: string;
  clientName: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: PaymentStatus;
  date: string;
  assigneeName: string;
}

// ── Assets (Management / staff only) ─────────────────────────────────
// These shapes map the STAFF dashboard (`/assets/*`) — PouchCare's internal domain/server/website
// inventory. The client portal uses different endpoints (`/portal/hosting`, `/portal/websites`)
// and member-scoped data; see `apps/landing` + `apps/api/src/routes/portal/*`.
export interface Domain {
  id: string;
  domain: string;
  domainName?: string;
  registrar: string;
  expiryDate: string;
  registrationDate?: string;
  autoRenew: boolean;
  status: string;
  lifecycleStatus: "INCOMPLETE" | "IN_PROGRESS" | "COMPLETED";
  dnsProvider: string;
  annualCost: number;
  assignedTo?: string;
  assignedStaffId?: string;
  daScore?: number | null;
  drScore?: number | null;
  backlinksCount?: number | null;
  indexedPages?: number | null;
  monthlyTraffic?: number | null;
  niche?: string | null;
  sslStatus?: string | null;
  nameservers?: string | null;
  whoisPrivacy?: boolean;
  adsenseConnected?: boolean;
  adsensePublisherId?: string | null;
  analyticsId?: string | null;
  searchConsoleVerified?: boolean;
  notes?: string | null;
  linkedWebsite?: {
    id: string;
    name: string;
    url?: string;
    status: string;
    platform?: string;
  } | null;
  linkedServer?: {
    id: string;
    name: string;
    status: string;
    ipAddress?: string;
  } | null;
}

export interface ServerAsset {
  id: string;
  name: string;
  provider: string;
  ip: string;
  specs: { cpu: string; ram: string; disk: string };
  usage: { cpu: number; ram: number; disk: number };
  status: "online" | "offline" | "maintenance";
  uptime: number;
  monthlyCost: number;
  websiteCount: number;
}

export interface WebsiteAsset {
  id: string;
  name: string;
  url: string;
  serverId: string;
  serverName: string;
  domainId: string;
  domainName: string;
  status: string;
  platform?: string | null;
  cms?: string | null;
  programmingLang?: string | null;
  framework?: string | null;
  monthlyTraffic: number;
  lastDeploy: string;
  assignedStaffId?: string | null;
  adsenseConnected?: boolean;
  adsenseEarnings?: number | null;
  analyticsId?: string | null;
  uptimePercent?: number | null;
  avgLoadTime?: number | null;
  daScore?: number | null;
  sslStatus?: string | null;
  notes?: string | null;
  linkedDomain?: {
    id: string;
    domainName: string;
    status: string;
    lifecycleStatus: string;
    sslStatus?: string;
  } | null;
  linkedServer?: {
    id: string;
    name: string;
    status: string;
    ipAddress?: string;
    provider?: string;
  } | null;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  priceRange: { min: number; max: number };
  isActive: boolean;
  orderCount: number;
  icon: string;
}

export interface BacklinkPackage {
  id: string;
  name: string;
  tier: "basic" | "standard" | "premium" | "enterprise";
  daRange: string;
  linkType: string;
  quantity: number;
  price: number;
  turnaround: string;
  isPopular: boolean;
}

// ── Communication ───────────────────────────────────────────
export interface TicketMessage {
  id: string;
  content: string;
  authorName: string;
  authorAvatar?: string;
  isStaff: boolean;
  createdAt: string;
}

export interface Ticket {
  id: string;
  number: string;
  subject: string;
  clientName: string;
  clientEmail: string;
  priority: Priority;
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  assigneeId?: string;
  assigneeName?: string;
  category: string;
  messages: TicketMessage[];
  createdAt: string;
  lastReplyAt: string;
}

/** Matches `GET/POST /v1/broadcast` (Prisma Broadcast model). */
export interface Broadcast {
  id: string;
  title: string;
  message: string;
  sentBy: string;
  audience: string;
  channel: "in_app" | "email";
  isUrgent: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: "task" | "leave" | "ticket" | "payment" | "system" | "order";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  resourceUrl?: string;
}

// ── HR Recruitment ──────────────────────────────────────────
export interface Position {
  id: string;
  title: string;
  department: string;
  location: string;
  type: "full_time" | "part_time" | "contract" | "internship";
  salaryRange: { min: number; max: number };
  applicationsCount: number;
  status: "open" | "closed" | "paused";
  postedDate: string;
  published?: boolean;
  deadline?: string;
  description?: string;
}

export interface JobApplication {
  id: string;
  applicantName: string;
  applicantEmail: string;
  positionId: string;
  positionTitle: string;
  stage: "new" | "screening" | "interview" | "offer" | "hired" | "rejected";
  resumeUrl?: string;
  rating: number;
  appliedDate: string;
  notes: string;
  interviewerNotes?: string;
  interviewDate?: string;
  rejectionReason?: string;
  offerSalary?: number;
  source?: string;
  score?: number;
}

// ── Portal ──────────────────────────────────────────────────
export interface PortalMember {
  id: string;
  fullName: string;
  email: string;
  country: string;
  phone: string;
  status: PortalMemberStatus;
  walletBalance: number;
  referralCode: string;
  totalOrders: number;
  totalSpent: number;
  referralsCount: number;
  joinDate: string;
  avatarUrl?: string;
}

export interface PortalOrder {
  id: string;
  number: string;
  memberId: string;
  memberName: string;
  serviceName: string;
  serviceId: string;
  amount: number;
  status: OrderStatus;
  placedDate: string;
  deliveryDate?: string;
  assignedStaff?: string;
  progress: number;
  specifications: Record<string, string>;
}

export interface WalletTransaction {
  id: string;
  type: WalletTxType;
  description: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
}

export interface Referral {
  id: string;
  memberName: string;
  email: string;
  status: PortalMemberStatus;
  joinedDate: string;
  ordersCount: number;
  earnings: number;
  children?: Referral[];
}

export interface CommissionRecord {
  id: string;
  memberId: string;
  memberName: string;
  orderRef: string;
  amount: number;
  status: CommissionStatus;
  earnedDate: string;
  availableDate?: string;
  paidDate?: string;
}

export interface PayoutRecord {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  method: PaymentMethod;
  accountDetails: string;
  status: PayoutStatus;
  requestedDate: string;
  processedDate?: string;
}

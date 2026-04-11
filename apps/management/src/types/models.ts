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
  salary: number;
  isActive: boolean;
  avatarUrl?: string;
}

/** Full staff record from GET /staff/members/:id (extends list fields). */
export interface StaffProfileDetail extends StaffMember {
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
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar?: string;
  status: TaskStatus;
  approvalStatus: ApprovalStatus;
  priority: Priority;
  dueDate: string;
  rating?: number;
  tags: string[];
  createdAt: string;
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
  startDate: string;
  dueDate: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  avatarUrl?: string;
  date: string;
  checkIn: string;
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

// ── Assets ──────────────────────────────────────────────────
export interface Domain {
  id: string;
  domain: string;
  registrar: string;
  expiryDate: string;
  autoRenew: boolean;
  status: "active" | "expired" | "transferred";
  dnsProvider: string;
  annualCost: number;
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
  status: "live" | "staging" | "down" | "maintenance";
  monthlyTraffic: number;
  lastDeploy: string;
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

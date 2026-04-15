export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PortalOrderRow {
  id: string;
  orderId: number;
  service: string;
  serviceName?: string;
  status: string;
  amountUsd: number;
  quantity: number;
  orderDate: string;
  deadline?: string | null;
  deliveryDate?: string | null;
  paymentStatus?: string;
  rating?: number | null;
  reviewNote?: string | null;
}

export interface WalletSummary {
  walletBalance: number;
  totalDeposited: number;
  totalSpent: number;
  totalCommissionEarned: number;
}

export interface WalletTxRow {
  id: string;
  type: string;
  amountUsd: number;
  balanceAfterUsd: number;
  status: string;
  paymentMethod?: string | null;
  transactionDate: string;
  reference?: string | null;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  basePriceUsd?: number | null;
  shortDescription?: string | null;
  turnaroundDays?: number | null;
  featured?: boolean;
}

export interface ReferralRow {
  id: string;
  referredName: string;
  referredEmail: string;
  country?: string | null;
  totalOrders: number;
  status: string;
  registrationDate: string;
}

export interface CommissionRow {
  id: string;
  orderAmountUsd: number;
  commissionAmountUsd: number;
  commissionRate: number;
  status: string;
  referredMemberName?: string | null;
  holdReleaseDate: string;
  createdAt: string;
}

export interface PayoutRow {
  id: string;
  amountUsd: number;
  paymentMethod: string;
  status: string;
  requestedDate: string;
  processedDate?: string | null;
}

export interface SupportTicketRow {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  replies?: TicketReply[];
}

export interface TicketReply {
  id: string;
  content: string;
  authorName: string;
  authorType: string;
  createdAt: string;
}

export interface PortalProfile extends Record<string, unknown> {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  country?: string | null;
  avatarUrl?: string | null;
  referralCode: string;
}

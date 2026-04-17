/**
 * Shared admin-panel contract types.
 * Imported by apps/api (response shaping) and apps/management (typed API client).
 *
 * Source of truth lives in Notion §5 — Data Model & API Contracts.
 */

// ──────────────────────────────────────────────────────────────
// Generic envelopes
// ──────────────────────────────────────────────────────────────

export interface ListParams {
  page?: number
  pageSize?: number
  sort?: string                                // `field:asc` / `field:desc`
  q?: string
  filters?: Record<string, string | undefined>
}

export interface ListMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ListResult<T> {
  items: T[]
  meta: ListMeta
}

// ──────────────────────────────────────────────────────────────
// Unified Client
// Merges PortalMember + ClientAccount via email, dedup'd.
// ──────────────────────────────────────────────────────────────

export type ClientStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'CHURNED'

export interface UnifiedClient {
  id: string                                   // unique: portalMemberId || `acct:${clientAccountId}`
  portalMemberId?: string
  clientAccountId?: string
  fullName: string
  email: string
  phone?: string
  whatsapp?: string
  country?: string
  avatarUrl?: string
  status: ClientStatus
  assignedManager?: string
  tags: string[]
  source?: string
  walletBalance: number                        // USD
  totalSpentUsd: number
  totalOrders: number
  firstOrderDate?: string                      // ISO
  lastOrderDate?: string                       // ISO
  referralCode?: string
  createdAt: string
  updatedAt: string
}

// ──────────────────────────────────────────────────────────────
// Unified Order — collapses PortalOrder, SalesOrder, ApkJob
// ──────────────────────────────────────────────────────────────

export type AdminOrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'IN_REVISION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'DISPUTED'

export type OrderKind = 'portal' | 'sales' | 'apk'
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED'

export interface AdminOrder {
  id: string                                   // `${kind}:${uuid}`
  kind: OrderKind
  displayId: string                            // e.g. PO-0219, SO-7714, APK-118
  client: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string
  }
  service: { id?: string; name: string; kind: OrderKind }
  status: AdminOrderStatus
  paymentStatus: PaymentStatus
  amountUsd: number
  amountBdt?: number
  quantity: number
  requirements?: string
  deliveryLink?: string
  deadline?: string
  assigneeId?: string
  revisionCount: number
  rating?: number
  reviewNote?: string
  orderedAt: string
  deliveredAt?: string
}

// Status DAG used by both server (validation) and client (UI gating).
export const ORDER_STATUS_DAG: Record<AdminOrderStatus, AdminOrderStatus[]> = {
  DRAFT:        ['PENDING', 'CANCELLED'],
  PENDING:      ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS:  ['DELIVERED', 'CANCELLED'],
  DELIVERED:    ['IN_REVISION', 'COMPLETED', 'DISPUTED'],
  IN_REVISION:  ['DELIVERED', 'CANCELLED'],
  COMPLETED:    ['REFUNDED', 'DISPUTED'],
  CANCELLED:    [],
  REFUNDED:     [],
  DISPUTED:     ['REFUNDED', 'COMPLETED'],
}

export function canTransition(from: AdminOrderStatus, to: AdminOrderStatus): boolean {
  return (ORDER_STATUS_DAG[from] ?? []).includes(to)
}

// ──────────────────────────────────────────────────────────────
// Admin Overview
// ──────────────────────────────────────────────────────────────

export interface AdminOverview {
  clients: { total: number; newThisWeek: number; activePct: number }
  orders: {
    total: number
    byStatus: Partial<Record<AdminOrderStatus, number>>
    overdue: number
    unassigned: number
  }
  revenue: { mtdUsd: number; mtdBdt?: number }
  support: { open: number; overdueSla: number }
  generatedAt: string
}

// ──────────────────────────────────────────────────────────────
// Mutation payloads
// ──────────────────────────────────────────────────────────────

export interface AdjustWalletPayload {
  deltaUsd: number
  reason: string
  note?: string
  idempotencyKey: string
}

export interface AdvanceOrderPayload {
  to: AdminOrderStatus
  note?: string
  deliveryLink?: string
}

export interface RefundOrderPayload {
  amountUsd: number
  method: 'WALLET' | 'INVOICE_VOID' | 'EXTERNAL'
  reason: string
  idempotencyKey: string
}

export interface BulkOrdersPayload {
  ids: string[]                                // `${kind}:${uuid}` form
  action: 'assign' | 'advance' | 'cancel'
  to?: AdminOrderStatus                        // for advance
  assigneeId?: string                          // for assign
}

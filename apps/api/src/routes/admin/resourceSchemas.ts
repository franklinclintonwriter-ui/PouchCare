import { z } from "zod";

// ── Device schemas ──────────────────────────────────────────

export const deviceCreateSchema = z.object({
  staffMemberId: z.string().uuid(),
  deviceName: z.string().trim().min(1).max(200),
  deviceType: z.string().trim().max(100).optional(),
  ipAddress: z.string().trim().max(45).optional(),
  macAddress: z
    .string()
    .trim()
    .max(17)
    .regex(
      /^([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}$/,
      "Invalid MAC address format",
    )
    .optional(),
  os: z.string().trim().max(100).optional(),
  status: z
    .enum(["Active", "Inactive", "Maintenance", "Decommissioned"])
    .optional(),
  systemRole: z.string().trim().max(50).optional(),
  branch: z.string().trim().max(200).optional(),
  registeredDate: z.coerce.date().optional(),
  lastActive: z.coerce.date().optional(),
  notes: z.string().trim().max(5000).optional(),
});

export const deviceUpdateSchema = deviceCreateSchema.partial();

// ── Client Account schemas ──────────────────────────────────

export const clientAccountCreateSchema = z.object({
  clientName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  country: z.string().trim().max(120).optional(),
  status: z.enum(["Active", "Inactive", "Lead", "Churned"]).optional(),
  totalSpentUsd: z.number().min(0).optional(),
  totalOrders: z.number().int().min(0).optional(),
  firstOrderDate: z.coerce.date().optional(),
  lastOrderDate: z.coerce.date().optional(),
  assignedManager: z.string().trim().max(200).optional(),
  source: z.string().trim().max(100).optional(),
  linkedinUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(5000).optional(),
});

export const clientAccountUpdateSchema = clientAccountCreateSchema.partial();

// ── Portal Order status transition ──────────────────────────

const VALID_ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "DELIVERED",
  "REVISION_REQUESTED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
] as const;

/**
 * Defines which statuses a given order status can transition TO.
 * Prevents nonsensical transitions like CANCELLED → DELIVERED.
 */
const ORDER_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["REVISION_REQUESTED", "COMPLETED", "REFUNDED"],
  REVISION_REQUESTED: ["PROCESSING", "CANCELLED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: [], // terminal
  REFUNDED: [], // terminal
};

export const orderStatusUpdateSchema = z.object({
  status: z.enum(VALID_ORDER_STATUSES),
  deliveryLink: z.string().trim().url().max(2000).optional().or(z.literal("")),
});

export function validateOrderStatusTransition(
  currentStatus: string,
  newStatus: string,
): { valid: boolean; message?: string } {
  const allowed = ORDER_STATUS_TRANSITIONS[currentStatus];
  if (!allowed) {
    return {
      valid: false,
      message: `Unknown current status: ${currentStatus}`,
    };
  }
  if (!allowed.includes(newStatus)) {
    return {
      valid: false,
      message: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(", ") || "none (terminal status)"}`,
    };
  }
  return { valid: true };
}

// ── Payout processing schema ────────────────────────────────

export const payoutProcessSchema = z.object({
  status: z.enum(["COMPLETED", "REJECTED"]),
  transactionId: z.string().trim().max(500).optional(),
});

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PouchCare Admin Portal - Snapshot Entity Schemas
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This file defines comprehensive Zod schemas for all entities stored within the
 * admin portal's PortalSnapshot JSON blob (CRM workspace data).
 *
 * ENTITY SHAPES:
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ PROJECT                                                                     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ id          string   Unique identifier (e.g., "proj_abc123def456")          │
 * │ name        string   Project name                                           │
 * │ description string?  Optional project description                           │
 * │ status      enum     "draft" | "active" | "paused" | "completed" | "archived"│
 * │ companyId   string?  Reference to parent company                            │
 * │ tags        string[] Optional tags for categorization                       │
 * │ createdAt   string   ISO date string                                        │
 * │ updatedAt   string   ISO date string                                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ PAGE                                                                        │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ id          string   Unique identifier (e.g., "page_abc123def456")          │
 * │ title       string   Page title                                             │
 * │ slug        string   URL-friendly identifier                                │
 * │ projectId   string?  Reference to parent project                            │
 * │ content     string?  Page content (HTML, markdown, or JSON)                 │
 * │ status      enum     "draft" | "published" | "scheduled" | "archived"       │
 * │ template    string?  Template identifier                                    │
 * │ seoMeta     object?  SEO metadata (title, description, keywords, ogImage)   │
 * │ createdAt   string   ISO date string                                        │
 * │ updatedAt   string   ISO date string                                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ MEDIA                                                                       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ id          string   Unique identifier (e.g., "media_abc123def456")         │
 * │ url         string   Full URL to the media file                             │
 * │ filename    string?  Original filename                                      │
 * │ alt         string?  Alt text for accessibility                             │
 * │ type        enum     "image" | "video" | "audio" | "document" | "other"     │
 * │ mimeType    string?  MIME type (e.g., "image/png")                          │
 * │ size        number?  File size in bytes                                     │
 * │ dimensions  object?  Width and height for images/videos                     │
 * │ uploadedAt  string   ISO date string                                        │
 * │ uploadedBy  string?  User ID who uploaded                                   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ LEAD                                                                        │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ id          string   Unique identifier (e.g., "lead_abc123def456")          │
 * │ email       string   Contact email (validated format)                       │
 * │ name        string?  Contact name                                           │
 * │ phone       string?  Contact phone number                                   │
 * │ source      enum     "website" | "referral" | "ads" | "social" | "manual" | │
 * │                      "api" | "import" | "other"                             │
 * │ status      enum     "new" | "contacted" | "qualified" | "converted" |      │
 * │                      "lost" | "unsubscribed"                                │
 * │ companyId   string?  Reference to associated company                        │
 * │ notes       string?  Additional notes                                       │
 * │ metadata    object?  Custom metadata fields                                 │
 * │ createdAt   string   ISO date string                                        │
 * │ updatedAt   string?  ISO date string                                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ COMPANY                                                                     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ id          string   Unique identifier (e.g., "co_abc123def456")            │
 * │ name        string   Company name                                           │
 * │ email       string?  Primary contact email                                  │
 * │ status      enum     "Active" | "Suspended" | "Trial" | "Churned"           │
 * │ plan        string?  Subscription plan                                      │
 * │ websites    number   Number of websites                                     │
 * │ mrr         number   Monthly recurring revenue                              │
 * │ updated     string   Last update date                                       │
 * │ suspension  object?  Suspension details                                     │
 * │ usageLimits object?  Usage limit configuration                              │
 * │ internalNotes array  Internal notes array                                   │
 * │ websitesList array   Associated websites                                    │
 * │ subscriptions array  Subscription records                                   │
 * │ invoices    array    Invoice records                                        │
 * │ auditEvents array    Audit event log                                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ TEMPLATE                                                                    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ id          string   Unique identifier                                      │
 * │ name        string   Template name                                          │
 * │ type        enum     "page" | "email" | "component"                         │
 * │ content     string?  Template content/structure                             │
 * │ thumbnail   string?  Preview image URL                                      │
 * │ category    string?  Template category                                      │
 * │ isActive    boolean  Whether template is available for use                  │
 * │ createdAt   string   ISO date string                                        │
 * │ updatedAt   string   ISO date string                                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ TEAM MEMBER                                                                 │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ id          string   Unique identifier (e.g., "tm_abc123def456")            │
 * │ name        string   Team member name                                       │
 * │ email       string   Team member email                                      │
 * │ role        string?  Role/title                                             │
 * │ avatar      string?  Avatar URL                                             │
 * │ status      enum     "active" | "invited" | "inactive"                      │
 * │ permissions object?  Permission set                                         │
 * │ updated     string   Last update date                                       │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ BILLING RECORD                                                              │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ id          string   Unique identifier (e.g., "inv_abc123def456")           │
 * │ companyId   string?  Associated company                                     │
 * │ amount      number   Amount in cents                                        │
 * │ currency    string   Currency code (e.g., "USD")                            │
 * │ status      enum     "pending" | "paid" | "failed" | "refunded" | "voided"  │
 * │ type        enum     "invoice" | "payment" | "refund" | "credit"            │
 * │ description string?  Line item description                                  │
 * │ dueDate     string?  ISO date string                                        │
 * │ paidAt      string?  ISO date string                                        │
 * │ updated     string   Last update date                                       │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Shared / Reusable Schemas
// ─────────────────────────────────────────────────────────────────────────────

const isoDateString = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: "Invalid ISO date string" }
);

const idString = z.string().min(1, "ID is required");

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const projectStatusEnum = z.enum([
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
]);

export const projectSchema = z.object({
  id: idString,
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional().nullable(),
  status: projectStatusEnum.default("draft"),
  companyId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  createdAt: isoDateString.optional(),
  updatedAt: isoDateString.optional(),
}).passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const pageStatusEnum = z.enum([
  "draft",
  "published",
  "scheduled",
  "archived",
]);

export const seoMetaSchema = z.object({
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().url().optional().nullable(),
  ogTitle: z.string().optional().nullable(),
  ogDescription: z.string().optional().nullable(),
  canonical: z.string().url().optional().nullable(),
  noIndex: z.boolean().optional(),
  noFollow: z.boolean().optional(),
}).passthrough();

export const pageSchema = z.object({
  id: idString,
  title: z.string().min(1, "Page title is required"),
  slug: z.string().min(1, "Slug is required").regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be URL-friendly (lowercase, hyphens only)"
  ),
  projectId: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  status: pageStatusEnum.default("draft"),
  template: z.string().optional().nullable(),
  seoMeta: seoMetaSchema.optional().nullable(),
  createdAt: isoDateString.optional(),
  updatedAt: isoDateString.optional(),
}).passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const mediaTypeEnum = z.enum([
  "image",
  "video",
  "audio",
  "document",
  "other",
]);

export const mediaDimensionsSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
}).optional();

export const mediaSchema = z.object({
  id: idString,
  url: z.string().url("Invalid media URL"),
  filename: z.string().optional().nullable(),
  alt: z.string().optional().nullable(),
  type: mediaTypeEnum.default("other"),
  mimeType: z.string().optional().nullable(),
  size: z.number().int().nonnegative().optional().nullable(),
  dimensions: mediaDimensionsSchema.nullable().optional(),
  uploadedAt: isoDateString,
  uploadedBy: z.string().optional().nullable(),
}).passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// LEAD SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const leadSourceEnum = z.enum([
  "website",
  "referral",
  "ads",
  "social",
  "manual",
  "api",
  "import",
  "other",
]);

export const leadStatusEnum = z.enum([
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
  "unsubscribed",
]);

export const leadSchema = z.object({
  id: idString,
  email: z.string().email("Invalid email format"),
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  source: leadSourceEnum.default("website"),
  status: leadStatusEnum.default("new"),
  companyId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  createdAt: isoDateString,
  updatedAt: isoDateString.optional().nullable(),
}).passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const companyStatusEnum = z.enum([
  "Active",
  "Suspended",
  "Trial",
  "Churned",
]);

export const suspensionSchema = z.object({
  reason: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  suspendedAt: z.string().nullable().optional(),
}).passthrough();

export const usageLimitsSchema = z.object({
  maxWebsites: z.number().int().nonnegative().optional(),
  maxSeats: z.number().int().nonnegative().optional(),
  monthlyPageViews: z.number().int().nonnegative().optional(),
  storageGb: z.number().nonnegative().optional(),
}).passthrough();

export const internalNoteSchema = z.object({
  id: idString,
  text: z.string().min(1),
  author: z.string().optional(),
  createdAt: z.string().optional(),
}).passthrough();

export const companySchema = z.object({
  id: idString,
  name: z.string().min(1, "Company name is required"),
  email: z.string().email().optional().nullable(),
  status: companyStatusEnum.default("Active"),
  plan: z.string().optional().nullable(),
  websites: z.number().int().nonnegative().default(0),
  mrr: z.number().nonnegative().default(0),
  updated: z.string().optional(),
  suspension: suspensionSchema.optional().nullable(),
  usageLimits: usageLimitsSchema.optional().nullable(),
  internalNotes: z.array(internalNoteSchema).optional().default([]),
  websitesList: z.array(z.unknown()).optional().default([]),
  subscriptions: z.array(z.unknown()).optional().default([]),
  invoices: z.array(z.unknown()).optional().default([]),
  auditEvents: z.array(z.unknown()).optional().default([]),
}).passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const templateTypeEnum = z.enum([
  "page",
  "email",
  "component",
]);

export const templateSchema = z.object({
  id: idString,
  name: z.string().min(1, "Template name is required"),
  type: templateTypeEnum.default("page"),
  content: z.string().optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  category: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  createdAt: isoDateString.optional(),
  updatedAt: isoDateString.optional(),
}).passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// TEAM MEMBER SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const teamMemberStatusEnum = z.enum([
  "active",
  "invited",
  "inactive",
]);

export const teamMemberSchema = z.object({
  id: idString,
  name: z.string().min(1, "Team member name is required"),
  email: z.string().email("Invalid email format"),
  role: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  status: teamMemberStatusEnum.default("active"),
  permissions: z.record(z.boolean()).optional().nullable(),
  updated: z.string().optional(),
}).passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// BILLING RECORD SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const billingStatusEnum = z.enum([
  "pending",
  "paid",
  "failed",
  "refunded",
  "voided",
]);

export const billingTypeEnum = z.enum([
  "invoice",
  "payment",
  "refund",
  "credit",
]);

export const billingRecordSchema = z.object({
  id: idString,
  companyId: z.string().optional().nullable(),
  amount: z.number().int().nonnegative().default(0),
  currency: z.string().length(3).default("USD"),
  status: billingStatusEnum.default("pending"),
  type: billingTypeEnum.default("invoice"),
  description: z.string().optional().nullable(),
  dueDate: isoDateString.optional().nullable(),
  paidAt: isoDateString.optional().nullable(),
  updated: z.string().optional(),
}).passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// SEO ENTRY SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const seoEntrySchema = z.object({
  id: idString,
  pageId: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  score: z.number().min(0).max(100).optional(),
  issues: z.array(z.string()).optional().default([]),
  lastChecked: isoDateString.optional(),
}).passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY / AUDIT EVENT SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const activitySchema = z.object({
  id: idString,
  type: z.string().min(1),
  message: z.string().optional(),
  userId: z.string().optional().nullable(),
  entityType: z.string().optional().nullable(),
  entityId: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: isoDateString,
}).passthrough();

export const auditEventSchema = z.object({
  id: idString,
  action: z.string().min(1),
  userId: z.string().optional().nullable(),
  targetType: z.string().optional().nullable(),
  targetId: z.string().optional().nullable(),
  changes: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  createdAt: isoDateString,
}).passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const notificationSchema = z.object({
  id: idString,
  type: z.string().min(1),
  title: z.string().optional(),
  message: z.string().optional(),
  read: z.boolean().default(false),
  actionUrl: z.string().url().optional().nullable(),
  createdAt: isoDateString,
}).passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK LOG SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const webhookLogSchema = z.object({
  id: idString,
  url: z.string().url(),
  method: z.string().default("POST"),
  status: z.number().int().optional(),
  requestBody: z.unknown().optional(),
  responseBody: z.unknown().optional(),
  duration: z.number().nonnegative().optional(),
  success: z.boolean().default(false),
  createdAt: isoDateString,
}).passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM SETTINGS SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const platformSettingsSchema = z.object({
  siteName: z.string().optional(),
  siteUrl: z.string().url().optional(),
  supportEmail: z.string().email().optional(),
  timezone: z.string().optional(),
  currency: z.string().length(3).optional(),
  features: z.record(z.boolean()).optional(),
  integrations: z.record(z.unknown()).optional(),
}).passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// FULL SNAPSHOT SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full admin portal snapshot schema.
 * Validates the entire JSON blob structure stored in PortalSnapshot.
 *
 * Use `fullSnapshotSchema.parse(data)` for strict validation (throws on error)
 * Use `fullSnapshotSchema.safeParse(data)` for safe validation (returns result object)
 */
export const fullSnapshotSchema = z.object({
  companies: z.array(companySchema).optional().default([]),
  projects: z.array(projectSchema).optional().default([]),
  pages: z.array(pageSchema).optional().default([]),
  media: z.array(mediaSchema).optional().default([]),
  leads: z.array(leadSchema).optional().default([]),
  templates: z.array(templateSchema).optional().default([]),
  teamMembers: z.array(teamMemberSchema).optional().default([]),
  billingRecords: z.array(billingRecordSchema).optional().default([]),
  seoEntries: z.array(seoEntrySchema).optional().default([]),
  activity: z.array(activitySchema).optional().default([]),
  auditEvents: z.array(auditEventSchema).optional().default([]),
  notifications: z.array(notificationSchema).optional().default([]),
  webhookLogs: z.array(webhookLogSchema).optional().default([]),
  internalNotes: z.array(internalNoteSchema).optional().default([]),
  platformSettings: platformSettingsSchema.optional().nullable(),
}).passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// LOOSE ARRAY-ONLY SCHEMA (for backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────

const ARRAY_KEYS = [
  "companies",
  "projects",
  "pages",
  "media",
  "leads",
  "templates",
  "teamMembers",
  "billingRecords",
  "seoEntries",
  "activity",
  "auditEvents",
  "notifications",
  "webhookLogs",
  "internalNotes",
];

/**
 * Lightweight schema that only checks array fields are arrays.
 * Use for quick structural validation without deep entity checks.
 */
export const looseSnapshotSchema = z.object(
  Object.fromEntries(
    ARRAY_KEYS.map((key) => [key, z.array(z.unknown()).optional()])
  )
).extend({
  platformSettings: z.record(z.unknown()).optional().nullable(),
}).passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a single entity against its schema.
 * @template T
 * @param {z.ZodSchema<T>} schema
 * @param {unknown} data
 * @returns {{ ok: true, data: T } | { ok: false, error: string, issues: z.ZodIssue[] }}
 */
export function validateEntity(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const firstIssue = result.error.issues[0];
  const path = firstIssue?.path?.join(".") || "";
  const message = firstIssue?.message || "Validation failed";
  return {
    ok: false,
    error: path ? `${path}: ${message}` : message,
    issues: result.error.issues,
  };
}

/**
 * Validate the full snapshot structure.
 * @param {unknown} data - The snapshot data to validate
 * @param {{ deep?: boolean }} options - If deep=true, validates individual entities
 * @returns {{ ok: true, data: z.infer<typeof fullSnapshotSchema> } | { ok: false, error: string, issues?: z.ZodIssue[] }}
 */
export function validateSnapshot(data, options = {}) {
  const { deep = false } = options;

  const schema = deep ? fullSnapshotSchema : looseSnapshotSchema;
  const result = schema.safeParse(data);

  if (result.success) {
    return { ok: true, data: result.data };
  }

  const firstIssue = result.error.issues[0];
  const path = firstIssue?.path?.join(".") || "";
  const message = firstIssue?.message || "Validation failed";

  return {
    ok: false,
    error: path ? `${path}: ${message}` : message,
    issues: result.error.issues,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPE EXPORTS (for TypeScript consumers via JSDoc)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {z.infer<typeof projectSchema>} Project
 * @typedef {z.infer<typeof pageSchema>} Page
 * @typedef {z.infer<typeof mediaSchema>} Media
 * @typedef {z.infer<typeof leadSchema>} Lead
 * @typedef {z.infer<typeof companySchema>} Company
 * @typedef {z.infer<typeof templateSchema>} Template
 * @typedef {z.infer<typeof teamMemberSchema>} TeamMember
 * @typedef {z.infer<typeof billingRecordSchema>} BillingRecord
 * @typedef {z.infer<typeof seoEntrySchema>} SeoEntry
 * @typedef {z.infer<typeof activitySchema>} Activity
 * @typedef {z.infer<typeof auditEventSchema>} AuditEvent
 * @typedef {z.infer<typeof notificationSchema>} Notification
 * @typedef {z.infer<typeof webhookLogSchema>} WebhookLog
 * @typedef {z.infer<typeof platformSettingsSchema>} PlatformSettings
 * @typedef {z.infer<typeof fullSnapshotSchema>} FullSnapshot
 */

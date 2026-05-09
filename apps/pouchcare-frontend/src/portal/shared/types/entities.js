/**
 * Unified entity shapes for the PouchCare platform.
 *
 * Every entity extends a common base with id, createdAt, and updatedAt.
 * These JSDoc typedefs serve as the single source of truth for data shapes
 * shared between admin and customer portals.
 */

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

/**
 * Common fields present on every entity.
 *
 * @typedef {Object} BaseEntity
 * @property {string} id        - Unique identifier
 * @property {string} createdAt - ISO-8601 creation timestamp
 * @property {string} updatedAt - ISO-8601 last-update timestamp
 */

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

/**
 * A company / organization managed on the platform.
 *
 * @typedef {BaseEntity & Object} Company
 * @property {string} name       - Legal company name
 * @property {string} slug       - URL-safe identifier
 * @property {string} plan       - Active subscription plan
 * @property {string} status     - e.g. "Active", "Suspended"
 * @property {string} owner      - User ID of the primary owner
 * @property {number} siteCount  - Number of websites under this company
 */

// ---------------------------------------------------------------------------
// Website
// ---------------------------------------------------------------------------

/**
 * A WordPress website managed by PouchCare.
 *
 * @typedef {BaseEntity & Object} Website
 * @property {string} name       - Display name
 * @property {string} url        - Live URL
 * @property {string} companyId  - Owning company ID
 * @property {string} status     - e.g. "Active", "Staging", "Paused"
 * @property {string} plan       - Hosting / care plan
 * @property {string} environment - "production" | "staging"
 */

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

/**
 * A recurring subscription tied to a company.
 *
 * @typedef {BaseEntity & Object} Subscription
 * @property {string} companyId  - Company ID
 * @property {string} plan       - Plan name
 * @property {string} status     - e.g. "Active", "Trial", "Past Due"
 * @property {string} interval   - "monthly" | "yearly"
 * @property {number} amount     - Charge amount in cents
 * @property {string} nextBill   - ISO-8601 date of next billing cycle
 */

// ---------------------------------------------------------------------------
// Invoice
// ---------------------------------------------------------------------------

/**
 * A billing invoice for a company.
 *
 * @typedef {BaseEntity & Object} Invoice
 * @property {string} companyId  - Company ID
 * @property {string} number     - Human-readable invoice number
 * @property {number} amount     - Total amount in cents
 * @property {string} status     - e.g. "Paid", "Pending", "Overdue"
 * @property {string} dueDate    - ISO-8601 due date
 * @property {string} paidAt     - ISO-8601 payment timestamp or null
 */

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

/**
 * A WordPress plugin managed through PouchCare.
 *
 * @typedef {BaseEntity & Object} Plugin
 * @property {string} name       - Plugin display name
 * @property {string} slug       - Plugin slug
 * @property {string} version    - Installed version string
 * @property {string} status     - e.g. "Installed", "Disabled", "Published"
 * @property {string} websiteId  - Associated website ID
 * @property {boolean} autoUpdate - Whether auto-updates are enabled
 */

// ---------------------------------------------------------------------------
// TeamMember
// ---------------------------------------------------------------------------

/**
 * A team member within a company.
 *
 * @typedef {BaseEntity & Object} TeamMember
 * @property {string} name       - Display name
 * @property {string} email      - Email address
 * @property {string} role       - Role within the company (see UserRoles)
 * @property {string} status     - e.g. "Active", "Invited"
 * @property {string} companyId  - Company ID
 * @property {string} avatar     - Avatar URL or null
 */

// ---------------------------------------------------------------------------
// Ticket
// ---------------------------------------------------------------------------

/**
 * A support ticket.
 *
 * @typedef {BaseEntity & Object} Ticket
 * @property {string} subject    - Ticket subject line
 * @property {string} body       - Ticket description / body text
 * @property {string} status     - e.g. "Open", "Pending", "Resolved"
 * @property {string} priority   - "low" | "medium" | "high" | "urgent"
 * @property {string} companyId  - Company ID of the requester
 * @property {string} assignedTo - User ID of the assigned agent or null
 */

// ---------------------------------------------------------------------------
// ApiKey
// ---------------------------------------------------------------------------

/**
 * An API key for programmatic access.
 *
 * @typedef {BaseEntity & Object} ApiKey
 * @property {string} label      - Human-readable label
 * @property {string} keyPrefix  - Visible prefix of the key (e.g. "pk_live_...")
 * @property {string} status     - e.g. "Active", "Disabled"
 * @property {string} companyId  - Owning company ID
 * @property {string[]} scopes   - Permission scopes granted to this key
 * @property {string} lastUsedAt - ISO-8601 timestamp of last use or null
 */

// ---------------------------------------------------------------------------
// PaymentMethod
// ---------------------------------------------------------------------------

/**
 * A saved payment method for billing.
 *
 * @typedef {BaseEntity & Object} PaymentMethod
 * @property {string} type       - "card" | "bank" | "paypal"
 * @property {string} label      - Display label (e.g. "Visa ending 4242")
 * @property {string} companyId  - Owning company ID
 * @property {boolean} isDefault - Whether this is the default payment method
 * @property {string} expiresAt  - Expiration date string or null
 */

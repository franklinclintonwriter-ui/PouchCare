/**
 * Generate a unique identifier with an optional prefix.
 *
 * Format: `{prefix}_{timestamp}_{random}`
 *
 * Not cryptographically secure -- suitable for client-side entity IDs
 * and seed data. Replace with a server-issued ID for production records.
 *
 * @param {string} [prefix="id"] - Short string prepended to the ID
 * @returns {string} A prefixed, timestamp-based unique identifier
 */
export function createId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Return a human-readable label for the current moment.
 *
 * Used as the default timestamp label for activity and audit entries
 * created on the client side before they are persisted.
 *
 * @returns {string} The string "Now"
 */
export function nowLabel() {
  return "Now";
}

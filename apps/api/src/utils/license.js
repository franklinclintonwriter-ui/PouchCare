import crypto from "node:crypto";

/**
 * Generate a license key in format PC-XXXX-XXXX-XXXX-XXXX
 * @returns {string}
 */
export function generateLicenseKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1 to avoid confusion
  const segment = () => {
    let s = "";
    for (let i = 0; i < 4; i++) {
      s += chars[crypto.randomInt(chars.length)];
    }
    return s;
  };
  return `PC-${segment()}-${segment()}-${segment()}-${segment()}`;
}

/** Plan to max-sites mapping */
export const PLAN_LIMITS = {
  Starter: 1,
  Growth: 5,
  Agency: 50,
};

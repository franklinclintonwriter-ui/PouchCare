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

/**
 * Plan to max-sites mapping when billing is enforced.
 * Set POUCHCARE_BILLING_ENABLED=1 in the API env to turn limits on; otherwise all
 * plans get a very high cap so activations are effectively free for now.
 */
const billingEnabled = process.env.POUCHCARE_BILLING_ENABLED === "1";

export const PLAN_LIMITS = billingEnabled
  ? { Starter: 1, Growth: 5, Agency: 50 }
  : { Starter: 999999, Growth: 999999, Agency: 999999 };

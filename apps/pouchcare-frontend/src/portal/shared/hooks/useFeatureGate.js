import { useMemo } from "react";
import { useLicense } from "../state/LicenseContext.jsx";

/**
 * Maps each feature to the minimum plan tier required.
 * @type {Record<string, string>}
 */
const FEATURE_PLANS = {
  CUSTOM_TEMPLATES: "starter",
  SEO_MANAGER: "growth",
  ANALYTICS: "growth",
  MARKETPLACE: "starter",
  TEAM_MANAGEMENT: "growth",
  API_ACCESS: "starter",
  WHITE_LABEL: "enterprise",
  PRIORITY_SUPPORT: "enterprise",
  MULTI_COMPANY: "growth",
  CUSTOM_BLOCKS: "enterprise",
};

/** Plan hierarchy — higher index = higher tier. */
const PLAN_HIERARCHY = ["community", "starter", "growth", "enterprise"];

/**
 * Get the numeric rank of a plan for comparison.
 * @param {string} plan
 * @returns {number}
 */
function planRank(plan) {
  const idx = PLAN_HIERARCHY.indexOf(plan);
  return idx >= 0 ? idx : 0;
}

/**
 * Feature-gating hook.
 *
 * Returns whether the current license plan allows access to a given feature,
 * along with the current plan and the minimum plan required.
 *
 * @param {string} feature - A FEATURE_PLANS key (e.g. "CUSTOM_TEMPLATES")
 * @returns {{ allowed: boolean, currentPlan: string, requiredPlan: string }}
 */
export function useFeatureGate(feature) {
  const { plan } = useLicense();

  return useMemo(() => {
    const requiredPlan = FEATURE_PLANS[feature] ?? "community";
    const allowed = planRank(plan) >= planRank(requiredPlan);
    return { allowed, currentPlan: plan, requiredPlan };
  }, [plan, feature]);
}

export { FEATURE_PLANS, PLAN_HIERARCHY };

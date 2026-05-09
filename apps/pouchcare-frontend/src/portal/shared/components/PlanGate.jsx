import { useFeatureGate } from "../hooks/useFeatureGate.js";

/**
 * Wrapper component that gates children behind a plan requirement.
 *
 * If the current plan allows the feature, children are rendered.
 * Otherwise an upgrade prompt is shown (or a custom fallback).
 *
 * @param {Object} props
 * @param {string} props.feature - FEATURE_PLANS key (e.g. "CUSTOM_TEMPLATES")
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.fallback] - Optional custom fallback when gated
 * @param {() => void} [props.onUpgrade] - Optional callback when Upgrade is clicked
 */
export default function PlanGate({ feature, children, fallback, onUpgrade }) {
  const { allowed, requiredPlan } = useFeatureGate(feature);

  if (allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  const planLabel = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);
  const featureLabel = feature
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
      {/* Lock icon */}
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
        <svg
          className="h-6 w-6 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
      </div>

      <h3 className="text-sm font-semibold text-amber-900">{featureLabel}</h3>
      <p className="mt-1 text-xs text-amber-700">
        This feature requires the <span className="font-semibold">{planLabel}</span> plan or higher.
      </p>

      <button
        type="button"
        onClick={onUpgrade}
        className="mt-4 inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
      >
        Upgrade to {planLabel}
      </button>
    </div>
  );
}

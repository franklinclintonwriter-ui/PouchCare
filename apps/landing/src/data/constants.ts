/**
 * Shared constants for portal UI (profile, settings, etc.)
 * Separated from API concerns.
 */

export const INDUSTRIES = [
  "Agency / Marketing",
  "E-commerce",
  "SaaS / Software",
  "Media / Publishing",
  "Healthcare",
  "Education",
  "Finance",
  "Real Estate",
  "Hospitality",
  "Non-profit",
  "Freelancer",
  "Other",
] as const;

export const COUNTRIES: { code: string; name: string }[] = [
  { code: "BD", name: "Bangladesh" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "PK", name: "Pakistan" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SG", name: "Singapore" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "MY", name: "Malaysia" },
  { code: "NG", name: "Nigeria" },
  { code: "ZA", name: "South Africa" },
  { code: "OTHER", name: "Other" },
];

export const APK_STATUS_LABEL = {
  queued: "Queued",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
  expired: "Expired",
} as const;

export const APK_STATUS_VARIANT = {
  ready: "success",
  processing: "info",
  queued: "warning",
  failed: "error",
  expired: "neutral",
} as const;

export const SITE_STATUS_LABEL = {
  online: "Online",
  degraded: "Degraded",
  offline: "Offline",
  maintenance: "Maintenance",
} as const;

export const SITE_STATUS_VARIANT = {
  online: "success",
  degraded: "warning",
  offline: "error",
  maintenance: "info",
} as const;

export function seoScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export function seoScoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-50 border-emerald-200";
  if (score >= 50) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

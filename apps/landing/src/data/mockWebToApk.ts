/**
 * Mock data for Web-to-APK conversion service.
 * Replace with API calls when backend is ready.
 * @see docs/TASKS_WEB_TO_APK.md
 */

export interface ApkPlan {
  id: string;
  name: string;
  monthlyUsd: number;
  blurb: string;
  features: string[];
  maxConversions: number | null;
  popular?: boolean;
}

export const WEB_TO_APK_PLANS: ApkPlan[] = [
  {
    id: "free",
    name: "Free",
    monthlyUsd: 0,
    blurb: "Try the service — one conversion per month, PouchCare branding included.",
    features: [
      "1 APK per month",
      "PouchCare splash screen",
      "Basic webview wrapper",
      "Email download link",
    ],
    maxConversions: 1,
  },
  {
    id: "starter",
    name: "Starter",
    monthlyUsd: 9,
    blurb: "For growing businesses — remove branding and add custom icons.",
    features: [
      "10 APKs per month",
      "Remove branding",
      "Custom app icon & name",
      "Offline cache support",
      "Email + dashboard download",
    ],
    maxConversions: 10,
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyUsd: 29,
    blurb: "Unlimited conversions with Play Store-ready signing and push notifications.",
    features: [
      "Unlimited APKs",
      "Play Store–ready signing",
      "Push notification support",
      "Custom splash screen",
      "Priority processing",
      "Dedicated support",
    ],
    maxConversions: null,
  },
];

export const WEB_TO_APK_FEATURES = [
  {
    icon: "⚡",
    title: "Instant conversion",
    description:
      "Paste your URL and get a downloadable APK in under 60 seconds — no code needed.",
  },
  {
    icon: "🎨",
    title: "Custom branding",
    description:
      "Set your own app icon, name, splash screen, and theme colour to match your brand.",
  },
  {
    icon: "📶",
    title: "Offline support",
    description:
      "Pages you've visited are cached locally so users stay productive without a connection.",
  },
  {
    icon: "🔔",
    title: "Push notifications",
    description:
      "Engage your users with native Android push notifications (Starter plan and above).",
  },
  {
    icon: "🏪",
    title: "Play Store ready",
    description:
      "Pro tier produces a signed, aligned APK/AAB that you can submit directly to Google Play.",
  },
  {
    icon: "🔒",
    title: "Secure & private",
    description:
      "Your URL and generated APKs are processed in an isolated environment and never shared.",
  },
] as const;

export const WEB_TO_APK_FAQ = [
  {
    q: "What kind of websites work best?",
    a: "Progressive Web Apps (PWAs) and responsive websites work best. Complex SPAs with heavy animations may need minor adjustments.",
  },
  {
    q: "Do I need a Google Play developer account?",
    a: "Not for sideloading. For Play Store submission (Pro plan) you need a $25 one-time developer account.",
  },
  {
    q: "How long does conversion take?",
    a: "Most conversions complete in under 60 seconds. Pro-tier signed builds may take up to 3 minutes.",
  },
  {
    q: "Can I update the app after generating?",
    a: "Yes — since the app wraps your live URL, any website updates are immediately reflected. For icon/branding changes, re-generate the APK.",
  },
  {
    q: "What Android versions are supported?",
    a: "Generated APKs target Android 7.0 (API 24) and above, covering over 98% of active devices.",
  },
  {
    q: "Is my website data safe?",
    a: "We only access your public URL to verify it loads correctly. No credentials or private data are transmitted.",
  },
] as const;

export type ApkJobStatus = "queued" | "processing" | "ready" | "failed" | "expired";

export interface MockApkOrder {
  id: string;
  appName: string;
  url: string;
  plan: string;
  status: ApkJobStatus;
  createdAt: string;
  completedAt: string | null;
  apkSizeMb: number | null;
  downloadUrl: string | null;
}

export const MOCK_APK_ORDERS: MockApkOrder[] = [
  {
    id: "apk-001",
    appName: "My Shop App",
    url: "https://myshop.example.com",
    plan: "Starter",
    status: "ready",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 55000).toISOString(),
    apkSizeMb: 4.2,
    downloadUrl: "#mock-download",
  },
  {
    id: "apk-002",
    appName: "Client Portal",
    url: "https://portal.clientbrand.io",
    plan: "Pro",
    status: "ready",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 72000).toISOString(),
    apkSizeMb: 6.8,
    downloadUrl: "#mock-download",
  },
  {
    id: "apk-003",
    appName: "Campaign Landing",
    url: "https://campaign-landing.net",
    plan: "Free",
    status: "expired",
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000 + 48000).toISOString(),
    apkSizeMb: 3.1,
    downloadUrl: null,
  },
];

export const APK_STATUS_LABEL: Record<ApkJobStatus, string> = {
  queued: "Queued",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
  expired: "Expired",
};

export const APK_STATUS_VARIANT: Record<
  ApkJobStatus,
  "success" | "warning" | "error" | "neutral" | "info"
> = {
  ready: "success",
  processing: "info",
  queued: "warning",
  failed: "error",
  expired: "neutral",
};

export type ApkPlan = {
  id: string;
  name: string;
  blurb: string;
  monthlyUsd: number;
  maxConversions: number | null;
  features: string[];
  popular?: boolean;
};

export const WEB_TO_APK_PLANS: ApkPlan[] = [
  {
    id: "starter",
    name: "Starter",
    blurb: "Perfect for testing or small projects",
    monthlyUsd: 0,
    maxConversions: 1,
    features: [
      "1 APK conversion/month",
      "Basic customization",
      "Email support",
      "7-day expiry",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    blurb: "For growing projects and small businesses",
    monthlyUsd: 29,
    maxConversions: 20,
    features: [
      "20 APK conversions/month",
      "Full customization",
      "Priority email support",
      "30-day expiry",
      "Custom icon & splash screen",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    blurb: "Unlimited capacity for large teams",
    monthlyUsd: 99,
    maxConversions: null,
    features: [
      "Unlimited APK conversions",
      "Full customization",
      "24/7 phone & email support",
      "90-day expiry",
      "Custom icon, splash & themes",
      "API access",
    ],
  },
];

export const WEB_TO_APK_FEATURES = [
  {
    icon: "⚡",
    title: "Blazing Fast",
    description: "Converts your website to APK in seconds, not hours",
  },
  {
    icon: "🎨",
    title: "Full Customization",
    description: "Custom icons, splash screens, colors, and branding",
  },
  {
    icon: "📱",
    title: "Native Experience",
    description: "Feels like a true Android app with offline support",
  },
  {
    icon: "🔒",
    title: "Secure",
    description: "Your code stays yours. We never store your APKs",
  },
  {
    icon: "🌐",
    title: "Universal Compatibility",
    description: "Works with any responsive website or web app",
  },
  {
    icon: "🚀",
    title: "Auto-Updates",
    description: "APK automatically pulls latest content from your site",
  },
];

export const WEB_TO_APK_FAQ = [
  {
    q: "What format should my website URL be in?",
    a: "Just enter the full URL like https://example.com. We support any responsive website or web app.",
  },
  {
    q: "Can I update the APK after creation?",
    a: "Yes! The APK will automatically fetch the latest version of your website whenever the user opens it.",
  },
  {
    q: "Do you store my APK files?",
    a: "No, we never store your APK files. They're generated on-demand and sent directly to you.",
  },
  {
    q: "Can I customize the app appearance?",
    a: "Yes. With Professional and Enterprise plans, you can customize the app icon, splash screen, and colors.",
  },
  {
    q: "What about offline support?",
    a: "We include basic offline support. Users can access previously loaded pages when offline.",
  },
  {
    q: "Can I publish to Google Play Store?",
    a: "Yes, your generated APK can be submitted to the Google Play Store with your own developer account.",
  },
];

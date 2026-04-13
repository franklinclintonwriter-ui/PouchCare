/**
 * Mock "My Websites" data — health, analytics, uptime, tech stack.
 * Replace with real monitoring API when backend supports it.
 */

export type WebsiteStatus = "online" | "degraded" | "offline" | "maintenance";

export interface WebsiteAnalytics {
  visitorsMonth: number;
  pageviewsMonth: number;
  bounceRate: number;
  avgSessionSec: number;
}

export interface MockWebsite {
  id: string;
  name: string;
  url: string;
  fqdn: string;
  status: WebsiteStatus;
  seoScore: number;
  uptimePct: number;
  sslValid: boolean;
  sslExpiresAt: string;
  techStack: string[];
  analytics: WebsiteAnalytics;
  lastChecked: string;
  hostingPlan: string | null;
  linkedDomainId: string | null;
}

export const MOCK_WEBSITES: MockWebsite[] = [
  {
    id: "site-pouchcare",
    name: "PouchCare Main",
    url: "https://pouchcare.com",
    fqdn: "pouchcare.com",
    status: "online",
    seoScore: 92,
    uptimePct: 99.98,
    sslValid: true,
    sslExpiresAt: "2026-05-01T00:00:00.000Z",
    techStack: ["React", "Vite", "Tailwind CSS", "Node.js", "PostgreSQL"],
    analytics: {
      visitorsMonth: 12400,
      pageviewsMonth: 38600,
      bounceRate: 34,
      avgSessionSec: 142,
    },
    lastChecked: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    hostingPlan: "Business Pro",
    linkedDomainId: "pouchcare-com",
  },
  {
    id: "site-clientbrand",
    name: "Client Brand",
    url: "https://clientbrand.io",
    fqdn: "clientbrand.io",
    status: "online",
    seoScore: 78,
    uptimePct: 99.95,
    sslValid: true,
    sslExpiresAt: "2026-04-18T00:00:00.000Z",
    techStack: ["Next.js", "Vercel", "Tailwind CSS"],
    analytics: {
      visitorsMonth: 3200,
      pageviewsMonth: 8100,
      bounceRate: 42,
      avgSessionSec: 98,
    },
    lastChecked: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    hostingPlan: "Starter",
    linkedDomainId: "client-brand-io",
  },
  {
    id: "site-campaign",
    name: "Campaign Landing",
    url: "https://campaign-landing.net",
    fqdn: "campaign-landing.net",
    status: "maintenance",
    seoScore: 45,
    uptimePct: 100,
    sslValid: false,
    sslExpiresAt: "2026-01-12T00:00:00.000Z",
    techStack: ["HTML", "CSS", "Cloudflare Pages"],
    analytics: {
      visitorsMonth: 120,
      pageviewsMonth: 280,
      bounceRate: 68,
      avgSessionSec: 34,
    },
    lastChecked: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    hostingPlan: "Landing",
    linkedDomainId: "campaign-landing-net",
  },
  {
    id: "site-legacy",
    name: "Legacy App",
    url: "https://legacy-app.org",
    fqdn: "legacy-app.org",
    status: "offline",
    seoScore: 12,
    uptimePct: 0,
    sslValid: false,
    sslExpiresAt: "2025-07-15T00:00:00.000Z",
    techStack: ["PHP", "MySQL", "Apache"],
    analytics: {
      visitorsMonth: 0,
      pageviewsMonth: 0,
      bounceRate: 0,
      avgSessionSec: 0,
    },
    lastChecked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    hostingPlan: "Legacy VPS",
    linkedDomainId: "legacy-app-org",
  },
];

export function getMockWebsiteById(id: string): MockWebsite | undefined {
  return MOCK_WEBSITES.find((w) => w.id === id);
}

export const SITE_STATUS_VARIANT: Record<
  WebsiteStatus,
  "success" | "warning" | "error" | "info"
> = {
  online: "success",
  degraded: "warning",
  offline: "error",
  maintenance: "info",
};

export const SITE_STATUS_LABEL: Record<WebsiteStatus, string> = {
  online: "Online",
  degraded: "Degraded",
  offline: "Offline",
  maintenance: "Maintenance",
};

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

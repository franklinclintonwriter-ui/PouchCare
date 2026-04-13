/**
 * Mock domain & hosting catalog for the client portal (replace with API later).
 * `MOCK_HOSTING_PLANS` is the single source for plan cards in the portal
 * (`HostingRegisterPage`) and public marketing (`ServicesHostingPage`).
 *
 * AI / maintainers: responsive UI lives in HostingOverviewPage + HostingLayout;
 * see `pages/dashboard/HOSTING_PORTAL.md` and `docs/UI_MARKETING_SEO_SERVICES.md`.
 */

export type DomainStatus = "active" | "pending" | "expired" | "suspended";

export interface DnsRecord {
  id: string;
  type: string;
  name: string;
  value: string;
  ttl: number;
}

export interface HostingDomain {
  id: string;
  fqdn: string;
  status: DomainStatus;
  planName: string;
  registrar: string;
  registeredAt: string;
  expiresAt: string;
  sslIssuer: string;
  sslExpiresAt: string;
  autoRenew: boolean;
  nameservers: string[];
  dnsRecords: DnsRecord[];
  monthlyPriceUsd: number;
  bandwidthGb: { used: number; limit: number };
  storageGb: { used: number; limit: number };
  uptimePct: number;
  /** Client notes — persisted in mock store only */
  notes?: string;
}

export const MOCK_HOSTING_DOMAINS: HostingDomain[] = [
  {
    id: "pouchcare-com",
    fqdn: "pouchcare.com",
    status: "active",
    planName: "Business Pro",
    registrar: "PouchCare Registry",
    registeredAt: "2022-03-14T00:00:00.000Z",
    expiresAt: "2027-03-14T00:00:00.000Z",
    sslIssuer: "Let's Encrypt R3",
    sslExpiresAt: "2026-05-01T00:00:00.000Z",
    autoRenew: true,
    nameservers: ["ns1.pouchcare.net", "ns2.pouchcare.net"],
    dnsRecords: [
      { id: "pc-1", type: "A", name: "@", value: "185.199.108.153", ttl: 3600 },
      { id: "pc-2", type: "A", name: "www", value: "185.199.108.153", ttl: 3600 },
      { id: "pc-3", type: "MX", name: "@", value: "mail.pouchcare.com", ttl: 3600 },
      { id: "pc-4", type: "TXT", name: "@", value: "v=spf1 include:_spf.pouchcare.com ~all", ttl: 3600 },
      { id: "pc-5", type: "CNAME", name: "portal", value: "sites.pouchcare.net", ttl: 3600 },
    ],
    monthlyPriceUsd: 24.99,
    bandwidthGb: { used: 42, limit: 500 },
    storageGb: { used: 18.4, limit: 100 },
    uptimePct: 99.98,
  },
  {
    id: "client-brand-io",
    fqdn: "clientbrand.io",
    status: "active",
    planName: "Startup",
    registrar: "PouchCare Registry",
    registeredAt: "2024-11-02T00:00:00.000Z",
    expiresAt: "2026-11-02T00:00:00.000Z",
    sslIssuer: "Let's Encrypt R3",
    sslExpiresAt: "2026-04-18T00:00:00.000Z",
    autoRenew: true,
    nameservers: ["ns1.pouchcare.net", "ns2.pouchcare.net"],
    dnsRecords: [
      { id: "cb-1", type: "A", name: "@", value: "76.76.21.21", ttl: 300 },
      { id: "cb-2", type: "CNAME", name: "www", value: "cname.vercel-dns.com", ttl: 300 },
    ],
    monthlyPriceUsd: 12,
    bandwidthGb: { used: 8.2, limit: 100 },
    storageGb: { used: 4.1, limit: 25 },
    uptimePct: 99.95,
  },
  {
    id: "campaign-landing-net",
    fqdn: "campaign-landing.net",
    status: "pending",
    planName: "Landing",
    registrar: "PouchCare Registry",
    registeredAt: "2026-01-10T00:00:00.000Z",
    expiresAt: "2027-01-10T00:00:00.000Z",
    sslIssuer: "Provisioning…",
    sslExpiresAt: "2026-01-12T00:00:00.000Z",
    autoRenew: false,
    nameservers: ["ns1.pouchcare.net", "ns2.pouchcare.net"],
    dnsRecords: [{ id: "cl-1", type: "A", name: "@", value: "—", ttl: 3600 }],
    monthlyPriceUsd: 6.5,
    bandwidthGb: { used: 0, limit: 50 },
    storageGb: { used: 0.2, limit: 10 },
    uptimePct: 100,
  },
  {
    id: "legacy-app-org",
    fqdn: "legacy-app.org",
    status: "suspended",
    planName: "Legacy VPS",
    registrar: "External",
    registeredAt: "2019-06-01T00:00:00.000Z",
    expiresAt: "2025-08-01T00:00:00.000Z",
    sslIssuer: "DigiCert TLS RSA",
    sslExpiresAt: "2025-07-15T00:00:00.000Z",
    autoRenew: false,
    nameservers: ["ns.oldhost.io", "ns2.oldhost.io"],
    dnsRecords: [{ id: "lg-1", type: "A", name: "@", value: "192.0.2.10", ttl: 600 }],
    monthlyPriceUsd: 89,
    bandwidthGb: { used: 120, limit: 120 },
    storageGb: { used: 200, limit: 200 },
    uptimePct: 0,
  },
];

/** Seed snapshot only — portal UI resolves domains via `mockHostingStore` / `useMockHostingDomains`. */
export function getMockDomainById(id: string): HostingDomain | undefined {
  return MOCK_HOSTING_DOMAINS.find((d) => d.id === id);
}

export interface DomainSearchSuggestion {
  fqdn: string;
  available: boolean;
  pricePerYearUsd: number;
  tld: string;
}

/** Mock availability + pricing for the register/search page. */
export function mockDomainSearchSuggestions(
  rawQuery: string,
): DomainSearchSuggestion[] {
  const slug = rawQuery
    .trim()
    .toLowerCase()
    .replace(/\.[a-z]+$/i, "")
    .replace(/[^a-z0-9-]/g, "");
  const base = slug.length >= 2 ? slug : "yourbrand";
  return [
    {
      fqdn: `${base}.com`,
      available: true,
      pricePerYearUsd: 12.99,
      tld: ".com",
    },
    {
      fqdn: `${base}.io`,
      available: true,
      pricePerYearUsd: 34,
      tld: ".io",
    },
    {
      fqdn: `${base}.net`,
      available: false,
      pricePerYearUsd: 11.5,
      tld: ".net",
    },
    {
      fqdn: `${base}.dev`,
      available: true,
      pricePerYearUsd: 15,
      tld: ".dev",
    },
  ];
}

export const MOCK_HOSTING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    blurb: "Single site, email forwarding, free SSL.",
    monthlyUsd: 6.5,
    features: ["5 GB SSD", "Unmetered bandwidth", "Weekly backups"],
  },
  {
    id: "business",
    name: "Business Pro",
    blurb: "Production SLA, staging, priority DNS.",
    monthlyUsd: 24.99,
    features: ["100 GB SSD", "500 GB transfer", "Daily backups", "Staging"],
  },
  {
    id: "scale",
    name: "Scale",
    blurb: "High traffic, dedicated support channel.",
    monthlyUsd: 89,
    features: ["200 GB SSD", "Dedicated pool", "Hourly backups"],
  },
] as const;

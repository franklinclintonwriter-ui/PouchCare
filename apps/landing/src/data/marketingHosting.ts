/**
 * Public marketing catalog entries for domains & hosting (merged into `/services`).
 * Hosting plans are now inlined in HostingRegisterPage.tsx and ServicesHostingPage.tsx.
 *
 * @see docs/UI_MARKETING_SEO_SERVICES.md
 */
import type { ServiceItem } from "@/lib/constants";

export const MARKETING_HOSTING_SERVICES: ServiceItem[] = [
  {
    icon: "🌐",
    name: "Domain registration",
    price: "from $8/yr",
    category: "Hosting",
    description:
      "Search and register domains with transparent renewal pricing, DNS management, and transfer support.",
  },
  {
    icon: "🖥️",
    name: "Web hosting",
    price: "from $6.50/mo",
    category: "Hosting",
    description:
      "SSD storage, free SSL, backups, and staging — tuned for WordPress, static sites, and SPAs.",
  },
  {
    icon: "🔒",
    name: "SSL & DNS management",
    price: "from $0",
    category: "Hosting",
    description:
      "Automated SSL provisioning, DNS records, MX for email, and health monitoring in one place.",
  },
];

/** Dedupes by `name` so API-loaded rows are not duplicated. */
export function mergeWithMarketingHosting(
  services: ServiceItem[],
): ServiceItem[] {
  const seen = new Set(services.map((s) => s.name));
  const out = [...services];
  for (const h of MARKETING_HOSTING_SERVICES) {
    if (!seen.has(h.name)) {
      seen.add(h.name);
      out.push(h);
    }
  }
  return out;
}

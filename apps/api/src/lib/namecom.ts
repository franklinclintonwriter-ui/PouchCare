import { env } from "@/config/env";

const BASE = env.NAMECOM_API_URL.replace(/\/+$/, "");

function headers(): HeadersInit {
  const encoded = Buffer.from(
    `${env.NAMECOM_USERNAME}:${env.NAMECOM_TOKEN}`,
  ).toString("base64");
  return {
    Authorization: `Basic ${encoded}`,
    "Content-Type": "application/json",
  };
}

export interface NamecomSearchResult {
  domainName: string;
  sld: string;
  tld: string;
  purchasable: boolean;
  premium?: boolean;
  purchasePrice: number;
  purchaseType: string;
  renewalPrice: number;
}

/**
 * Search Name.com for domain availability by keyword.
 * POST /v4/domains:search
 */
export async function searchDomains(
  keyword: string,
  tldFilter?: string[],
): Promise<NamecomSearchResult[]> {
  const body: Record<string, unknown> = { keyword, timeout: 3000 };
  if (tldFilter?.length) body.tldFilter = tldFilter;

  const res = await fetch(`${BASE}/v4/domains:search`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Name.com search failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { results?: NamecomSearchResult[] };
  return json.results ?? [];
}

/**
 * Check availability + pricing for specific domain names (max 50).
 * POST /v4/domains:checkAvailability
 */
export async function checkAvailability(
  domainNames: string[],
): Promise<NamecomSearchResult[]> {
  const res = await fetch(`${BASE}/v4/domains:checkAvailability`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ domainNames }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Name.com checkAvailability failed (${res.status}): ${text}`,
    );
  }

  const json = (await res.json()) as { results?: NamecomSearchResult[] };
  return json.results ?? [];
}

/**
 * Get pricing for a single domain.
 * GET /v4/domains/{domainName}:getPricing
 */
export async function getDomainPricing(domainName: string) {
  const res = await fetch(
    `${BASE}/v4/domains/${encodeURIComponent(domainName)}:getPricing`,
    {
      method: "GET",
      headers: headers(),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Name.com getPricing failed (${res.status}): ${text}`);
  }

  return (await res.json()) as {
    purchasePrice: number;
    renewalPrice: number;
    transferPrice: number;
    premium?: boolean;
  };
}

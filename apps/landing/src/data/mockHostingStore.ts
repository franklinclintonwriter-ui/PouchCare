/**
 * In-memory mock domain portfolio with sessionStorage persistence (dev UX).
 * Replace with API when backend exists.
 *
 * @see docs/TASKS_MOCK_CRUD_MATRIX.md
 */
import type { DnsRecord, HostingDomain } from "@/data/mockHosting";
import { MOCK_HOSTING_DOMAINS } from "@/data/mockHosting";

const STORAGE_KEY = "pouchcare_mock_hosting_domains_v1";

let state: HostingDomain[] = loadInitial();
const listeners = new Set<() => void>();

function cloneSeed(): HostingDomain[] {
  return JSON.parse(JSON.stringify(MOCK_HOSTING_DOMAINS)) as HostingDomain[];
}

function migrateDomain(d: HostingDomain): HostingDomain {
  return {
    ...d,
    dnsRecords: d.dnsRecords.map((r, i) => ({
      ...r,
      id:
        r.id ??
        `mig-${d.id}-${i}-${r.type}-${r.name}`.replace(/\s/g, ""),
    })),
  };
}

function loadInitial(): HostingDomain[] {
  if (typeof sessionStorage === "undefined") {
    return cloneSeed();
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HostingDomain[];
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map(migrateDomain);
      }
    }
  } catch {
    /* fall through */
  }
  return cloneSeed();
}

function persist() {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    /* quota / private mode */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function getHostingDomainsSnapshot(): HostingDomain[] {
  return state;
}

export function subscribeHostingDomains(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setDomains(next: HostingDomain[]) {
  state = next;
  persist();
  emit();
}

export function resetMockHostingDomainsToSeed() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  setDomains(cloneSeed());
}

export function getHostingDomainById(id: string): HostingDomain | undefined {
  return state.find((d) => d.id === id);
}

function slugFromFqdn(fqdn: string): string {
  return fqdn
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/\./g, "-");
}

export function newDnsRecordId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `dns-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function addHostingDomainFromMockCheckout(params: {
  fqdn: string;
  planMonthlyUsd: number;
  planName: string;
}): HostingDomain {
  const id = slugFromFqdn(params.fqdn);
  if (state.some((d) => d.id === id || d.fqdn.toLowerCase() === params.fqdn.toLowerCase())) {
    throw new Error("Domain already in portfolio");
  }
  const now = new Date().toISOString();
  const exp = new Date();
  exp.setFullYear(exp.getFullYear() + 1);
  const row: HostingDomain = {
    id,
    fqdn: params.fqdn.trim().toLowerCase(),
    status: "pending",
    planName: params.planName,
    registrar: "PouchCare Registry",
    registeredAt: now,
    expiresAt: exp.toISOString(),
    sslIssuer: "Provisioning…",
    sslExpiresAt: exp.toISOString(),
    autoRenew: false,
    nameservers: ["ns1.pouchcare.net", "ns2.pouchcare.net"],
    dnsRecords: [
      {
        id: newDnsRecordId(),
        type: "A",
        name: "@",
        value: "—",
        ttl: 3600,
      },
    ],
    monthlyPriceUsd: params.planMonthlyUsd,
    bandwidthGb: { used: 0, limit: 50 },
    storageGb: { used: 0, limit: 10 },
    uptimePct: 100,
    notes: "",
  };
  setDomains([...state, row]);
  return row;
}

export function updateHostingDomain(
  id: string,
  patch: Partial<
    Pick<
      HostingDomain,
      | "autoRenew"
      | "notes"
      | "nameservers"
      | "dnsRecords"
    >
  >,
): HostingDomain | undefined {
  const idx = state.findIndex((d) => d.id === id);
  if (idx === -1) return undefined;
  const next = [...state];
  next[idx] = { ...next[idx], ...patch };
  setDomains(next);
  return next[idx];
}

export function deleteHostingDomain(id: string): boolean {
  if (!state.some((d) => d.id === id)) return false;
  setDomains(state.filter((d) => d.id !== id));
  return true;
}

export function addDnsRecord(
  domainId: string,
  record: Omit<DnsRecord, "id"> & { id?: string },
): HostingDomain | undefined {
  const d = getHostingDomainById(domainId);
  if (!d) return undefined;
  const row: DnsRecord = {
    ...record,
    id: record.id ?? newDnsRecordId(),
  };
  const dnsRecords = [...d.dnsRecords, row];
  return updateHostingDomain(domainId, { dnsRecords });
}

export function updateDnsRecord(
  domainId: string,
  recordId: string,
  patch: Partial<Pick<DnsRecord, "type" | "name" | "value" | "ttl">>,
): HostingDomain | undefined {
  const d = getHostingDomainById(domainId);
  if (!d) return undefined;
  const dnsRecords = d.dnsRecords.map((r) =>
    r.id === recordId ? { ...r, ...patch } : r,
  );
  return updateHostingDomain(domainId, { dnsRecords });
}

export function removeDnsRecord(
  domainId: string,
  recordId: string,
): HostingDomain | undefined {
  const d = getHostingDomainById(domainId);
  if (!d) return undefined;
  const dnsRecords = d.dnsRecords.filter((r) => r.id !== recordId);
  if (dnsRecords.length === d.dnsRecords.length) return d;
  return updateHostingDomain(domainId, { dnsRecords });
}

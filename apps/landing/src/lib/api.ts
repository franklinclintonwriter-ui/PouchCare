import { BACKLINK_PACKAGES, SERVICES, type BacklinkPackage, type ServiceItem } from './constants';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// ── Generic fetcher ───────────────────────────────────────────────────────

async function apiFetch<T>(path: string, fallback: T): Promise<T> {
  if (!API_BASE) return fallback;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return fallback;
    const json = await res.json() as { data?: T; success?: boolean };
    return (json.data ?? json) as T;
  } catch {
    return fallback;
  }
}

// ── Services ──────────────────────────────────────────────────────────────

export interface ApiService {
  id: string;
  name: string;
  category: string;
  description?: string;
  price?: number;
  isActive: boolean;
}

function mapApiService(s: ApiService): ServiceItem {
  return {
    icon: getCategoryIcon(s.category),
    name: s.name,
    category: s.category,
    description: s.description ?? '',
    price: s.price ? `$${s.price}` : 'Contact us',
  };
}

function getCategoryIcon(category: string): string {
  const map: Record<string, string> = {
    SEO: '🔍',
    'Link Building': '🔗',
    Dev: '💻',
    Development: '💻',
    Design: '🎨',
    Content: '📝',
    Ads: '📣',
    Marketing: '📣',
  };
  return map[category] ?? '⚙️';
}

export async function getServices(): Promise<ServiceItem[]> {
  const data = await apiFetch<ApiService[]>('/v1/services', []);
  if (!data.length) return SERVICES;
  return data.filter((s) => s.isActive).map(mapApiService);
}

// ── Backlink packages ─────────────────────────────────────────────────────

export interface ApiBacklinkPackage {
  id: string;
  name: string;
  da?: string;
  domainAuthority?: number;
  type: string;
  pricePerLink?: number;
  price?: number;
  isActive?: boolean;
}

function mapApiBacklink(p: ApiBacklinkPackage): BacklinkPackage {
  const pricePerLink = p.pricePerLink ?? p.price ?? 0;
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : n < 1 ? `$${n.toFixed(2)}` : `$${n}`;
  return {
    name: p.name,
    da: p.da ?? (p.domainAuthority ? `DA ${p.domainAuthority}+` : 'Mixed'),
    type: p.type,
    perLink: fmt(pricePerLink),
    x10: fmt(pricePerLink * 10 * 0.95),
    x50: fmt(pricePerLink * 50 * 0.88),
    x100: fmt(pricePerLink * 100 * 0.82),
    x1000: fmt(pricePerLink * 1000 * 0.72),
  };
}

export async function getBacklinkPackages(): Promise<BacklinkPackage[]> {
  const data = await apiFetch<ApiBacklinkPackage[]>('/v1/backlink-packages', []);
  if (!data.length) return BACKLINK_PACKAGES;
  return data.map(mapApiBacklink);
}

// ── Contact form ──────────────────────────────────────────────────────────

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
}

export async function submitContact(payload: ContactPayload): Promise<boolean> {
  if (!API_BASE) {
    window.location.href = `mailto:hello@pouchcare.com?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(payload.message)}`;
    return true;
  }
  try {
    const res = await fetch(`${API_BASE}/v1/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

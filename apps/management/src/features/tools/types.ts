/** Shared result shapes for SEO / web tools (mock phase — replace with API types later). */

export type ToolCategory = 'SEO' | 'Assets' | 'Productivity';

export type ToolBadge = 'mock' | 'beta' | 'soon' | 'live';

export interface BacklinkRow {
  id: string;
  referringDomain: string;
  dr: number;
  ur: number;
  backlinks: number;
  anchorText: string;
  targetUrl: string;
  firstSeen: string;
  lastSeen: string;
  /** Shown when row expanded */
  subdomains: { host: string; links: number; dr: number }[];
}

export interface DaPaSnapshot {
  domain: string;
  da: number;
  pa: number;
  spamScore: number;
  linkingDomains: number;
  totalBacklinks: number;
}

export interface DaPaHistoryPoint {
  month: string;
  da: number;
  pa: number;
}

export interface KeywordMetric {
  keyword: string;
  volume: number;
  kd: number;
  cpcUsd: number;
  intent: string;
  trendPct: number;
}

export interface SerpResultRow {
  id: string;
  position: number;
  url: string;
  title: string;
  /** Tags from the provider (e.g. snippet, rich_snippet). */
  features: string[];
}

export interface FaviconPreset {
  size: number;
  label: string;
}

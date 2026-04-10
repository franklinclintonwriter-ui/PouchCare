import {
  ImageIcon,
  Link2,
  BarChart3,
  Search,
  ListOrdered,
  type LucideIcon,
} from 'lucide-react';
import type { ToolBadge, ToolCategory } from '@/features/tools/types';

export interface ToolDefinition {
  id: string;
  path: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: ToolCategory;
  badge: ToolBadge;
}

/**
 * Single source of truth for Tools hub cards and routes.
 * Backend: /v1/tools/* (SerpAPI, Open PageRank, DataForSEO, Sharp favicon ZIP).
 */
export const TOOLS_REGISTRY: ToolDefinition[] = [
  {
    id: 'favicon',
    path: '/tools/favicon',
    title: 'Favicon generator',
    description: 'Upload a logo; API resizes with Sharp and returns a ZIP of PNGs (16–180px).',
    icon: ImageIcon,
    category: 'Assets',
    badge: 'live',
  },
  {
    id: 'backlinks',
    path: '/tools/backlinks',
    title: 'Backlink checker',
    description: 'Referring domains and strength via DataForSEO Backlinks API.',
    icon: Link2,
    category: 'SEO',
    badge: 'beta',
  },
  {
    id: 'da-pa',
    path: '/tools/da-pa',
    title: 'Domain rank',
    description: 'Open PageRank scores (0–10) for one or two domains — not Moz DA/PA.',
    icon: BarChart3,
    category: 'SEO',
    badge: 'beta',
  },
  {
    id: 'keywords',
    path: '/tools/keywords',
    title: 'Keyword research',
    description: 'Google Ads keyword ideas: volume, competition, CPC (DataForSEO).',
    icon: Search,
    category: 'SEO',
    badge: 'beta',
  },
  {
    id: 'serp-top-100',
    path: '/tools/serp-top-100',
    title: 'SERP Top 100',
    description: 'Google organic results up to 100 via SerpAPI.',
    icon: ListOrdered,
    category: 'SEO',
    badge: 'beta',
  },
];

export const TOOL_CATEGORIES: ToolCategory[] = ['SEO', 'Assets', 'Productivity'];

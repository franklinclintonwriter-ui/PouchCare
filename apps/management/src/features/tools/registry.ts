import {
  ImageIcon,
  Link2,
  BarChart3,
  Search,
  ListOrdered,
  Crosshair,
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
    description: 'Sharp-powered PNG sizes (16–180px) packaged as a production-ready ZIP.',
    icon: ImageIcon,
    category: 'Assets',
    badge: 'live',
  },
  {
    id: 'backlinks',
    path: '/tools/backlinks',
    title: 'Backlink checker',
    description: 'Referring domains, DR/UR-style metrics, anchors — exportable for audits.',
    icon: Link2,
    category: 'SEO',
    badge: 'beta',
  },
  {
    id: 'da-pa',
    path: '/tools/da-pa',
    title: 'Domain rank',
    description: 'Open PageRank 0–10 for one or two domains; optional side-by-side compare.',
    icon: BarChart3,
    category: 'SEO',
    badge: 'beta',
  },
  {
    id: 'keywords',
    path: '/tools/keywords',
    title: 'Keyword research',
    description: 'Expand a seed into ideas with volume, KD, CPC, intent, and trend.',
    icon: Search,
    category: 'SEO',
    badge: 'beta',
  },
  {
    id: 'serp-top-100',
    path: '/tools/serp-top-100',
    title: 'SERP Top 100',
    description: 'Top 100 organic results per keyword & market; filter, paginate, CSV.',
    icon: ListOrdered,
    category: 'SEO',
    badge: 'beta',
  },
  {
    id: 'serp-rank-check',
    path: '/tools/serp-rank-check',
    title: 'SERP rank check',
    description: 'Find organic position for your domain on a keyword (optional location & Google domain).',
    icon: Crosshair,
    category: 'SEO',
    badge: 'beta',
  },
];

export const TOOL_CATEGORIES: ToolCategory[] = ['SEO', 'Assets', 'Productivity'];

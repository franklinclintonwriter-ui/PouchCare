import { useState, useMemo } from "react";
import PageShell from "../../../components/ui/PageShell";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { MetricTile, OpsPanel, StatusBadge } from "../../shared/components";
import {
  Blocks,
  LayoutGrid,
  ShoppingCart,
  MessageSquare,
  Star,
  Phone,
  CreditCard,
  HelpCircle,
  Megaphone,
  Search,
} from "lucide-react";

/**
 * @typedef {Object} BlockItem
 * @property {string} slug
 * @property {string} name
 * @property {string} description
 * @property {string} category
 * @property {import("lucide-react").LucideIcon} icon
 * @property {number} usageCount
 * @property {string} status
 */

/** @type {BlockItem[]} */
const BLOCKS = [
  {
    slug: "hero",
    name: "Hero Section",
    description: "Full-width hero banner with heading, subheading, CTA buttons, and optional background image.",
    category: "Layout",
    icon: LayoutGrid,
    usageCount: 47,
    status: "Active",
  },
  {
    slug: "pricing",
    name: "Pricing Table",
    description: "Responsive pricing cards with feature lists, toggle for monthly/yearly, and checkout CTA.",
    category: "Commerce",
    icon: CreditCard,
    usageCount: 32,
    status: "Active",
  },
  {
    slug: "features",
    name: "Features Grid",
    description: "Configurable grid of feature cards with icons, titles, and descriptions.",
    category: "Content",
    icon: Blocks,
    usageCount: 41,
    status: "Active",
  },
  {
    slug: "faq",
    name: "FAQ Accordion",
    description: "Expandable question/answer accordion with smooth animations and schema markup.",
    category: "Content",
    icon: HelpCircle,
    usageCount: 28,
    status: "Active",
  },
  {
    slug: "cta",
    name: "Call to Action",
    description: "Prominent CTA section with headline, description, and primary/secondary action buttons.",
    category: "Layout",
    icon: Megaphone,
    usageCount: 53,
    status: "Active",
  },
  {
    slug: "contact",
    name: "Contact Form",
    description: "Multi-field contact form with validation, honeypot spam protection, and email delivery.",
    category: "Content",
    icon: Phone,
    usageCount: 19,
    status: "Active",
  },
  {
    slug: "footer",
    name: "Footer Section",
    description: "Multi-column footer with navigation links, social icons, newsletter signup, and copyright.",
    category: "Layout",
    icon: LayoutGrid,
    usageCount: 12,
    status: "Active",
  },
  {
    slug: "testimonials",
    name: "Testimonials",
    description: "Carousel or grid of customer testimonials with avatar, name, role, and star rating.",
    category: "Social",
    icon: Star,
    usageCount: 36,
    status: "Active",
  },
];

const CATEGORIES = ["All", "Layout", "Content", "Commerce", "Social"];

/**
 * Block Library admin page.
 * Displays all PouchCare custom blocks with filtering and usage metrics.
 * @returns {JSX.Element}
 */
export default function BlockLibrary() {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const filtered = useMemo(() => {
    let items = BLOCKS;
    if (categoryFilter !== "All") {
      items = items.filter((b) => b.category === categoryFilter);
    }
    if (query) {
      const q = query.toLowerCase();
      items = items.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q)
      );
    }
    return items;
  }, [categoryFilter, query]);

  const totalBlocks = BLOCKS.length;
  const activeBlocks = BLOCKS.filter((b) => b.status === "Active").length;
  const avgUsage = Math.round(
    BLOCKS.reduce((sum, b) => sum + b.usageCount, 0) / totalBlocks
  );

  return (
    <PageShell
      title="Block Library"
      description="Browse and manage all PouchCare custom Gutenberg blocks."
    >
      {/* Metric tiles */}
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <MetricTile label="Total Blocks" value={totalBlocks} hint="Registered custom blocks" />
        <MetricTile label="Active Blocks" value={activeBlocks} hint="Currently enabled" />
        <MetricTile label="Avg Usage" value={avgUsage} hint="Average uses per block" />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Input
          icon={Search}
          placeholder="Search blocks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="max-w-[10rem]"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All Categories" : c}
            </option>
          ))}
        </Select>
      </div>

      {/* Block cards grid */}
      <OpsPanel
        title="Custom Blocks"
        subtitle={`${filtered.length} block${filtered.length !== 1 ? "s" : ""} found`}
      >
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No blocks match your filters.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((block) => {
              const Icon = block.icon;
              return (
                <div
                  key={block.slug}
                  className="group flex flex-col rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">
                        {block.name}
                      </h4>
                      <p className="text-xs text-slate-500">pouchcare/{block.slug}</p>
                    </div>
                  </div>
                  <p className="mb-3 flex-1 text-xs leading-relaxed text-slate-600">
                    {block.description}
                  </p>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <StatusBadge value={block.category} />
                    <span className="text-xs text-slate-500">
                      {block.usageCount} uses
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </OpsPanel>
    </PageShell>
  );
}

import { useState, useMemo } from "react";
import PageShell from "../../../components/ui/PageShell";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { MetricTile, OpsPanel, StatusBadge } from "../../shared/components";
import { Search, Eye } from "lucide-react";

/**
 * @typedef {Object} PatternItem
 * @property {string} slug
 * @property {string} name
 * @property {string} description
 * @property {string} category
 * @property {number} usesCount
 */

/** @type {PatternItem[]} */
const PATTERNS = [
  {
    slug: "landing-hero",
    name: "Landing Hero",
    description: "Full-width hero pattern with headline, subtitle, dual CTA buttons, and gradient background.",
    category: "Layout",
    usesCount: 34,
  },
  {
    slug: "feature-grid",
    name: "Feature Grid",
    description: "3-column feature grid with icon boxes, headings, and short descriptions.",
    category: "Content",
    usesCount: 29,
  },
  {
    slug: "pricing-three",
    name: "Pricing Three-Tier",
    description: "Three pricing cards with highlighted recommended plan and feature comparison.",
    category: "Commerce",
    usesCount: 22,
  },
  {
    slug: "testimonial-slider",
    name: "Testimonial Slider",
    description: "Carousel of customer testimonials with avatars, quotes, and star ratings.",
    category: "Social",
    usesCount: 38,
  },
  {
    slug: "cta-split",
    name: "CTA Split Layout",
    description: "Two-column CTA with image on one side and persuasive copy on the other.",
    category: "Layout",
    usesCount: 26,
  },
  {
    slug: "faq-accordion",
    name: "FAQ Accordion",
    description: "Expandable FAQ section with smooth open/close animations and schema markup.",
    category: "Content",
    usesCount: 31,
  },
  {
    slug: "contact-form",
    name: "Contact Form",
    description: "Contact pattern with form fields, map placeholder, and business info sidebar.",
    category: "Content",
    usesCount: 18,
  },
  {
    slug: "footer-mega",
    name: "Mega Footer",
    description: "Four-column footer with navigation, social links, newsletter, and legal links.",
    category: "Layout",
    usesCount: 15,
  },
  {
    slug: "blog-grid",
    name: "Blog Grid",
    description: "Responsive blog post grid with featured image, excerpt, author, and date.",
    category: "Content",
    usesCount: 21,
  },
  {
    slug: "about-team",
    name: "About / Team",
    description: "Team member cards with photos, names, roles, and social links.",
    category: "Social",
    usesCount: 14,
  },
  {
    slug: "stats-counter",
    name: "Stats Counter",
    description: "Animated counter section displaying key metrics and achievements.",
    category: "Content",
    usesCount: 27,
  },
  {
    slug: "comparison-table",
    name: "Comparison Table",
    description: "Feature comparison table for products or plans with check/cross indicators.",
    category: "Commerce",
    usesCount: 16,
  },
  {
    slug: "gallery-masonry",
    name: "Gallery Masonry",
    description: "Masonry-style image gallery with lightbox support and category filtering.",
    category: "Content",
    usesCount: 19,
  },
];

const CATEGORIES = ["All", "Layout", "Content", "Commerce", "Social"];

/**
 * Pattern Library admin page.
 * Displays all PouchCare theme block patterns with filtering.
 * @returns {JSX.Element}
 */
export default function PatternLibrary() {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const filtered = useMemo(() => {
    let items = PATTERNS;
    if (categoryFilter !== "All") {
      items = items.filter((p) => p.category === categoryFilter);
    }
    if (query) {
      const q = query.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      );
    }
    return items;
  }, [categoryFilter, query]);

  const totalPatterns = PATTERNS.length;
  const uniqueCategories = new Set(PATTERNS.map((p) => p.category)).size;
  const mostUsed = PATTERNS.reduce(
    (top, p) => (p.usesCount > top.usesCount ? p : top),
    PATTERNS[0]
  );

  return (
    <PageShell
      title="Pattern Library"
      description="Browse reusable block pattern compositions for site building."
    >
      {/* Metric tiles */}
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <MetricTile label="Total Patterns" value={totalPatterns} hint="Registered block patterns" />
        <MetricTile label="Categories" value={uniqueCategories} hint="Distinct pattern categories" />
        <MetricTile
          label="Most Used"
          value={mostUsed.name}
          hint={`${mostUsed.usesCount} uses`}
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Input
          icon={Search}
          placeholder="Search patterns..."
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

      {/* Pattern cards */}
      <OpsPanel
        title="Block Patterns"
        subtitle={`${filtered.length} pattern${filtered.length !== 1 ? "s" : ""} found`}
      >
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No patterns match your filters.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((pattern) => (
              <div
                key={pattern.slug}
                className="group flex flex-col rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md"
              >
                {/* Preview placeholder */}
                <div className="flex h-32 items-center justify-center rounded-t-lg bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-100">
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <Eye className="h-6 w-6" />
                    <span className="text-xs font-medium">Preview</span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {pattern.name}
                    </h4>
                    <StatusBadge value={pattern.category} />
                  </div>
                  <p className="mb-3 flex-1 text-xs leading-relaxed text-slate-600">
                    {pattern.description}
                  </p>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs font-mono text-slate-400">
                      pouchcare/{pattern.slug}
                    </span>
                    <span className="text-xs text-slate-500">
                      {pattern.usesCount} uses
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </OpsPanel>
    </PageShell>
  );
}

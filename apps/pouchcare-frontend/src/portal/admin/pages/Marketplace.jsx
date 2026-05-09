import { useState, useMemo } from "react";
import PageShell from "../../../components/ui/PageShell";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { MetricTile, StatusBadge } from "../../shared/components";
import { useFeatureGate, FEATURE_PLANS, PLAN_HIERARCHY } from "../../shared/hooks/useFeatureGate.js";
import { useLicense } from "../../shared/state/LicenseContext.jsx";

/* ------------------------------------------------------------------ */
/*  Seed data                                                          */
/* ------------------------------------------------------------------ */

/** @type {Array<MarketplaceItem>} */
const MARKETPLACE_ITEMS = [
  // Starter Templates
  { id: "mp-001", name: "Business starter", description: "Professional business template with hero, services, and contact sections.", category: "Starter Templates", rating: 4.8, installs: 1240, requiredPlan: "starter", installed: false },
  { id: "mp-002", name: "Portfolio starter", description: "Clean portfolio layout with project gallery and about page.", category: "Starter Templates", rating: 4.6, installs: 890, requiredPlan: "starter", installed: true },
  // Premium Blocks
  { id: "mp-003", name: "Testimonial carousel", description: "Animated testimonial slider with avatar, rating, and company info.", category: "Premium Blocks", rating: 4.9, installs: 2100, requiredPlan: "growth", installed: false },
  { id: "mp-004", name: "Pricing table pro", description: "Responsive pricing comparison table with toggle and feature list.", category: "Premium Blocks", rating: 4.7, installs: 1560, requiredPlan: "starter", installed: true },
  // SEO Tools
  { id: "mp-005", name: "Schema markup generator", description: "Automatic JSON-LD schema generation for pages, posts, and products.", category: "SEO Tools", rating: 4.5, installs: 780, requiredPlan: "growth", installed: false },
  { id: "mp-006", name: "Meta tag optimizer", description: "Bulk edit meta titles and descriptions with AI suggestions.", category: "SEO Tools", rating: 4.4, installs: 650, requiredPlan: "growth", installed: false },
  // E-Commerce
  { id: "mp-007", name: "WooCommerce quick view", description: "Ajax-powered product quick view modal for WooCommerce stores.", category: "E-Commerce", rating: 4.3, installs: 430, requiredPlan: "growth", installed: false },
  { id: "mp-008", name: "Cart abandonment recovery", description: "Automated email recovery for abandoned WooCommerce carts.", category: "E-Commerce", rating: 4.6, installs: 920, requiredPlan: "enterprise", installed: false },
  // Analytics
  { id: "mp-009", name: "Heatmap tracker", description: "Visual heatmap recording of clicks, scrolls, and mouse movements.", category: "Analytics", rating: 4.2, installs: 340, requiredPlan: "enterprise", installed: false },
  { id: "mp-010", name: "Conversion funnel", description: "Track visitor journeys through custom conversion funnels.", category: "Analytics", rating: 4.5, installs: 510, requiredPlan: "growth", installed: false },
  // Extra
  { id: "mp-011", name: "Form builder pro", description: "Drag-and-drop form builder with conditional logic and Zapier integration.", category: "Starter Templates", rating: 4.7, installs: 1870, requiredPlan: "starter", installed: true },
  { id: "mp-012", name: "White-label dashboard", description: "Remove PouchCare branding and apply your own logo and colors.", category: "Premium Blocks", rating: 4.9, installs: 210, requiredPlan: "enterprise", installed: false },
];

const CATEGORIES = ["All", "Starter Templates", "Premium Blocks", "SEO Tools", "E-Commerce", "Analytics"];

/**
 * @typedef {Object} MarketplaceItem
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} category
 * @property {number} rating
 * @property {number} installs
 * @property {string} requiredPlan
 * @property {boolean} installed
 */

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/**
 * Render star icons for a numeric rating.
 * @param {{ value: number }} props
 */
function Stars({ value }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${value} stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className={`h-3.5 w-3.5 ${i < Math.round(value) ? "fill-current" : "fill-slate-200"}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-slate-500">{value}</span>
    </span>
  );
}

/**
 * Plan requirement badge.
 * @param {{ plan: string }} props
 */
function PlanBadge({ plan }) {
  const colorMap = {
    community: "bg-slate-100 text-slate-600",
    starter: "bg-sky-100 text-sky-700",
    growth: "bg-violet-100 text-violet-700",
    enterprise: "bg-amber-100 text-amber-700",
  };
  const label = plan.charAt(0).toUpperCase() + plan.slice(1);
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colorMap[plan] ?? colorMap.community}`}>
      {label}
    </span>
  );
}

/**
 * Single marketplace card.
 * @param {{ item: MarketplaceItem, currentPlan: string, onInstall: (id: string) => void }} props
 */
function MarketplaceCard({ item, currentPlan, onInstall }) {
  const currentRank = PLAN_HIERARCHY.indexOf(currentPlan);
  const requiredRank = PLAN_HIERARCHY.indexOf(item.requiredPlan);
  const canInstall = currentRank >= requiredRank;
  const requiredLabel = item.requiredPlan.charAt(0).toUpperCase() + item.requiredPlan.slice(1);

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Icon placeholder */}
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      </div>

      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
        <PlanBadge plan={item.requiredPlan} />
      </div>

      <p className="mt-1 flex-1 text-xs text-slate-600 leading-relaxed">{item.description}</p>

      <div className="mt-3 flex items-center justify-between">
        <Stars value={item.rating} />
        <span className="text-[11px] text-slate-400">{item.installs.toLocaleString()} installs</span>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        {item.installed ? (
          <StatusBadge value="Installed" />
        ) : canInstall ? (
          <button
            type="button"
            onClick={() => onInstall(item.id)}
            className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            Install
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 cursor-not-allowed"
          >
            Upgrade to {requiredLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

/**
 * Marketplace page for the admin portal.
 *
 * Shows a grid of available plugins/themes with category filtering,
 * search, and plan-gated install buttons.
 */
export default function Marketplace() {
  const { plan } = useLicense();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [items, setItems] = useState(MARKETPLACE_ITEMS);

  const filtered = useMemo(() => {
    let result = items;
    if (category !== "All") {
      result = result.filter((i) => i.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, category, search]);

  const totalPlugins = items.length;
  const installedCount = items.filter((i) => i.installed).length;
  const updatesAvailable = 2; // simulated

  /** @param {string} id */
  const handleInstall = (id) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, installed: true } : i))
    );
  };

  return (
    <PageShell
      title="PouchCare Marketplace"
      description="Discover plugins, templates, and tools to extend your websites."
    >
      {/* Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricTile label="Total Plugins" value={totalPlugins} hint="Available in marketplace" />
        <MetricTile label="Installed" value={installedCount} hint="Active on your sites" />
        <MetricTile label="Updates Available" value={updatesAvailable} hint="Plugins with new versions" />
      </div>

      {/* Search bar */}
      <div className="mt-4">
        <Input
          placeholder="Search marketplace..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
        {/* Categories sidebar */}
        <aside className="w-full shrink-0 lg:w-48">
          <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                  category === cat
                    ? "bg-primary text-white font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No items match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <MarketplaceCard
                  key={item.id}
                  item={item}
                  currentPlan={plan}
                  onInstall={handleInstall}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
